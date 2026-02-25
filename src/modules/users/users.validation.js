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

const updateOwnProfileSchema = z.object({
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
        phone: z
            .string()
            .optional(),
    }),
});

const updatePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    }),
});

module.exports = {
    updateUserSchema,
    changeRoleSchema,
    queryUsersSchema,
    userIdParamSchema,
    updateOwnProfileSchema,
    updatePasswordSchema,
};
