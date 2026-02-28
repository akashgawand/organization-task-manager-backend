const projectsService = require('./projects.service');
const { successResponse, errorResponse, paginatedResponse, createdResponse } = require('../../utils/response');

/**
 * Create project
 */
const createProject = async (req, res, next) => {
    try {
        const project = await projectsService.createProject(req.body, req.user.user_id);
        return createdResponse(res, project, 'Project created successfully with default phases');
    } catch (error) {
        next(error);
    }
};

/**
 * Get all projects
 */
const getProjects = async (req, res, next) => {
    try {
        const result = await projectsService.getProjects(
            req.query,
            req.user.user_id
            // role is now fetched from DB inside the service
        );
        return paginatedResponse(
            res,
            result.data,
            result.pagination,
            'Projects retrieved successfully'
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get project by ID
 */
const getProjectById = async (req, res, next) => {
    try {
        const project = await projectsService.getProjectById(req.params.id);
        return successResponse(res, project, 'Project retrieved successfully');
    } catch (error) {
        if (error.message === 'Project not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * Update project
 */
const updateProject = async (req, res, next) => {
    try {
        const project = await projectsService.updateProject(
            req.params.id,
            req.body,
            req.user.user_id
        );
        return successResponse(res, project, 'Project updated successfully');
    } catch (error) {
        if (error.message === 'Project not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * Delete project
 */
const deleteProject = async (req, res, next) => {
    try {
        await projectsService.deleteProject(req.params.id, req.user.user_id);
        return successResponse(res, null, 'Project deleted successfully');
    } catch (error) {
        if (error.message === 'Project not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
};
