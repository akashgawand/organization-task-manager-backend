const express = require('express');
const notificationController = require('./notification.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/notifications - Get user's notifications
router.get('/', notificationController.getNotifications);

// PUT /api/v1/notifications/:id/read - Mark specific notification as read
router.put('/:id/read', notificationController.markAsRead);

// PUT /api/v1/notifications/read-all - Mark all unread notifications as read
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
