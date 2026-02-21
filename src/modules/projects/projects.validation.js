const { z } = require('zod');

const phaseSchema = z.object({
    name: z.string().min(1, 'Phase name is required'),
    description: z.string().optional().default(''),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.enum(['planning', 'active', 'completed']).optional().default('planning'),
    display_order: z.number().optional(),
});

const createProjectSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(3, 'Project name must be at least 3 characters')
            .max(255, 'Project name must not exceed 255 characters'),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        team_id: z.union([z.string(), z.number()]).optional().nullable(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        phases: z.array(phaseSchema).optional(),
    }),
});

const updateProjectSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(3, 'Project name must be at least 3 characters')
            .max(255, 'Project name must not exceed 255 characters')
            .optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        team_id: z.union([z.string(), z.number()]).optional().nullable(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
    }),
});

const queryProjectsSchema = z.object({
    query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('10'),
        search: z.string().optional(),
    }),
});

const projectIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid project ID'),
    }),
});

module.exports = {
    createProjectSchema,
    updateProjectSchema,
    queryProjectsSchema,
    projectIdParamSchema,
};
