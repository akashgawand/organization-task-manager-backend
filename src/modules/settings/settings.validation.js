const { z } = require('zod');

const updateSettingsSchema = {
    body: z.object({
        company_name: z.string().max(255).optional(),
        timezone: z.string().max(100).optional(),
        date_format: z.string().max(50).optional(),
        time_format: z.string().max(20).optional(),

        notify_task_assignments: z.boolean().optional(),
        notify_task_updates: z.boolean().optional(),
        notify_comments: z.boolean().optional(),
        notify_mentions: z.boolean().optional(),
        notification_frequency: z.string().max(50).optional(),

        session_timeout: z.string().max(50).optional(),
        pass_min_length: z.boolean().optional(),
        pass_require_uppercase: z.boolean().optional(),
        pass_require_numbers: z.boolean().optional(),
        pass_require_special: z.boolean().optional(),
        require_2fa: z.boolean().optional()
    }).strict() // Reject extraneous fields
};

module.exports = {
    updateSettingsSchema
};
