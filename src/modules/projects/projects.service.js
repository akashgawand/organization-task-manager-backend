const { getPrismaClient } = require('../../config/db');
const { getPaginationParams, createPaginatedResponse } = require('../../utils/pagination');
const { ACTIVITY_TYPES } = require('../../constants/taskStatus');
const logger = require('../../utils/logger');
const notificationService = require('../notifications/notification.service');

const prisma = getPrismaClient();

// Default waterfall phases
const DEFAULT_PHASES = [
    { name: 'Requirement', description: 'Requirements gathering and analysis', display_order: 1 },
    { name: 'Design', description: 'System design and architecture', display_order: 2 },
    { name: 'Development', description: 'Implementation and coding', display_order: 3 },
    { name: 'Testing', description: 'Quality assurance and testing', display_order: 4 },
    { name: 'Deployment', description: 'Production deployment and release', display_order: 5 },
];

/**
 * Create project with phases (custom or default waterfall)
 */
const createProject = async (projectData, userId) => {
    const { name, description, status, priority, team_id, start_date, end_date, phases: customPhases } = projectData;

    // Use custom phases if provided, otherwise fall back to defaults
    const phasesToCreate = (customPhases && customPhases.length > 0)
        ? customPhases.map((p, idx) => ({
            name: p.name || `Phase ${idx + 1}`,
            description: p.description || '',
            display_order: p.display_order ?? idx + 1,
            status: (p.status || 'planning').toUpperCase(),
            start_date: p.start_date ? new Date(p.start_date) : null,
            end_date: p.end_date ? new Date(p.end_date) : null,
        }))
        : DEFAULT_PHASES.map((phase) => ({
            name: phase.name,
            description: phase.description,
            display_order: phase.display_order,
        }));

    // Build project data object, only including defined optional fields
    const projectCreateData = {
        name,
        description,
        created_by: userId,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(team_id && { team_id: parseInt(team_id) }),
        ...(start_date && { start_date: new Date(start_date) }),
        ...(end_date && { end_date: new Date(end_date) }),
    };

    // Create project and phases in a transaction
    const project = await prisma.$transaction(async (tx) => {
        // Create project
        const newProject = await tx.project.create({
            data: projectCreateData,
        });

        // Create phases
        await tx.phase.createMany({
            data: phasesToCreate.map((phase) => ({
                project_id: newProject.project_id,
                ...phase,
            })),
        });

        // Log activity
        await tx.activityLog.create({
            data: {
                user_id: userId,
                activity_type: ACTIVITY_TYPES.PROJECT_CREATED,
                description: `Created project: ${name}`,
                metadata: JSON.stringify({ project_id: newProject.project_id }),
            },
        });

        return newProject;
    });

    logger.info(`Project created with ${phasesToCreate.length} phases: ${name}`);

    // Notify about project creation
    await notificationService.queueEvent(ACTIVITY_TYPES.PROJECT_CREATED, {
        project_id: project.project_id,
        project_name: project.name,
        actor_id: userId
    });

    // Fetch project with phases
    return getProjectById(project.project_id);
};


/**
 * Get all projects with pagination
 */
const getProjects = async ({ page, limit, search }, userId) => {
    const { skip, take } = getPaginationParams(page, limit);

    // Fetch role from DB via Prisma (new RBAC)
    const roleAssignment = await prisma.userRoleAssignment.findFirst({
        where: { user_id: userId },
        include: { role: true },
    });
    const userRole = roleAssignment?.role?.name || 'EMPLOYEE';

    const where = {
        is_deleted: false,
        ...(search && {
            OR: [
                { name: { contains: search } },
                { description: { contains: search } },
            ],
        }),
        // Employees only see projects they're involved in (as creator or task assignee)
        ...(userRole === 'EMPLOYEE' && {
            OR: [
                { created_by: userId },
                { tasks: { some: { assignees: { some: { user_id: userId } } } } },
            ],
        }),
    };

    const [projects, total] = await Promise.all([
        prisma.project.findMany({
            where,
            skip,
            take,
            include: {
                creator: {
                    select: {
                        user_id: true,
                        full_name: true,
                        email: true,
                    },
                },
                team: {
                    include: {
                        members: {
                            select: {
                                user_id: true,
                                full_name: true,
                                email: true,
                                avatar: true,
                            },
                        },
                    },
                },
                tasks: {
                    where: { status: 'DONE' },
                    select: { task_id: true },
                },
                _count: {
                    select: {
                        phases: true,
                        tasks: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        }),
        prisma.project.count({ where }),
    ]);

    const formattedProjects = projects.map(p => ({
        ...p,
        completedTaskCount: p.tasks.length,
        taskCount: p._count.tasks,
        tasks: undefined, // Remove the heavy tasks array
        _count: undefined,
        members: p.team?.members || [],
    }));

    return createPaginatedResponse(formattedProjects, total, page, limit);
};

/**
 * Get project by ID with phases, team members, and task counts
 */
const getProjectById = async (projectId) => {
    const project = await prisma.project.findUnique({
        where: { project_id: parseInt(projectId) },
        include: {
            creator: {
                select: {
                    user_id: true,
                    full_name: true,
                    email: true,
                    avatar: true,
                },
            },
            team: {
                include: {
                    members: {
                        select: {
                            user_id: true,
                            full_name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            },
            phases: {
                where: { is_deleted: false },
                orderBy: { display_order: 'asc' },
                include: {
                    _count: {
                        select: { tasks: true },
                    },
                },
            },
            tasks: {
                where: { is_deleted: false, status: 'DONE' },
                select: { task_id: true },
            },
            _count: {
                select: { tasks: true },
            },
        },
    });

    if (!project || project.is_deleted) {
        throw new Error('Project not found');
    }

    return {
        ...project,
        completedTaskCount: project.tasks.length,
        taskCount: project._count.tasks,
        tasks: undefined,
        _count: undefined,
        members: project.team?.members || [],
    };
};

/**
 * Update project
 */
const updateProject = async (projectId, updateData, userId) => {
    const project = await prisma.project.findUnique({
        where: { project_id: parseInt(projectId) },
    });

    if (!project || project.is_deleted) {
        throw new Error('Project not found');
    }

    const updatedProject = await prisma.project.update({
        where: { project_id: parseInt(projectId) },
        data: updateData,
        include: {
            creator: {
                select: {
                    user_id: true,
                    full_name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    phases: true,
                    tasks: true,
                },
            },
        },
    });

    // Log activity
    await prisma.activityLog.create({
        data: {
            user_id: userId,
            activity_type: ACTIVITY_TYPES.PROJECT_UPDATED,
            description: `Updated project: ${updatedProject.name}`,
            metadata: JSON.stringify({ project_id: updatedProject.project_id }),
        },
    });

    return updatedProject;
};

/**
 * Soft delete project with cascade
 */
const deleteProject = async (projectId, userId) => {
    const project = await prisma.project.findUnique({
        where: { project_id: parseInt(projectId) },
    });

    if (!project || project.is_deleted) {
        throw new Error('Project not found');
    }

    // Soft delete project, phases, and tasks in transaction
    await prisma.$transaction(async (tx) => {
        // Soft delete project
        await tx.project.update({
            where: { project_id: parseInt(projectId) },
            data: { is_deleted: true },
        });

        // Soft delete all phases
        await tx.phase.updateMany({
            where: { project_id: parseInt(projectId) },
            data: { is_deleted: true },
        });

        // Soft delete all tasks
        await tx.task.updateMany({
            where: { project_id: parseInt(projectId) },
            data: { is_deleted: true },
        });
    });

    logger.info(`Project deleted: ${project.name}`);
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
};
