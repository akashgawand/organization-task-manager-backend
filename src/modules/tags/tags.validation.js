const { z } = require('zod');

const createTag = {
    body: z.object({
        name: z.string().min(1).max(50, 'Tag name must be between 1 and 50 characters'),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code').optional(),
    }),
};

const getTags = {
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        search: z.string().optional(),
    }),
};

const getTagById = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
};

const updateTag = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
    body: z.object({
        name: z.string().min(1).max(50).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }),
};

const deleteTag = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
};

module.exports = {
    createTag,
    getTags,
    getTagById,
    updateTag,
    deleteTag,
};
