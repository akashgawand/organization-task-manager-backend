const tasksService = require('./tasks.service');
const { successResponse, errorResponse, paginatedResponse, createdResponse } = require('../../utils/response');

const createTask = async (req, res, next) => {
    try {
        const task = await tasksService.createTask(req.body, req.user.user_id, req.user.role);
        return createdResponse(res, task, 'Task created successfully');
    } catch (error) {
        if (error.message.includes('not found') || error.message.includes('inactive')) {
            return errorResponse(res, error.message, 404);
        }
        if (error.message.includes('does not belong') || error.message.includes('only assign')) {
            return errorResponse(res, error.message, 403);
        }
        next(error);
    }
};

const getTasks = async (req, res, next) => {
    try {
        const result = await tasksService.getTasks(req.query, req.user.user_id, req.user.role);
        return paginatedResponse(res, result.data, result.pagination, 'Tasks retrieved successfully');
    } catch (error) {
        next(error);
    }
};

const getTaskById = async (req, res, next) => {
    try {
        const task = await tasksService.getTaskById(req.params.id);
        return successResponse(res, task, 'Task retrieved successfully');
    } catch (error) {
        if (error.message === 'Task not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

const updateTask = async (req, res, next) => {
    try {
        const task = await tasksService.updateTask(req.params.id, req.body, req.user.user_id, req.user.role);
        return successResponse(res, task, 'Task updated successfully');
    } catch (error) {
        if (error.message === 'Task not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

const updateTaskStatus = async (req, res, next) => {
    try {
        const task = await tasksService.updateTaskStatus(req.params.id, req.body.status, req.user.user_id);
        return successResponse(res, task, 'Task status updated successfully');
    } catch (error) {
        if (error.message === 'Task not found') {
            return errorResponse(res, error.message, 404);
        }
        if (error.message.includes('Invalid status transition')) {
            return errorResponse(res, error.message, 400);
        }
        next(error);
    }
};

const assignTask = async (req, res, next) => {
    try {
        const { assigned_to, assignee_ids } = req.body;
        // Prefer assignee_ids array; fall back to single assigned_to
        const target = assignee_ids || assigned_to;
        const task = await tasksService.assignTask(req.params.id, target, req.user.user_id);
        return successResponse(res, task, 'Task assigned successfully');
    } catch (error) {
        if (error.message.includes('not found') || error.message.includes('inactive')) {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

const deleteTask = async (req, res, next) => {
    try {
        await tasksService.deleteTask(req.params.id);
        return successResponse(res, null, 'Task deleted successfully');
    } catch (error) {
        if (error.message === 'Task not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

const addComment = async (req, res, next) => {
    try {
        const comment = await tasksService.addComment(
            req.params.id,
            req.body.content,
            req.user.user_id
        );
        return createdResponse(res, comment, 'Comment added successfully');
    } catch (error) {
        if (error.message === 'Task not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    updateTaskStatus,
    assignTask,
    deleteTask,
    addComment,
};
