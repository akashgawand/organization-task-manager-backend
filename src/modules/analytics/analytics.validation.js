const { z } = require('zod');

const getTrend = {
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional()
    })
};

module.exports = {
    getTrend
};
