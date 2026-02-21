const { z } = require('zod');

const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(255),
        description: z.string().optional(),
        project_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
        phase_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]).optional(),
        // Support single assignee (assigned_to) or multiple (assignee_ids)
        assigned_to: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]).optional(),
        assignee_ids: z.array(z.union([z.number().int().positive(), z.string().regex(/^\d+$/)])).optional(),
        deadline: z.string().optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
        subtasks: z.array(z.object({
            title: z.string().min(1).max(255),
        })).optional(),
    }),
});

const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(255).optional(),
        description: z.string().optional(),
        phase_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]).optional(),
        deadline: z.string().optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
        status: z.enum(['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'REJECTED', 'VERIFIED', 'COMPLETED']).optional(),
        assigned_to: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]).optional(),
        assignee_ids: z.array(z.union([z.number().int().positive(), z.string().regex(/^\d+$/)])).optional(),
        subtasks: z.array(z.object({
            subtask_id: z.number().int().positive().optional(),
            title: z.string().min(1).max(255).optional(),
            is_completed: z.boolean().optional(),
        })).optional(),
    }),
});

const updateTaskStatusSchema = z.object({
    body: z.object({
        status: z.enum(['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'REJECTED', 'VERIFIED', 'COMPLETED']),
    }),
});

const assignTaskSchema = z.object({
    body: z.object({
        // Support single or array assignment
        assigned_to: z.union([
            z.number().int().positive(),
            z.array(z.number().int().positive()),
        ]).optional(),
        assignee_ids: z.array(z.number().int().positive()).optional(),
    }).refine(data => data.assigned_to !== undefined || data.assignee_ids !== undefined, {
        message: 'Either assigned_to or assignee_ids must be provided',
    }),
});

const queryTasksSchema = z.object({
    query: z.object({
        page: z.string().optional().default('1'),
        limit: z.string().optional().default('100'),
        project_id: z.string().regex(/^\d+$/).optional(),
        phase_id: z.string().regex(/^\d+$/).optional(),
        assigned_to: z.string().regex(/^\d+$/).optional(),
        status: z.enum(['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'REJECTED', 'VERIFIED', 'COMPLETED']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    }),
});

const taskIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid task ID'),
    }),
});

module.exports = {
    createTaskSchema,
    updateTaskSchema,
    updateTaskStatusSchema,
    assignTaskSchema,
    queryTasksSchema,
    taskIdParamSchema,
};
