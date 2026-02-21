const { z } = require('zod');

const approveSubmissionSchema = z.object({
    body: z.object({
        submission_id: z.number().int().positive(),
        review_note: z.string().optional(),
    }),
});

const rejectSubmissionSchema = z.object({
    body: z.object({
        submission_id: z.number().int().positive(),
        review_note: z.string().min(10, 'Review note is required for rejection (minimum 10 characters)'),
    }),
});

const submissionIdParamSchema = z.object({
    params: z.object({
        submissionId: z.string().regex(/^\d+$/, 'Invalid submission ID'),
    }),
});

module.exports = {
    approveSubmissionSchema,
    rejectSubmissionSchema,
    submissionIdParamSchema,
};
