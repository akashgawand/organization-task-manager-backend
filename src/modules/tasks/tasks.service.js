const { getPrismaClient } = require('../../config/db');
const { getPaginationParams, createPaginatedResponse } = require('../../utils/pagination');
const { TASK_STATUS, isValidTransition, ACTIVITY_TYPES } = require('../../constants/taskStatus');
const notificationService = require('../notifications/notification.service');
const admin = require('../../config/firebase');

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
    attachments: {
        select: {
            attachment_id: true,
            file_name: true,
            file_url: true,
            file_type: true,
            file_size: true,
            uploaded_by: true,
            created_at: true,
        },
        orderBy: { created_at: 'desc' },
    },
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

    if (assigneeIdList.length > 0) {
        // Find team lead if task belongs to team
        let team_lead_id = null;
        if (project.team_id) {
            const team = await prisma.team.findUnique({ where: { team_id: project.team_id } });
            if (team) team_lead_id = team.lead_id;
        }

        await notificationService.queueEvent(ACTIVITY_TYPES.TASK_ASSIGNED, {
            task_id: task.task_id,
            task_title: task.title,
            assignees: assigneeIdList,
            actor_id: userId,
            team_lead_id
        });
    }

    if (priority === 'CRITICAL') {
        await notificationService.queueEvent('CRITICAL_TASK_ASSIGNED', {
            task_id: task.task_id,
            task_title: task.title,
            actor_id: userId
        });
    }

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
            ...(rest.phase_id !== undefined && {
                phase_id: parseInt(rest.phase_id)
            }),
            ...(rest.deadline !== undefined && {
                deadline: rest.deadline ? new Date(rest.deadline) : null
            }),
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

