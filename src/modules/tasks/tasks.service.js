const { getPrismaClient } = require('../../config/db');
const { getPaginationParams, createPaginatedResponse } = require('../../utils/pagination');
const { TASK_STATUS, isValidTransition, ACTIVITY_TYPES } = require('../../constants/taskStatus');

const prisma = getPrismaClient();

// Hierarchical assignment rules
const ROLE_RANK = {
    'SUPER_ADMIN': 5,
    'ADMIN': 4,
    'TEAM_LEAD': 3,
    'SENIOR_DEVELOPER': 2,
    'EMPLOYEE': 1
};

const checkAssignmentPermission = async (assignerId, assignerRole, assigneeIds) => {
    if (!assigneeIds || assigneeIds.length === 0) return;
    if (assignerRole === 'SUPER_ADMIN') return;

    const ids = assigneeIds.map(Number);
    const assignees = await prisma.user.findMany({
        where: { user_id: { in: ids } },
        select: { user_id: true, role: true }
    });

    for (const assignee of assignees) {
        // Can always assign to self
        if (assignee.user_id === assignerId) continue;

        const assignerRank = ROLE_RANK[assignerRole] || 0;
        const assigneeRank = ROLE_RANK[assignee.role] || 0;

        // Can only assign to strictly lower roles (Super Admin is exempt)
        if (assignerRank <= assigneeRank) {
            throw new Error(`Action forbidden: ${assignerRole} cannot assign tasks to ${assignee.role}`);
        }
    }
};

// Common include for task queries
const taskInclude = {
    project: { select: { project_id: true, name: true } },
    phase: { select: { phase_id: true, name: true } },
    creator: { select: { user_id: true, full_name: true, email: true } },
    assignees: { select: { user_id: true, full_name: true, email: true, avatar: true } },
    subtasks: { orderBy: { created_at: 'asc' } },
};

const createTask = async (taskData, userId, userRole) => {
    const { title, description, project_id, phase_id, assigned_to, assignee_ids, deadline, priority, subtasks } = taskData;

    // Support both single assigned_to and array of assignee_ids
    const assigneeIdList = assignee_ids
        ? assignee_ids.map(Number)
        : assigned_to
            ? [Number(assigned_to)]
            : [];

    // Hierarchical assignment check
    await checkAssignmentPermission(userId, userRole, assigneeIdList);

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { project_id: parseInt(project_id) } });
    if (!project || project.is_deleted) throw new Error('Project not found');

    // Verify phase if provided
    if (phase_id) {
        const phase = await prisma.phase.findUnique({ where: { phase_id: parseInt(phase_id) } });
        if (!phase || phase.is_deleted) throw new Error('Phase not found');
        if (phase.project_id !== parseInt(project_id)) throw new Error('Phase does not belong to this project');
    }

    const task = await prisma.task.create({
        data: {
            title,
            description,
            project_id: parseInt(project_id),
            ...(phase_id && { phase_id: parseInt(phase_id) }),
            created_by: userId,
            deadline: deadline ? new Date(deadline) : null,
            priority: (priority || 'MEDIUM').toUpperCase(),
            status: assigneeIdList.length > 0 ? TASK_STATUS.ASSIGNED : TASK_STATUS.CREATED,
            ...(assigneeIdList.length > 0 && {
                assignees: {
                    connect: assigneeIdList.map((id) => ({ user_id: id })),
                },
            }),
            ...(subtasks && subtasks.length > 0 && {
                subtasks: {
                    create: subtasks.map((s) => ({ title: s.title })),
                },
            }),
        },
        include: taskInclude,
    });

    // Log activity
    await prisma.activityLog.create({
        data: {
            user_id: userId,
            task_id: task.task_id,
            activity_type: ACTIVITY_TYPES.TASK_CREATED,
            description: `Created task: ${title}`,
        },
    });

    return task;
};

const getTasks = async (query, userId, userRole) => {
    const { skip, take } = getPaginationParams(query.page, query.limit);

    const where = {
        is_deleted: false,
        ...(query.project_id && { project_id: parseInt(query.project_id) }),
        ...(query.phase_id && { phase_id: parseInt(query.phase_id) }),
        ...(query.status && { status: query.status }),
        ...(query.priority && { priority: query.priority }),
        // assigned_to filter: match via the many-to-many assignees relation
        ...(query.assigned_to && {
            assignees: { some: { user_id: parseInt(query.assigned_to) } },
        }),
        // Super Admins see everything (constrained by query filters).
        // Admins see everything EXCEPT tasks created by or assigned to a Super Admin.
        ...(userRole === 'ADMIN' && {
            AND: [
                { NOT: { assignees: { some: { role: 'SUPER_ADMIN' } } } },
                { NOT: { creator: { role: 'SUPER_ADMIN' } } }
            ]
        }),
        // Non-admins see only tasks assigned to them, created by them, or on their teams (in a fuller implementation)
        // For now, retaining existing member-only visibility logic for employees/leads
        ...((userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') && {
            OR: [
                { assignees: { some: { user_id: userId } } },
                { created_by: userId },
            ],
        }),
    };

    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where,
            skip,
            take,
            include: taskInclude,
            orderBy: { created_at: 'desc' },
        }),
        prisma.task.count({ where }),
    ]);

    return createPaginatedResponse(tasks, total, query.page, query.limit);
};

