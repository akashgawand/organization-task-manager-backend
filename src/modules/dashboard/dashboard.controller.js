const dashboardService = require('./dashboard.service');
const { successResponse, errorResponse } = require('../../utils/response');

const getAnalytics = async (req, res, next) => {
    try {
        const analytics = await dashboardService.getAnalytics(req.query.dateRange);
        return successResponse(res, analytics, 'Analytics retrieved successfully');
    } catch (error) {
        next(error);
    }
};

const getEmployeeProductivity = async (req, res, next) => {
    try {
        const userId = req.params.userId ? parseInt(req.params.userId) : req.user.user_id;
        const productivity = await dashboardService.getEmployeeProductivity(userId);
        return successResponse(res, productivity, 'Employee productivity retrieved successfully');
    } catch (error) {
        next(error);
    }
};

const getProjectStats = async (req, res, next) => {
    try {
        const stats = await dashboardService.getProjectStats(req.params.projectId);
        return successResponse(res, stats, 'Project statistics retrieved successfully');
    } catch (error) {
        if (error.message === 'Project not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

module.exports = {
    getAnalytics,
    getEmployeeProductivity,
    getProjectStats,
};
