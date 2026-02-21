const { z } = require('zod');

const createSubmissionSchema = z.object({
    body: z.object({
        task_id: z.number().int().positive(),
        submission_note: z.string().optional(),
        attachments: z.array(z.string().url()).optional(),
    }),
});

const updateSubmissionSchema = z.object({
    body: z.object({
        submission_note: z.string().optional(),
        attachments: z.array(z.string().url()).optional(),
    }),
});

const submissionIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid submission ID'),
    }),
});

const taskIdParamSchema = z.object({
    params: z.object({
        taskId: z.string().regex(/^\d+$/, 'Invalid task ID'),
    }),
});

module.exports = {
    createSubmissionSchema,
    updateSubmissionSchema,
    submissionIdParamSchema,
    taskIdParamSchema,
};
