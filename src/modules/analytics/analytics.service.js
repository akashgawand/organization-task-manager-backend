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
    let start = startDate ? new Date(startDate + "T00:00:00") : new Date();
    let end = endDate ? new Date(endDate + "T23:59:59") : new Date();

    if (!startDate) {
        start = new Date();
        start.setDate(end.getDate() - 13);
    }

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

module.exports = {
    getDashboardOverview,
    getTrendData
};
