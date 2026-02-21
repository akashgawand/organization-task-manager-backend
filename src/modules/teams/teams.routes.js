const express = require('express');
const router = express.Router();
const teamsController = require('./teams.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin, requireManagerOrAdmin } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validate.middleware');
const teamsValidation = require('./teams.validation');

// All routes require authentication
router.use(authenticate);

// Create team
router.post(
    '/',
    requireManagerOrAdmin,
    validate(teamsValidation.createTeam),
    teamsController.createTeam
);

// Get all teams
router.get(
    '/',
    validate(teamsValidation.getTeams),
    teamsController.getTeams
);

// Get team by ID
router.get(
    '/:id',
    validate(teamsValidation.getTeamById),
    teamsController.getTeamById
);

// Update team
router.put(
    '/:id',
    requireManagerOrAdmin,
    validate(teamsValidation.updateTeam),
    teamsController.updateTeam
);

// Delete team
router.delete(
    '/:id',
    requireAdmin,
    validate(teamsValidation.deleteTeam),
    teamsController.deleteTeam
);

// Add member to team
router.post(
    '/:id/members',
    requireManagerOrAdmin,
    validate(teamsValidation.addMember),
    teamsController.addMember
);

// Remove member from team
router.delete(
    '/:id/members/:user_id',
    requireManagerOrAdmin,
    validate(teamsValidation.removeMember),
    teamsController.removeMember
);

module.exports = router;
