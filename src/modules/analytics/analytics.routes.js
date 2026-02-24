const express = require('express');
const { validate } = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const analyticsController = require('./analytics.controller');
const analyticsValidation = require('./analytics.validation');

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

router.get(
    '/overview',
    analyticsController.getOverview
);

router.get(
    '/trend',
    validate(analyticsValidation.getTrend),
    analyticsController.getTrend
);

module.exports = router;
