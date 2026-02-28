const express = require('express');
const tasksController = require('./tasks.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
    createTaskSchema,
    updateTaskSchema,
    updateTaskStatusSchema,
    assignTaskSchema,
    extensionRequestSchema,
    queryTasksSchema,
    taskIdParamSchema,
} = require('./tasks.validation');

const router = express.Router();

router.use(authenticate);

// POST /api/v1/tasks - Create task (Manager/Admin/TeamLead/SeniorDev)
router.post(
    '/',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD', 'SENIOR_DEVELOPER']),
    validate(createTaskSchema),
    tasksController.createTask
);

// GET /api/v1/tasks - Get all tasks
router.get(
    '/',
    validate(queryTasksSchema),
    tasksController.getTasks
);

// GET /api/v1/tasks/:id - Get task by ID
router.get(
    '/:id',
    validate(taskIdParamSchema),
    tasksController.getTaskById
);

// PUT /api/v1/tasks/:id - Update task
router.put(
    '/:id',
    validate({ ...taskIdParamSchema, ...updateTaskSchema }),
    tasksController.updateTask
);

// PATCH /api/v1/tasks/:id/status - Update task status
router.patch(
    '/:id/status',
    validate({ ...taskIdParamSchema, ...updateTaskStatusSchema }),
    tasksController.updateTaskStatus
);

// PATCH /api/v1/tasks/:id/assign - Assign task (Manager/Admin/TeamLead/SeniorDev)
router.patch(
    '/:id/assign',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD', 'SENIOR_DEVELOPER']),
    validate({ ...taskIdParamSchema, ...assignTaskSchema }),
    tasksController.assignTask
);

// POST /api/v1/tasks/:id/comments - Add a comment (all authenticated users)
router.post(
    '/:id/comments',
    tasksController.addComment
);

// POST /api/v1/tasks/:id/extension-request - Request a due date extension (assignee)
router.post(
    '/:id/extension-request',
    validate({ ...taskIdParamSchema, ...extensionRequestSchema }),
    tasksController.requestExtension
);

// DELETE /api/v1/tasks/:id - Delete task (Manager/Admin)
router.delete(
    '/:id',
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    validate(taskIdParamSchema),
    tasksController.deleteTask
);

module.exports = router;
