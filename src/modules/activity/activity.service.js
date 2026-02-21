const { getPrismaClient } = require('../../config/db');
const { getPaginationParams, createPaginatedResponse } = require('../../utils/pagination');

const prisma = getPrismaClient();

class ActivityService {
    async getUserActivity(userId, query) {
        const { skip, take } = getPaginationParams(query.page, query.limit);

        const where = {
            user_id: parseInt(userId),
            ...(query.activity_type && { activity_type: query.activity_type }),
            ...(query.task_id && { task_id: parseInt(query.task_id) }),
        };

        const [activities, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                skip,
                take,
                include: {
                    task: {
                        select: {
                            task_id: true,
                            title: true,
                            status: true,
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
            }),
            prisma.activityLog.count({ where }),
        ]);

        return createPaginatedResponse(activities, total, query.page, query.limit);
    }

    async getMyActivity(userId, query) {
        return this.getUserActivity(userId, query);
    }
}

module.exports = new ActivityService();
