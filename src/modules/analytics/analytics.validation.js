const { z } = require('zod');

const getTrend = {
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional()
    })
};

const getUserOverview = {
    params: z.object({
        userId: z.string({ required_error: 'User ID is required' })
    })
};

const getUserTrend = {
    params: z.object({
        userId: z.string({ required_error: 'User ID is required' })
    }),
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional()
    })
};

const getTeamWorkload = {
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional()
    })
};

module.exports = {
    getTrend,
    getTeamWorkload,
    getUserOverview,
    getUserTrend
};
