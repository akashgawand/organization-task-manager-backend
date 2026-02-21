const phasesService = require('./phases.service');
const { successResponse, errorResponse, createdResponse } = require('../../utils/response');

const createPhase = async (req, res, next) => {
    try {
        const phase = await phasesService.createPhase(req.body, req.user.user_id);
        return createdResponse(res, phase, 'Phase created successfully');
    } catch (error) {
        if (error.message === 'Project not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

const getPhasesByProject = async (req, res, next) => {
    try {
        const phases = await phasesService.getPhasesByProject(req.params.projectId);
        return successResponse(res, phases, 'Phases retrieved successfully');
    } catch (error) {
        if (error.message === 'Project not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

const updatePhase = async (req, res, next) => {
    try {
        const phase = await phasesService.updatePhase(req.params.id, req.body, req.user.user_id);
        return successResponse(res, phase, 'Phase updated successfully');
    } catch (error) {
        if (error.message === 'Phase not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

const deletePhase = async (req, res, next) => {
    try {
        await phasesService.deletePhase(req.params.id, req.user.user_id);
        return successResponse(res, null, 'Phase deleted successfully');
    } catch (error) {
        if (error.message === 'Phase not found') {
            return errorResponse(res, error.message, 404);
        }
        if (error.message === 'Cannot delete phase with assigned tasks') {
            return errorResponse(res, error.message, 400);
        }
        next(error);
    }
};

const reorderPhases = async (req, res, next) => {
    try {
        const result = await phasesService.reorderPhases(req.body.phases, req.user.user_id);
        return successResponse(res, result, 'Phases reordered successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPhase,
    getPhasesByProject,
    updatePhase,
    deletePhase,
    reorderPhases,
};
