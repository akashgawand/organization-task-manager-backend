const { getPrismaClient } = require('../../config/db');

const prisma = getPrismaClient();

/**
 * Fetch a user's latest notifications
 */
const getUserNotifications = async (userId, limit = 50) => {
    return prisma.notification.findMany({
        where: { user_id: userId, is_deleted: false },
        orderBy: { created_at: 'desc' },
        take: limit
    });
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (notificationId, userId) => {
    // Verify ownership
    const notification = await prisma.notification.findUnique({
        where: { notification_id: parseInt(notificationId) }
    });

    if (!notification || notification.user_id !== userId) {
        throw new Error('Notification not found');
    }

    return prisma.notification.update({
        where: { notification_id: parseInt(notificationId) },
        data: { is_read: true }
    });
};

/**
 * Mark all of a user's notifications as read
 */
const markAllAsRead = async (userId) => {
    return prisma.notification.updateMany({
        where: { user_id: userId, is_read: false, is_deleted: false },
        data: { is_read: true }
    });
};

/**
 * Insert a new event into the Notification Queue for the background worker to process.
 * This should be called by other domains like tasks, projects, etc.
 * 
 * @param {string} eventType e.g TASK_ASSIGNED, PROJECT_CREATED
 * @param {object} payload Any JSON context related to the event, e.g. { task_id, task_title, assignees, actor_id, actor_name }
 */
const queueEvent = async (eventType, payload) => {
    try {
        await prisma.notificationQueue.create({
            data: {
                event_type: eventType,
                payload: payload
            }
        });
    } catch (err) {
        // We log, but usually don't throw to avoid killing the main API request if metrics fail
        const logger = require('../../utils/logger');
        logger.error(`Failed to queue notification event ${eventType}:`, err);
    }
};

module.exports = {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    queueEvent
};
