const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validate.middleware');
const settingsValidation = require('./settings.validation');

// All setting routes require authentication and the dashboard:read permission 
// (or could be an explicit settings permission - reusing dashboard:read as per standard config)
router.use(authenticate);
router.use(requirePermission('dashboard:read'));

// Get Settings
router.get(
    '/',
    settingsController.getSettings
);

// Update Settings
router.put(
    '/',
    validate(settingsValidation.updateSettings),
    settingsController.updateSettings
);

module.exports = router;
