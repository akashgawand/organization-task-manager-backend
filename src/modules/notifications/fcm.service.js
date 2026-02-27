const admin = require('../../config/firebase');
const { getPrismaClient } = require('../../config/db');
const logger = require('../../utils/logger');

const prisma = getPrismaClient();

class FCMService {
    /**
     * Parse FCM tokens from a user record, handling whether it's stored as JSON array or string.
     */
    _parseTokens(fcmTokensField) {
        if (!fcmTokensField) return [];
        if (Array.isArray(fcmTokensField)) return fcmTokensField;
        try {
            const parsed = JSON.parse(fcmTokensField);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    /**
     * Send a multicast push notification to a user's registered devices.
     * Automatically handles the removal of invalid tokens from the database.
     *
     * @param {number} userId - The ID of the recipient user
     * @param {string} title - The notification title
     * @param {string} body - The notification body text
     * @param {object} data - Optional data payload for the notification (e.g., URLs)
     * @returns {Promise<{successCount: number, failureCount: number, errorLog: string | null}>}
     */
    async sendPushToUser(userId, title, body, data = {}) {
        if (!admin || !admin.messaging) {
            return { successCount: 0, failureCount: 0, errorLog: 'Firebase not properly initialized or offline.' };
        }

        const targetUser = await prisma.user.findUnique({
            where: { user_id: userId },
            select: { fcm_tokens: true }
        });

        if (!targetUser || !targetUser.fcm_tokens) {
            return { successCount: 0, failureCount: 0, errorLog: 'User has no registered tokens' };
        }

        const validTokensSet = new Set(this._parseTokens(targetUser.fcm_tokens));
        if (validTokensSet.size === 0) {
            return { successCount: 0, failureCount: 0, errorLog: 'Array of tokens is empty' };
        }

        const tokensArray = Array.from(validTokensSet);

        // Normalize data values to strings for FCM
        const stringifiedData = Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
        );

        const message = {
            notification: {
                title,
                body
            },
            data: stringifiedData,
            webpush: {
                notification: {
                    icon: '/favicon.ico', // Generic favicon as visual anchor
                    requireInteraction: true // Keeps the notification prominent
                },
                fcmOptions: {
                    link: stringifiedData.url || '/dashboard' // Link clicked from background
                }
            },
            tokens: tokensArray
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        // Process invalid tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            let errorLogDetails = [];

            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code;
                    errorLogDetails.push(`Token ${tokensArray[idx]}: ${errorCode}`);

                    if (
                        errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered'
                    ) {
                        failedTokens.push(tokensArray[idx]);
                    }
                }
            });

            // Cleanup invalid tokens from Db
            if (failedTokens.length > 0) {
                const refreshedTokens = tokensArray.filter(t => !failedTokens.includes(t));
                await prisma.user.update({
                    where: { user_id: userId },
                    data: { fcm_tokens: refreshedTokens }
                });
                logger.info(`Cleaned up ${failedTokens.length} invalid tokens for user ${userId}`);
            }

            return {
                successCount: response.successCount,
                failureCount: response.failureCount,
                errorLog: errorLogDetails.length > 0 ? errorLogDetails.join(', ') : null
            };
        }

        return {
            successCount: response.successCount,
            failureCount: 0,
            errorLog: null
        };
    }
}

module.exports = new FCMService();
