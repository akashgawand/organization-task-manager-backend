const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email('Invalid email format')
            .min(1, 'Email is required'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            ),
        full_name: z
            .string()
            .min(2, 'Full name must be at least 2 characters')
            .max(255, 'Full name must not exceed 255 characters'),
        role: z
            .enum(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD', 'SENIOR_DEVELOPER', 'EMPLOYEE'])
            .optional()
            .default('EMPLOYEE'),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email('Invalid email format')
            .min(1, 'Email is required'),
        password: z
            .string()
            .min(1, 'Password is required'),
    }),
});

const refreshTokenSchema = z.object({
    body: z.object({
        refresh_token: z
            .string()
            .min(1, 'Refresh token is required'),
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
};
