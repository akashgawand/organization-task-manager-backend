const express = require('express');
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// GET /api/v1/dashboard/analytics - Get overall analytics
router.get('/analytics', dashboardController.getAnalytics);

// GET /api/v1/dashboard/employee-productivity/:userId? - Get employee productivity
router.get('/employee-productivity/:userId?', dashboardController.getEmployeeProductivity);

// GET /api/v1/dashboard/project-stats/:projectId - Get project statistics
router.get('/project-stats/:projectId', dashboardController.getProjectStats);

module.exports = router;
