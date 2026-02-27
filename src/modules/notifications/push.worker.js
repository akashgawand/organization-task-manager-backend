const { getPrismaClient } = require('../../config/db');
const fcmService = require('./fcm.service');
const logger = require('../../utils/logger');

const prisma = getPrismaClient();

// In-memory lock to prevent concurrent executions
let isProcessing = false;

/**
 * Worker function to process the push notification queue
 * Reads from PushNotificationQueue, uses fcm.service to send it, and records statuses.
 */
const processPushQueue = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
        // Fetch up to 50 pending notifications with simple retry logic (< 3 attempts)
        const pushes = await prisma.pushNotificationQueue.findMany({
            where: {
                status: 'PENDING',
                attempts: { lt: 3 }
            },
            orderBy: { created_at: 'asc' },
            take: 50
        });

        if (pushes.length === 0) {
            isProcessing = false;
            return;
        }

        logger.info(`Processing ${pushes.length} push notification events...`);

        for (const push of pushes) {
            const { id, user_id, title, body, data, attempts } = push;

            const incrementedAttempts = attempts + 1;

            try {
                // Determine the correct data payload
                let parsedData = {};
                if (data) {
                    try {
                        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                    } catch (e) {
                        logger.warn(`Failed to parse FCM data for push ${id}`);
                    }
                }

                // Send via FCM service
                const result = await fcmService.sendPushToUser(user_id, title, body, parsedData);

                if (result.failureCount > 0 && result.successCount === 0) {
                    // The send failed completely
                    await prisma.pushNotificationQueue.update({
                        where: { id },
                        data: {
                            status: incrementedAttempts >= 3 ? 'FAILED' : 'PENDING',
                            attempts: incrementedAttempts,
                            error_log: result.errorLog
                        }
                    });
                    logger.warn(`Push notification failed for User ${user_id}. Attempts: ${incrementedAttempts}`);
                } else {
                    // Either partial success or complete success
                    await prisma.pushNotificationQueue.update({
                        where: { id },
                        data: {
                            status: 'SENT',
                            attempts: incrementedAttempts,
                            error_log: result.errorLog
                        }
                    });
                }
            } catch (error) {
                // Unknown internal error
                logger.error(`Error sending push notification for User ${user_id}:`, error);
                await prisma.pushNotificationQueue.update({
                    where: { id },
                    data: {
                        status: incrementedAttempts >= 3 ? 'FAILED' : 'PENDING',
                        attempts: incrementedAttempts,
                        error_log: `Internal Error: ${error.message}`
                    }
                });
            }
        }

    } catch (error) {
        logger.error('Error processing push notification queue:', error);
    } finally {
        isProcessing = false;
    }
};

/**
 * Initializes the background push worker loop
 */
const startPushWorker = () => {
    logger.info('Push Notification Worker started. Polling every 5 seconds.');
    // Run every 5 seconds
    setInterval(processPushQueue, 5000);
    // Initial run
    processPushQueue();
};

module.exports = {
    startPushWorker,
    processPushQueue
};
