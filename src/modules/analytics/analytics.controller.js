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

const getTeamWorkload = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getTeamWorkloadData(startDate, endDate);
        return successResponse(res, data, 'Team workload data retrieved successfully');
    } catch (error) {
        next(error);
    }
};

const getUserOverview = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const data = await analyticsService.getUserDashboardOverview(userId);
        return successResponse(res, data, 'User analytics overview retrieved successfully');
    } catch (error) {
        next(error);
    }
};

const getUserTrend = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getUserTrendData(userId, startDate, endDate);
        return successResponse(res, data, 'User trend data retrieved successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOverview,
    getTrend,
    getTeamWorkload,
    getUserOverview,
    getUserTrend
};
