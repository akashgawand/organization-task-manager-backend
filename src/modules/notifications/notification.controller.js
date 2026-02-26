const notificationService = require('./notification.service');
const { successResponse } = require('../../utils/response');

const getNotifications = async (req, res, next) => {
    try {
        const notifications = await notificationService.getUserNotifications(req.user.user_id);
        return successResponse(res, notifications, 'Notifications retrieved successfully');
    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id, req.user.user_id);
        return successResponse(res, notification, 'Notification marked as read');
    } catch (error) {
        next(error);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        await notificationService.markAllAsRead(req.user.user_id);
        return successResponse(res, null, 'All notifications marked as read');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead
};
