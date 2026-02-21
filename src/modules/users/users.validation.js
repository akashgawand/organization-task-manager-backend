const { z } = require('zod');

const updateUserSchema = z.object({
    body: z.object({
        full_name: z
            .string()
            .min(2, 'Full name must be at least 2 characters')
            .max(255, 'Full name must not exceed 255 characters')
            .optional(),
        email: z
            .string()
            .email('Invalid email format')
            .optional(),
    }),
});

const changeRoleSchema = z.object({
    body: z.object({
        role: z.enum(['ADMIN', 'MANAGER', 'REVIEWER', 'MEMBER']),
    }),
});

const queryUsersSchema = z.object({
    query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('10'),
        role: z.enum(['ADMIN', 'MANAGER', 'REVIEWER', 'MEMBER']).optional(),
        search: z.string().optional(),
    }),
});

const userIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid user ID'),
    }),
});

module.exports = {
    updateUserSchema,
    changeRoleSchema,
    queryUsersSchema,
    userIdParamSchema,
};
