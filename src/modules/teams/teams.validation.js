const { z } = require('zod');

const createTeam = {
    body: z.object({
        name: z.string().min(1, 'Team name is required'),
        description: z.string().optional(),
        lead_id: z.number().int().positive('Lead ID must be a positive integer'),
        member_ids: z.array(z.number().int().positive()).optional(),
        status: z.enum(['ACTIVE', 'IDLE', 'ARCHIVED']).optional(),
        avatar: z.string().optional(),
    }),
};

const getTeams = {
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        search: z.string().optional(),
        status: z.enum(['ACTIVE', 'IDLE', 'ARCHIVED']).optional(),
    }),
};

const getTeamById = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
};

const updateTeam = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
    body: z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        lead_id: z.number().int().positive().optional(),
        status: z.enum(['ACTIVE', 'IDLE', 'ARCHIVED']).optional(),
        avatar: z.string().optional(),
    }),
};

const deleteTeam = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
};

const addMember = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be a number'),
    }),
    body: z.object({
        user_id: z.number().int().positive('User ID must be a positive integer'),
    }),
};

const removeMember = {
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Team ID must be a number'),
        user_id: z.string().regex(/^\d+$/, 'User ID must be a number'),
    }),
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