const getTaskById = async (taskId) => {
    const task = await prisma.task.findUnique({
        where: { task_id: parseInt(taskId) },
        include: {
            ...taskInclude,
            subtasks: {
                orderBy: { created_at: 'asc' },
            },
            comments: {
                include: {
                    user: { select: { user_id: true, full_name: true, avatar: true } },
                },
                orderBy: { created_at: 'asc' },
            },
            submissions: {
                include: {
                    submitter: { select: { user_id: true, full_name: true } },
                    reviews: {
                        include: {
                            reviewer: { select: { user_id: true, full_name: true } },
                        },
                    },
                },
                orderBy: { submitted_at: 'desc' },
            },
        },
    });

    if (!task || task.is_deleted) throw new Error('Task not found');
    return task;
};

const updateTask = async (taskId, updateData, userId, userRole) => {
    const task = await prisma.task.findUnique({ where: { task_id: parseInt(taskId) } });
    if (!task || task.is_deleted) throw new Error('Task not found');

    // Handle assignee and subtask update
    const { assignee_ids, assigned_to, subtasks, ...rest } = updateData;
    const assigneeIdList = assignee_ids
        ? assignee_ids.map(Number)
        : assigned_to
            ? [Number(assigned_to)]
            : null;

    // Hierarchical assignment check
    if (assigneeIdList !== null) {
        await checkAssignmentPermission(userId, userRole, assigneeIdList);
    }

    const updatedTask = await prisma.task.update({
        where: { task_id: parseInt(taskId) },
        data: {
            ...rest,
            ...(assigneeIdList !== null && {
                assignees: {
                    set: assigneeIdList.map((id) => ({ user_id: id })),
                },
            }),
            ...(subtasks && {
                subtasks: {
                    deleteMany: {},
                    create: subtasks.map((s) => ({
                        title: s.title,
                        is_completed: s.is_completed || false,
                    })),
                },
            }),
        },
        include: taskInclude,
    });

    await prisma.activityLog.create({
        data: {
            user_id: userId,
            task_id: updatedTask.task_id,
            activity_type: ACTIVITY_TYPES.TASK_UPDATED,
            description: `Updated task: ${updatedTask.title}`,
        },
    });

    return updatedTask;
};

const updateTaskStatus = async (taskId, newStatus, userId) => {
    const task = await prisma.task.findUnique({ where: { task_id: parseInt(taskId) } });
    if (!task || task.is_deleted) throw new Error('Task not found');

    if (!isValidTransition(task.status, newStatus)) {
        throw new Error(`Invalid status transition from ${task.status} to ${newStatus}`);
    }

    const updatedTask = await prisma.task.update({
        where: { task_id: parseInt(taskId) },
        data: { status: newStatus },
        include: {
            project: { select: { name: true } },
            assignees: { select: { full_name: true } },
        },
    });

    await prisma.activityLog.create({
        data: {
            user_id: userId,
            task_id: updatedTask.task_id,
            activity_type: ACTIVITY_TYPES.TASK_STATUS_CHANGED,
            description: `Changed task status from ${task.status} to ${newStatus}`,
        },
    });

    return updatedTask;
};

const assignTask = async (taskId, assignedTo, userId) => {
    const task = await prisma.task.findUnique({ where: { task_id: parseInt(taskId) } });
    if (!task || task.is_deleted) throw new Error('Task not found');

    const assigneeIds = Array.isArray(assignedTo) ? assignedTo.map(Number) : [Number(assignedTo)];

    // Verify all assignees exist and are active
    const assignees = await prisma.user.findMany({
        where: { user_id: { in: assigneeIds }, is_active: true },
    });
    if (assignees.length !== assigneeIds.length) throw new Error('One or more assignees not found or inactive');

    const updatedTask = await prisma.task.update({
        where: { task_id: parseInt(taskId) },
        data: {
            status: TASK_STATUS.ASSIGNED,
            assignees: {
                set: assigneeIds.map((id) => ({ user_id: id })),
            },
        },
        include: {
            assignees: { select: { user_id: true, full_name: true, email: true } },
        },
    });

    await prisma.activityLog.create({
        data: {
            user_id: userId,
            task_id: updatedTask.task_id,
            activity_type: ACTIVITY_TYPES.TASK_ASSIGNED,
            description: `Assigned task to ${assignees.map((a) => a.full_name).join(', ')}`,
        },
    });

    return updatedTask;
};

const deleteTask = async (taskId) => {
    const task = await prisma.task.findUnique({ where: { task_id: parseInt(taskId) } });
    if (!task || task.is_deleted) throw new Error('Task not found');

    await prisma.task.update({
        where: { task_id: parseInt(taskId) },
        data: { is_deleted: true },
    });
};

const addComment = async (taskId, content, userId) => {
    const task = await prisma.task.findUnique({ where: { task_id: parseInt(taskId) } });
    if (!task || task.is_deleted) throw new Error('Task not found');

    if (!content || !content.trim()) throw new Error('Comment content is required');

    const comment = await prisma.comment.create({
        data: {
            task_id: parseInt(taskId),
            user_id: userId,
            content: content.trim(),
            mentions: [],
            reactions: [],
        },
        include: {
            user: { select: { user_id: true, full_name: true, avatar: true } },
        },
    });

    return comment;
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    updateTaskStatus,
    assignTask,
    deleteTask,
    addComment,
};
