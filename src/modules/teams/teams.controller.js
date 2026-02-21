const teamsService = require('./teams.service');
const { successResponse, errorResponse, paginatedResponse, createdResponse } = require('../../utils/response');

/**
 * Create team
 */
const createTeam = async (req, res, next) => {
    try {
        const team = await teamsService.createTeam(req.body, req.user.user_id);
        return createdResponse(res, team, 'Team created successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get all teams
 */
const getTeams = async (req, res, next) => {
    try {
        const result = await teamsService.getTeams(req.query);
        return paginatedResponse(
            res,
            result.data,
            result.pagination,
            'Teams retrieved successfully'
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get team by ID
 */
const getTeamById = async (req, res, next) => {
    try {
        const team = await teamsService.getTeamById(req.params.id);
        return successResponse(res, team, 'Team retrieved successfully');
    } catch (error) {
        if (error.message === 'Team not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * Update team
 */
const updateTeam = async (req, res, next) => {
    try {
        const team = await teamsService.updateTeam(req.params.id, req.body);
        return successResponse(res, team, 'Team updated successfully');
    } catch (error) {
        if (error.message === 'Team not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * Delete team
 */
const deleteTeam = async (req, res, next) => {
    try {
        await teamsService.deleteTeam(req.params.id);
        return successResponse(res, null, 'Team deleted successfully');
    } catch (error) {
        if (error.message === 'Team not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * Add member to team
 */
const addMember = async (req, res, next) => {
    try {
        const team = await teamsService.addMember(req.params.id, req.body.user_id);
        return successResponse(res, team, 'Member added successfully');
    } catch (error) {
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * Remove member from team
 */
const removeMember = async (req, res, next) => {
    try {
        const team = await teamsService.removeMember(req.params.id, req.params.user_id);
        return successResponse(res, team, 'Member removed successfully');
    } catch (error) {
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

module.exports = {
    createTeam,
    getTeams,
    getTeamById,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
};
