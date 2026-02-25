const { getPrismaClient } = require('../../config/db');
const prisma = getPrismaClient();

/**
 * Get dashboard aggregate overview metrics
 * @returns {Promise<Object>}
 */
const getDashboardOverview = async () => {

    // 1. Projects Breakdown
    const activeProjectsCount = await prisma.project.count({
        where: { status: 'ACTIVE' }
    });

    // 2. Tasks Breakdown
    const activeTasksCount = await prisma.task.count({
        where: { status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED'] } }
    });

    const completedTasksCount = await prisma.task.count({
        where: { status: 'DONE' }
    });

    const overdueTasksCount = await prisma.task.count({
        where: {
            deadline: { lt: new Date() },
            status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED'] }
        }
    });

    // 3. Status Distribution (Donut Chart)
    const statusGroups = await prisma.task.groupBy({
        by: ['status'],
        _count: {
            task_id: true
        }
    });

    // Normalize for the frontend Highcharts `{name, value}` format
    const statusDistribution = statusGroups.map(group => ({
        name: group.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: group._count.task_id
    }));

    // 4. User Completed Tasks (Bar Chart)
    // Since it's an implicit many-to-many, we fetch tasks that are 'done' along with their assignees
    const completedTasks = await prisma.task.findMany({
        where: { status: 'DONE' },
        select: {
            assignees: {
                select: { user_id: true, full_name: true }
            }
        }
    });

    const userTaskCounts = {};

    completedTasks.forEach(task => {
        task.assignees.forEach(assignee => {
            if (!userTaskCounts[assignee.user_id]) {
                userTaskCounts[assignee.user_id] = {
                    name: assignee.full_name,
                    completed: 0
                };
            }
            userTaskCounts[assignee.user_id].completed += 1;
        });
    });

    const userCompletedTasks = Object.values(userTaskCounts);

    // Sort descending by highest completion
    userCompletedTasks.sort((a, b) => b.completed - a.completed);

    return {
        activeProjectsCount,
        activeTasksCount,
        completedTasksCount,
        overdueTasksCount,
        statusDistribution,
        userCompletedTasks
    };
};

/**
 * Get task completion vs creation trend over a date range
 * @param {string} [startDate]
 * @param {string} [endDate]
 * @returns {Promise<Array>}
 */
const getTrendData = async (startDate, endDate) => {
    // Helper: get YYYY-MM-DD in server local time (IST)
    const toLocalDateStr = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Default to last 14 days if not provided
    let start = new Date();
    let end = new Date();

    if (startDate) start = new Date(startDate);
    else start.setDate(end.getDate() - 13);

    if (endDate) end = new Date(endDate);

    // Set to local day boundaries
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const startStr = toLocalDateStr(start);
    const endStr = toLocalDateStr(end);

    const data = [];

    // Fetch all relevant tasks within the broad window
    const tasks = await prisma.task.findMany({
        where: {
            OR: [
                { created_at: { gte: start, lte: end } },
                { updated_at: { gte: start, lte: end }, status: 'DONE' }
            ]
        },
        select: {
            created_at: true,
            updated_at: true,
            status: true
        }
    });

    // Build date range — iterate by local date
    const currentDate = new Date(start);

    while (toLocalDateStr(currentDate) <= endStr) {
        const dateStr = toLocalDateStr(currentDate);

        const createdTasks = tasks.filter(t =>
            toLocalDateStr(new Date(t.created_at)) === dateStr
        ).length;

        const completedTasks = tasks.filter(t =>
            t.status === 'DONE' &&
            t.updated_at &&
            toLocalDateStr(new Date(t.updated_at)) === dateStr
        ).length;

        data.push({
            date: dateStr,
            createdTasks,
            completedTasks,
            activeUsers: Math.floor(Math.random() * 15) + 5
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
};

/**
 * Get assigned vs completed tasks for the team within a date range
 * @param {string} [startDate]
 * @param {string} [endDate]
 * @returns {Promise<Array>}
 */
const getTeamWorkloadData = async (startDate, endDate) => {
    // Helper to get local date string
    const toLocalDateStr = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    let start = new Date();
    start.setDate(start.getDate() - 6); // Default 7 days
    start.setHours(0, 0, 0, 0);

    let end = new Date();
    end.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    }

    const startStr = toLocalDateStr(start);
    const endStr = toLocalDateStr(end);

    // Fetch tasks that were either created in this range OR completed in this range
    const tasks = await prisma.task.findMany({
        where: {
            OR: [
                { created_at: { gte: start, lte: end } },
                { updated_at: { gte: start, lte: end }, status: 'DONE' }
            ]
        },
        include: {
            assignees: {
                select: {
                    user_id: true,
                    full_name: true
                }
            }
        }
    });

    const userWorkload = {};

    tasks.forEach(task => {
        // Did it fall in the 'created' bucket for this range?
        const wasAssignedInRange = task.created_at >= start && task.created_at <= end;

        // Did it fall in the 'completed' bucket for this range?
        const wasCompletedInRange = task.status === 'DONE' && task.updated_at >= start && task.updated_at <= end;

        task.assignees.forEach(assignee => {
            if (!assignee) return; // safety check

            if (!userWorkload[assignee.user_id]) {
                userWorkload[assignee.user_id] = {
                    name: assignee.full_name,
                    assigned: 0,
                    completed: 0
                };
            }

            if (wasAssignedInRange) {
                userWorkload[assignee.user_id].assigned += 1;
            }

            if (wasCompletedInRange) {
                userWorkload[assignee.user_id].completed += 1;
            }
        });
    });

    // Convert object to array and sort by most active
    const workloadArray = Object.values(userWorkload);
    workloadArray.sort((a, b) => (b.assigned + b.completed) - (a.assigned + a.completed));

    return workloadArray;
};

/**
 * Get analytics overview for a specific user
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getUserDashboardOverview = async (userId) => {
    const userIntId = parseInt(userId, 10);

    const tasksAssignedCount = await prisma.task.count({
        where: {
            assignees: {
                some: { user_id: userIntId }
            }
        }
    });

    const tasksCompletedCount = await prisma.task.count({
        where: {
            assignees: {
                some: { user_id: userIntId }
            },
            status: 'DONE'
        }
    });

    const overdueTasksCount = await prisma.task.count({
        where: {
            assignees: {
                some: { user_id: userIntId }
            },
            deadline: {
                lt: new Date()
            },
            status: {
                not: 'DONE'
            }
        }
    });

    // NOTE: Prisma groupBy doesn't fully support filtering by multi-relations deep inside the groupBy directly 
    // without some limitations. Since a user usually has a manageable number of tasks, we can just aggregate in JS 
    // or use a raw query. We'll fetch the statuses and count in JS for precision and flexibility.
    const allUserTasksStatus = await prisma.task.findMany({
        where: {
            assignees: {
                some: { user_id: userIntId }
            }
        },
        select: { status: true }
    });

    const statusCounts = allUserTasksStatus.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {});

    const statusMap = {
        'TODO': 'Pending',
        'IN_PROGRESS': 'In Progress',
        'REVIEW': 'In Review',
        'DONE': 'Completed'
    };

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        name: statusMap[status] || status,
        value: count
    }));

    // Calculate a simple productivity score (Completed / Total) * 100
    const productivityScore = tasksAssignedCount > 0
        ? Math.round((tasksCompletedCount / tasksAssignedCount) * 100)
        : 0;

    return {
        tasksAssignedCount,
        tasksCompletedCount,
        overdueTasksCount,
        productivityScore,
        statusDistribution
    };
};

/**
 * Get trend data for a specific user over a period
 * @param {string} userId
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @returns {Promise<Array>}
 */
const getUserTrendData = async (userId, startDate, endDate) => {
    console.log("Analytics Service (User Trend) - Received Date Range:", { startDate, endDate });

    // Helper to get local date string YYYY-MM-DD regardless of the timezone the server runs in
    const toLocalDateStr = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    let start = new Date();
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0); // Local midnight
    let end = new Date();
    end.setHours(23, 59, 59, 999); // Local end of day

    if (startDate && endDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    }

    const userIntId = parseInt(userId, 10);

    // Fetch all user tasks that were either created or updated within this range
    const tasks = await prisma.task.findMany({
        where: {
            assignees: {
                some: { user_id: userIntId }
            },
            OR: [
                {
                    created_at: {
                        gte: start,
                        lte: end
                    }
                },
                {
                    updated_at: {
                        gte: start,
                        lte: end
                    }
                }
            ]
        },
        select: {
            status: true,
            created_at: true,
            updated_at: true
        }
    });

    const data = [];
    const currentDate = new Date(start);

    // Generate array of consecutive days across bounds
    while (currentDate <= end) {
        const dateStr = toLocalDateStr(currentDate);

        // Created today
        const createdTasks = tasks.filter(t =>
            toLocalDateStr(new Date(t.created_at)) === dateStr
        ).length;

        // Completed today (status DONE and updated today)
        const completedTasks = tasks.filter(t =>
            t.status === 'DONE' &&
            t.updated_at &&
            toLocalDateStr(new Date(t.updated_at)) === dateStr
        ).length;

        data.push({
            date: dateStr,
            createdTasks,
            completedTasks
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
};

module.exports = {
    getDashboardOverview,
    getTrendData,
    getTeamWorkloadData,
    getUserDashboardOverview,
    getUserTrendData
};
