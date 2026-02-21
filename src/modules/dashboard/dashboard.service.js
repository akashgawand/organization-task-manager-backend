const { getPrismaClient } = require('../../config/db');
const { TASK_STATUS } = require('../../constants/taskStatus');

const prisma = getPrismaClient();

const getAnalytics = async (dateRange) => {
    const where = dateRange ? {
        created_at: {
            gte: new Date(dateRange.start),
            lte: new Date(dateRange.end),
        },
    } : {};

    const [
        totalTasks,
        inProgressTasks,
        submittedTasks,
        rejectedTasks,
        verifiedTasks,
        completedTasks,
    ] = await Promise.all([
        prisma.task.count({ where: { ...where, is_deleted: false } }),
        prisma.task.count({ where: { ...where, status: TASK_STATUS.IN_PROGRESS, is_deleted: false } }),
        prisma.task.count({ where: { ...where, status: TASK_STATUS.SUBMITTED, is_deleted: false } }),
        prisma.task.count({ where: { ...where, status: TASK_STATUS.REJECTED, is_deleted: false } }),
        prisma.task.count({ where: { ...where, status: TASK_STATUS.VERIFIED, is_deleted: false } }),
        prisma.task.count({ where: { ...where, status: TASK_STATUS.COMPLETED, is_deleted: false } }),
    ]);

    return {
        totalTasks,
        inProgressTasks,
        submittedTasks,
        rejectedTasks,
        verifiedTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks - verifiedTasks,
    };
};

const getEmployeeProductivity = async (userId) => {
    const [tasksCompleted, tasksPending, submissions, reviews] = await Promise.all([
        prisma.task.count({
            where: {
                assigned_to: userId,
                status: { in: [TASK_STATUS.VERIFIED, TASK_STATUS.COMPLETED] },
                is_deleted: false,
            },
        }),
        prisma.task.count({
            where: {
                assigned_to: userId,
                status: { notIn: [TASK_STATUS.VERIFIED, TASK_STATUS.COMPLETED] },
                is_deleted: false,
            },
        }),
        prisma.submission.findMany({
            where: { submitted_by: userId },
            include: { reviews: true },
        }),
        prisma.review.count({ where: { reviewer_id: userId } }),
    ]);

    const approvedSubmissions = submissions.filter(s => s.reviews.some(r => r.is_approved)).length;
    const reviewSuccessRate = submissions.length > 0 ? (approvedSubmissions / submissions.length) * 100 : 0;

    return {
        tasksCompleted,
        tasksPending,
        totalSubmissions: submissions.length,
        approvedSubmissions,
        reviewSuccessRate: reviewSuccessRate.toFixed(2),
        reviewsGiven: reviews,
    };
};

const getProjectStats = async (projectId) => {
    const project = await prisma.project.findUnique({
        where: { project_id: parseInt(projectId) },
        include: {
            phases: {
                where: { is_deleted: false },
                include: {
                    _count: { select: { tasks: true } },
                },
            },
            tasks: {
                where: { is_deleted: false },
            },
        },
    });

    if (!project || project.is_deleted) throw new Error('Project not found');

    const statusBreakdown = {
        created: project.tasks.filter(t => t.status === TASK_STATUS.CREATED).length,
        assigned: project.tasks.filter(t => t.status === TASK_STATUS.ASSIGNED).length,
        inProgress: project.tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
        submitted: project.tasks.filter(t => t.status === TASK_STATUS.SUBMITTED).length,
        underReview: project.tasks.filter(t => t.status === TASK_STATUS.UNDER_REVIEW).length,
        rejected: project.tasks.filter(t => t.status === TASK_STATUS.REJECTED).length,
        verified: project.tasks.filter(t => t.status === TASK_STATUS.VERIFIED).length,
        completed: project.tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length,
    };

    const phaseDistribution = project.phases.map(phase => ({
        phase_id: phase.phase_id,
        name: phase.name,
        taskCount: phase._count.tasks,
    }));

    const completionRate = project.tasks.length > 0
        ? ((statusBreakdown.verified + statusBreakdown.completed) / project.tasks.length) * 100
        : 0;

    return {
        project: {
            project_id: project.project_id,
            name: project.name,
        },
        totalTasks: project.tasks.length,
        statusBreakdown,
        phaseDistribution,
        completionRate: completionRate.toFixed(2),
    };
};

module.exports = {
    getAnalytics,
    getEmployeeProductivity,
    getProjectStats,
};
