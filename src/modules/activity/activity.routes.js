const express = require('express');
const activityController = require('./activity.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/activity/user/:userId - Get user activity
router.get('/user/:userId', activityController.getUserActivity.bind(activityController));

// GET /api/v1/activity/my-activity - Get my activity
router.get('/my-activity', activityController.getMyActivity.bind(activityController));

module.exports = router;