const updateTaskStatus = async (taskId, newStatus, userId, userRole = null) => {
    const task = await prisma.task.findUnique({ where: { task_id: parseInt(taskId) } });
    if (!task || task.is_deleted) throw new Error('Task not found');

    const isCreator = task.created_by === userId;

    if (!isValidTransition(task.status, newStatus, userRole, isCreator)) {
        throw new Error(`Invalid status transition from ${task.status} to ${newStatus}`);
    }

    const updatedTask = await prisma.task.update({
        where: { task_id: parseInt(taskId) },
        data: { status: newStatus },
        include: {
            project: { select: { name: true, team_id: true } },
            assignees: { select: { user_id: true, full_name: true } },
        },
    });

    const actor = await prisma.user.findUnique({
        where: { user_id: userId },
        select: { full_name: true }
    });

    await prisma.activityLog.create({
        data: {
            user_id: userId,
            task_id: updatedTask.task_id,
            activity_type: ACTIVITY_TYPES.TASK_STATUS_CHANGED,
            description: `Changed task status from ${task.status} to ${newStatus}`,
        },
    });

    // Find team lead if exists
    let team_lead_id = null;
    if (updatedTask.project && updatedTask.project.team_id) {
        const team = await prisma.team.findUnique({ where: { team_id: updatedTask.project.team_id } });
        if (team) team_lead_id = team.lead_id;
    }

    await notificationService.queueEvent(ACTIVITY_TYPES.TASK_STATUS_CHANGED, {
        task_id: task.task_id,
        task_title: task.title,
        old_status: task.status,
        new_status: newStatus,
        assignees: updatedTask.assignees.map(a => a.user_id),
        assignee_names: updatedTask.assignees.map(a => a.full_name).join(', '),
        actor_id: userId,
        actor_name: actor ? actor.full_name : 'System',
        team_lead_id
    });

    if (newStatus === TASK_STATUS.BLOCKED) {

        await notificationService.queueEvent('TASK_BLOCKED', {
            task_id: task.task_id,
            task_title: task.title,
            actor_id: userId,
            team_lead_id
        });
    }

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

    // Notify new assignees
    let team_lead_id = null;
    const proj = await prisma.project.findUnique({ where: { project_id: task.project_id } });
    if (proj && proj.team_id) {
        const team = await prisma.team.findUnique({ where: { team_id: proj.team_id } });
        if (team) team_lead_id = team.lead_id;
    }

    await notificationService.queueEvent(ACTIVITY_TYPES.TASK_ASSIGNED, {
        task_id: task.task_id,
        task_title: task.title,
        assignees: assigneeIds,
        actor_id: userId,
        team_lead_id
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
    const task = await prisma.task.findUnique({
        where: { task_id: parseInt(taskId) },
        include: {
            assignees: { select: { user_id: true, fcm_tokens: true } },
            creator: { select: { user_id: true, fcm_tokens: true } }
        }
    });

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

    // Check for mentions using regex
    const mentionRegex = /@\[(\d+)\]/g;
    const mentionedUsers = [];
    let match;
    while ((match = mentionRegex.exec(content.trim())) !== null) {
        mentionedUsers.push(parseInt(match[1]));
    }

    if (mentionedUsers.length > 0) {
        await prisma.comment.update({
            where: { comment_id: comment.comment_id },
            data: { mentions: mentionedUsers }
        });

        await notificationService.queueEvent('MENTIONED', {
            entity_type: 'COMMENT',
            entity_id: comment.comment_id,
            mentioned_users: mentionedUsers,
            actor_id: userId,
            actor_name: comment.user.full_name
        });
    }

    // Dispatch FCM
    const tokens = new Set();

    // gather tokens from assignees
    task.assignees.forEach(a => {
        if (a.user_id !== userId && a.fcm_tokens) {
            let t = [];
            try { t = Array.isArray(a.fcm_tokens) ? a.fcm_tokens : (typeof a.fcm_tokens === 'string' ? JSON.parse(a.fcm_tokens) : []); } catch (e) { }
            t.forEach(token => tokens.add(token));
        }
    });
    // gather creator token
    if (task.creator && task.creator.user_id !== userId && task.creator.fcm_tokens) {
        let t = [];
        try { t = Array.isArray(task.creator.fcm_tokens) ? task.creator.fcm_tokens : (typeof task.creator.fcm_tokens === 'string' ? JSON.parse(task.creator.fcm_tokens) : []); } catch (e) { }
        t.forEach(token => tokens.add(token));
    }

    if (tokens.size > 0 && admin && admin.messaging) {
        try {
            const message = {
                notification: {
                    title: `New comment on: ${task.title}`,
                    body: `${comment.user.full_name}: ${content.trim()}`
                },
                data: {
                    url: `/dashboard/projects/${task.project_id}?task=${task.task_id}`
                },
                tokens: Array.from(tokens)
            };
            await admin.messaging().sendEachForMulticast(message);
        } catch (e) {
            console.error('Error sending FCM:', e);
        }
    }

    return comment;
};

const requestExtension = async (taskId, userId, reason, requestedDate) => {
    const task = await prisma.task.findUnique({
        where: { task_id: parseInt(taskId) },
        include: {
            project: { select: { team_id: true } }
        }
    });

    if (!task || task.is_deleted) throw new Error('Task not found');

    const actor = await prisma.user.findUnique({
        where: { user_id: userId },
        select: { full_name: true }
    });

    let team_lead_id = null;
    if (task.project && task.project.team_id) {
        const team = await prisma.team.findUnique({ where: { team_id: task.project.team_id } });
        if (team) team_lead_id = team.lead_id;
    }

    // Queue notification event for the creator (and admins via worker)
    await notificationService.queueEvent('EXTENSION_REQUESTED', {
        task_id: task.task_id,
        task_title: task.title,
        actor_id: userId,
        actor_name: actor ? actor.full_name : 'User',
        reason: reason,
        requested_date: requestedDate,
        creator_id: task.created_by,
        team_lead_id: team_lead_id
    });
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
    requestExtension,
};
