const activityService = require('./activity.service');
const { paginatedResponse } = require('../../utils/response');

const getUserActivity = async (req, res, next) => {
    try {
        const result = await activityService.getUserActivity(req.params.userId, req.query);
        return paginatedResponse(res, result.data, result.pagination, 'User activity retrieved successfully');
    } catch (error) {
        next(error);
    }
};

const getMyActivity = async (req, res, next) => {
    try {
        const result = await activityService.getMyActivity(req.user.user_id, req.query);
        return paginatedResponse(res, result.data, result.pagination, 'Activity retrieved successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUserActivity,
    getMyActivity,
};
