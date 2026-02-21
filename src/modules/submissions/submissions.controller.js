const submissionsService = require('./submissions.service');
const { successResponse, errorResponse, createdResponse } = require('../../utils/response');

const createSubmission = async (req, res, next) => {
    try {
        const submission = await submissionsService.createSubmission(req.body, req.user.user_id);
        return createdResponse(res, submission, 'Task submitted successfully');
    } catch (error) {
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        if (error.message.includes('must be') || error.message.includes('Only')) {
            return errorResponse(res, error.message, 400);
        }
        next(error);
    }
};

const getSubmissionsByTask = async (req, res, next) => {
    try {
        const submissions = await submissionsService.getSubmissionsByTask(req.params.taskId);
        return successResponse(res, submissions, 'Submissions retrieved successfully');
    } catch (error) {
        if (error.message === 'Task not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

const getSubmissionById = async (req, res, next) => {
    try {
        const submission = await submissionsService.getSubmissionById(req.params.id);
        return successResponse(res, submission, 'Submission retrieved successfully');
    } catch (error) {
        if (error.message === 'Submission not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

const updateSubmission = async (req, res, next) => {
    try {
        const submission = await submissionsService.updateSubmission(req.params.id, req.body, req.user.user_id);
        return successResponse(res, submission, 'Submission updated successfully');
    } catch (error) {
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        if (error.message.includes('Only') || error.message.includes('Can only')) {
            return errorResponse(res, error.message, 403);
        }
        next(error);
    }
};

module.exports = {
    createSubmission,
    getSubmissionsByTask,
    getSubmissionById,
    updateSubmission,
};
