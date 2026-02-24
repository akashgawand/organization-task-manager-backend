const analyticsService = require('./analytics.service');
const { successResponse } = require('../../utils/response');

const getOverview = async (req, res, next) => {
    try {
        const data = await analyticsService.getDashboardOverview();
        return successResponse(res, data, 'Analytics overview retrieved successfully');
    } catch (error) {
        next(error);
    }
};

const getTrend = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getTrendData(startDate, endDate);
        return successResponse(res, data, 'Trend data retrieved successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOverview,
    getTrend
};
