const { getPrismaClient } = require('../../config/db');
const { ACTIVITY_TYPES } = require('../../constants/taskStatus');
const logger = require('../../utils/logger');

const prisma = getPrismaClient();

// In-memory lock to prevent concurrent executions
let isProcessing = false;

/**
 * Worker function to process queued notifications
 * Reads from NotificationQueue, resolves recipients based on roles/rules,
 * creates Notification rows, and marks queue events as processed.
 */
const processQueue = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
        // Fetch up to 50 unprocessed events
        const events = await prisma.notificationQueue.findMany({
            where: { processed: false },
            orderBy: { created_at: 'asc' },
            take: 50
        });

        if (events.length === 0) {
            isProcessing = false;
            return;
        }

        logger.info(`Processing ${events.length} notification events...`);

        // Get SuperAdmins and Admins for role-based notifications
        const superAdmins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN', is_active: true } });
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN', is_active: true } });

        for (const event of events) {
            const { queue_id, event_type, payload } = event;
            const notificationInserts = [];
            const processedUsers = new Set(); // Prevent duplicate notifications

            const addNotification = (userId, type, title, message, entityType = null, entityId = null) => {
                if (!userId || processedUsers.has(userId)) return;

                // Don't notify the user who performed the action
                if (payload.actor_id && payload.actor_id === userId) return;

                notificationInserts.push({
                    user_id: userId,
                    type,
                    title,
                    message,
                    entity_type: entityType,
                    entity_id: entityId
                });
                processedUsers.add(userId);
            };

            // Distribution Logic based on Event Type
            switch (event_type) {
                // Team Lead Assigned
                case ACTIVITY_TYPES.TEAM_CREATED:
                    // Super Admins + Admins
                    superAdmins.concat(admins).forEach(a =>
                        addNotification(a.user_id, event_type, 'New Team Created', `Team ${payload.team_name} has been created.`, 'TEAM', payload.team_id)
                    );

                    // Team Lead
                    if (payload.lead_id) {
                        addNotification(payload.lead_id, 'TEAM_LEAD_ASSIGNED', 'Assigned as Team Lead', `You have been assigned as the lead for team ${payload.team_name}.`, 'TEAM', payload.team_id);
                    }
                    break;
                case ACTIVITY_TYPES.PROJECT_CREATED:
                    superAdmins.forEach(a =>
                        addNotification(a.user_id, event_type, 'New Project Created', `Project ${payload.project_name} has been created.`, 'PROJECT', payload.project_id)
                    );
                    admins.forEach(a =>
                        addNotification(a.user_id, event_type, 'New Project Created', `Project ${payload.project_name} has been created in your organization.`, 'PROJECT', payload.project_id)
                    );
                    break;
                case 'MENTIONED':
                    if (payload.mentioned_users && Array.isArray(payload.mentioned_users)) {
                        payload.mentioned_users.forEach(userId =>
                            addNotification(userId, event_type, 'You were mentioned', `${payload.actor_name} mentioned you in a comment.`, payload.entity_type, payload.entity_id)
                        );
                    }
                    superAdmins.forEach(a => {
                        // 1.9 mentioned rule
                        if (payload.mentioned_users && payload.mentioned_users.includes(a.user_id)) {
                            addNotification(a.user_id, event_type, 'You were mentioned', `${payload.actor_name} mentioned you.`, payload.entity_type, payload.entity_id)
                        }
                    });
                    admins.forEach(a => {
                        // 2.9 mentioned rule
                        if (payload.mentioned_users && payload.mentioned_users.includes(a.user_id)) {
                            addNotification(a.user_id, event_type, 'You were mentioned', `${payload.actor_name} mentioned you.`, payload.entity_type, payload.entity_id)
                        }
                    });
                    break;
                case ACTIVITY_TYPES.TASK_ASSIGNED:
                    // Notify Assignees (Employee / Sr Developer / Team Lead)
                    if (payload.assignees && Array.isArray(payload.assignees)) {
                        payload.assignees.forEach(assigneeId =>
                            addNotification(assigneeId, event_type, 'New Task Assigned', `You have been assigned to task: ${payload.task_title}`, 'TASK', payload.task_id)
                        );
                    }
                    // Notify Team Lead
                    if (payload.team_lead_id) {
                        addNotification(payload.team_lead_id, event_type, 'Task Assigned to Team', `Task ${payload.task_title} was assigned to your team.`, 'TASK', payload.task_id);
                    }
                    break;
                case 'CRITICAL_TASK_ASSIGNED':
                    superAdmins.concat(admins).forEach(a =>
                        addNotification(a.user_id, event_type, 'Critical Task Assigned', `A critical priority task "${payload.task_title}" was created/assigned.`, 'TASK', payload.task_id)
                    );
                    break;
                case 'DEADLINE_APPROACHING':
                    if (payload.assignees && Array.isArray(payload.assignees)) {
                        payload.assignees.forEach(assigneeId => {
                            addNotification(assigneeId, event_type, 'Deadline Approaching', `The deadline for task ${payload.task_title} is approaching.`, 'TASK', payload.task_id);
                        });
                    }
                    if (payload.team_lead_id) {
                        addNotification(payload.team_lead_id, event_type, 'Deadline Approaching', `The deadline for team task ${payload.task_title} is approaching.`, 'TASK', payload.task_id);
                    }
                    admins.concat(superAdmins).forEach(a =>
                        addNotification(a.user_id, event_type, 'Deadline Approaching', `The deadline for task ${payload.task_title} is approaching.`, 'TASK', payload.task_id)
                    );
                    break;
                case 'TASK_BLOCKED':
                    // Team lead & Admin
                    if (payload.team_lead_id) {
                        addNotification(payload.team_lead_id, event_type, 'Task Blocked', `Task ${payload.task_title} has been blocked.`, 'TASK', payload.task_id);
                    }
                    admins.forEach(a =>
                        addNotification(a.user_id, event_type, 'Task Blocked', `Task ${payload.task_title} has been blocked.`, 'TASK', payload.task_id)
                    );
                    break;
                case ACTIVITY_TYPES.TASK_STATUS_CHANGED:
                    if (payload.assignees && Array.isArray(payload.assignees)) {
                        payload.assignees.forEach(assigneeId => {
                            addNotification(assigneeId, event_type, 'Task Status Changed', `Task ${payload.task_title} status changed to ${payload.new_status} by ${payload.actor_name || 'System'}.`, 'TASK', payload.task_id);
                        });
                    }

                    // User requirement: super admin, admin, team lead should get notification whenever 
                    // someone marks a task as under review or marked as done.
                    if (['VERIFIED', 'DONE', 'COMPLETED', 'SUBMITTED', 'PENDING_REVIEW'].includes(payload.new_status)) {
                        const statusFriendlyName = ['SUBMITTED', 'PENDING_REVIEW'].includes(payload.new_status) ? 'under review' : 'done';
                        const message = `Task ${payload.task_title} (assigned to ${payload.assignee_names || 'Unassigned'}) was marked as ${statusFriendlyName} by ${payload.actor_name || 'System'}.`;

                        superAdmins.concat(admins).forEach(a =>
                            addNotification(a.user_id, event_type, 'Task Status Updated', message, 'TASK', payload.task_id)
                        );
                        if (payload.team_lead_id) {
                            addNotification(payload.team_lead_id, event_type, 'Task Status Updated', message, 'TASK', payload.task_id);
                        }
                    }
                    break;
                case ACTIVITY_TYPES.TASK_SUBMITTED:
                case 'REVIEW_REQUESTED':
                    // Notify Team Lead and Senior Devs and Admins
                    if (payload.team_lead_id) {
                        addNotification(payload.team_lead_id, event_type, 'Submission Pending Review', `${payload.actor_name} requested a review for task ${payload.task_title}.`, 'TASK', payload.task_id);
                    }
                    // Assuming we have the project's senior developers or just globally
                    superAdmins.concat(admins).forEach(a =>
                        addNotification(a.user_id, event_type, 'Task in Review', `${payload.actor_name} submitted task ${payload.task_title} for review.`, 'TASK', payload.task_id)
                    );
                    break;
                case 'SUBMISSION_APPROVED':
                    superAdmins.concat(admins).forEach(a =>
                        addNotification(a.user_id, event_type, 'Task Reviewed and Verified', `Task ${payload.task_title} was completed by ${payload.submitter_name} and verified by ${payload.reviewer_name}.`, 'TASK', payload.task_id)
                    );
                    if (payload.team_lead_id) {
                        addNotification(payload.team_lead_id, event_type, 'Task Reviewed and Verified', `Task ${payload.task_title} was completed by ${payload.submitter_name} and verified by ${payload.reviewer_name}.`, 'TASK', payload.task_id);
                    }
                    // Notify the submitter
                    if (payload.submitter_id) {
                        addNotification(payload.submitter_id, event_type, 'Submission Approved', `Your submission for task ${payload.task_title} was approved.`, 'TASK', payload.task_id);
                    }
                    break;
                case 'SUBMISSION_REJECTED':
                    // Notify employee
                    if (payload.submitter_id) {
                        addNotification(payload.submitter_id, event_type, 'Submission Sent Back', `Your submission for task ${payload.task_title} was sent back. Please revise.`, 'TASK', payload.task_id);
                    }
                    break;
                case 'SYSTEM_SETTING_CHANGED':
                    superAdmins.forEach(a => addNotification(a.user_id, event_type, 'System Setting Changed', `System settings were updated by ${payload.actor_name}.`, 'SYSTEM', null));
                    break;
                case 'NEW_ADMIN_CREATED':
                    superAdmins.forEach(a => addNotification(a.user_id, event_type, 'New Admin Created', `A new admin user ${payload.admin_name} was created.`, 'USER', payload.admin_id));
                    break;
                case 'ESCALATION':
                    superAdmins.forEach(a => addNotification(a.user_id, event_type, 'Escalation', `An escalation was raised for task ${payload.task_title}.`, 'TASK', payload.task_id));
                    break;
            }

            // Insert generated notifications
            if (notificationInserts.length > 0) {
                // Filter by preferences
                const prefs = await prisma.notificationPreference.findMany({
                    where: {
                        user_id: { in: notificationInserts.map(n => n.user_id) },
                        event_type: event_type
                    }
                });

                // Keep only those who haven't explicitly disabled in_app for this event
                const validInserts = notificationInserts.filter(n => {
                    const pref = prefs.find(p => p.user_id === n.user_id);
                    return pref ? pref.in_app : true;
                });

                if (validInserts.length > 0) {
                    await prisma.notification.createMany({
                        data: validInserts
                    });
                }
            }

            // Mark queue row as processed
            await prisma.notificationQueue.update({
                where: { queue_id },
                data: { processed: true }
            });
        }

    } catch (error) {
        logger.error('Error processing notification queue:', error);
    } finally {
        isProcessing = false;
    }
};

/**
 * Initializes the background worker loop
 */
const startWorker = () => {
    logger.info('Notification Queue Worker started. Polling every 10 seconds.');
    // Run every 10 seconds
    setInterval(processQueue, 10000);
    // Initial run
    processQueue();
};

module.exports = {
    startWorker,
    processQueue // Expored for manual testing if needed
};
