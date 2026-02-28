const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const projectsRoutes = require('../modules/projects/projects.routes');
const phasesRoutes = require('../modules/phases/phases.routes');
const tasksRoutes = require('../modules/tasks/tasks.routes');
const submissionsRoutes = require('../modules/submissions/submissions.routes');
const reviewsRoutes = require('../modules/reviews/reviews.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const activityRoutes = require('../modules/activity/activity.routes');
const teamsRoutes = require('../modules/teams/teams.routes');
const tagsRoutes = require('../modules/tags/tags.routes');
const settingsRoutes = require('../modules/settings/settings.routes');
const analyticsRoutes = require('../modules/analytics/analytics.routes');
const notificationRoutes = require('../modules/notifications/notification.routes');
const attachmentRoutes = require('../modules/attachments/attachments.routes');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// Mount module routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/projects', projectsRoutes);
router.use('/phases', phasesRoutes);
router.use('/tasks', tasksRoutes);
router.use('/teams', teamsRoutes);
router.use('/tags', tagsRoutes);
router.use('/submissions', submissionsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/activity', activityRoutes);
router.use('/settings', settingsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', attachmentRoutes); // Mounts /tasks/:taskId/attachments and /attachments/:id

module.exports = router;
