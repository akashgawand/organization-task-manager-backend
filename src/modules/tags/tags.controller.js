const tagsService = require('./tags.service');
const { successResponse, errorResponse, paginatedResponse, createdResponse } = require('../../utils/response');

const createTag = async (req, res, next) => {
    try {
        const tag = await tagsService.createTag(req.body);
        return createdResponse(res, tag, 'Tag created successfully');
    } catch (error) {
        if (error.message.includes('already exists')) {
            return errorResponse(res, error.message, 400);
        }
        next(error);
    }
};

const getTags = async (req, res, next) => {
    try {
        const result = await tagsService.getTags(req.query);
        return paginatedResponse(res, result.data, result.pagination, 'Tags retrieved successfully');
    } catch (error) {
        next(error);
    }
};

const getTagById = async (req, res, next) => {
    try {
        const tag = await tagsService.getTagById(req.params.id);
        return successResponse(res, tag, 'Tag retrieved successfully');
    } catch (error) {
        if (error.message === 'Tag not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

const updateTag = async (req, res, next) => {
    try {
        const tag = await tagsService.updateTag(req.params.id, req.body);
        return successResponse(res, tag, 'Tag updated successfully');
    } catch (error) {
        if (error.message === 'Tag not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

const deleteTag = async (req, res, next) => {
    try {
        await tagsService.deleteTag(req.params.id);
        return successResponse(res, null, 'Tag deleted successfully');
    } catch (error) {
        if (error.message === 'Tag not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

module.exports = {
    createTag,
    getTags,
    getTagById,
    updateTag,
    deleteTag,
};
