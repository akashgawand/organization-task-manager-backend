const { z } = require('zod');

const createPhaseSchema = z.object({
    body: z.object({
        project_id: z.number().int().positive('Project ID must be a positive integer'),
        name: z
            .string()
            .min(2, 'Phase name must be at least 2 characters')
            .max(255, 'Phase name must not exceed 255 characters'),
        description: z.string().optional(),
        display_order: z.number().int().min(0).optional(),
    }),
});

const updatePhaseSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, 'Phase name must be at least 2 characters')
            .max(255, 'Phase name must not exceed 255 characters')
            .optional(),
        description: z.string().optional(),
    }),
});

const reorderPhasesSchema = z.object({
    body: z.object({
        phases: z.array(
            z.object({
                phase_id: z.number().int().positive(),
                display_order: z.number().int().min(0),
            })
        ),
    }),
});

const phaseIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid phase ID'),
    }),
});

const projectIdParamSchema = z.object({
    params: z.object({
        projectId: z.string().regex(/^\d+$/, 'Invalid project ID'),
    }),
});

module.exports = {
    createPhaseSchema,
    updatePhaseSchema,
    reorderPhasesSchema,
    phaseIdParamSchema,
    projectIdParamSchema,
};
