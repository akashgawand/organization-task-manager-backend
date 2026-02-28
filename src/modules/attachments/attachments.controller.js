const attachmentsService = require('./attachments.service');
const { successResponse, errorResponse, createdResponse } = require('../../utils/response');

const uploadAttachment = async (req, res, next) => {
    try {
        if (!req.file) {
            return errorResponse(res, 'No file provided', 400);
        }

        const attachment = await attachmentsService.uploadAttachment(
            req.params.taskId,
            req.file,
            req.user.user_id
        );

        return createdResponse(res, attachment, 'File uploaded successfully');
    } catch (error) {
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        if (error.message.includes('not allowed') || error.message.includes('exceeds')) {
            return errorResponse(res, error.message, 400);
        }
        next(error);
    }
};

const getAttachments = async (req, res, next) => {
    try {
        const attachments = await attachmentsService.getAttachments(req.params.taskId);
        return successResponse(res, attachments, 'Attachments retrieved successfully');
    } catch (error) {
        next(error);
    }
};

const deleteAttachment = async (req, res, next) => {
    try {
        await attachmentsService.deleteAttachment(req.params.id, req.user.user_id);
        return successResponse(res, null, 'Attachment deleted successfully');
    } catch (error) {
        if (error.message === 'Attachment not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

module.exports = {
    uploadAttachment,
    getAttachments,
    deleteAttachment,
};
