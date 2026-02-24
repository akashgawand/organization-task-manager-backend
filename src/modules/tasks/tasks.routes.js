const express = require('express');
const tasksController = require('./tasks.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
    createTaskSchema,
    updateTaskSchema,
    updateTaskStatusSchema,
    assignTaskSchema,
    queryTasksSchema,
    taskIdParamSchema,
} = require('./tasks.validation');

const router = express.Router();

router.use(authenticate);

// POST /api/v1/tasks - Create task (Manager/Admin)
router.post(
    '/',
    requirePermission('task:create'),
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

// PATCH /api/v1/tasks/:id/assign - Assign task (Manager/Admin)
router.patch(
    '/:id/assign',
    requirePermission('task:assign'),
    validate({ ...taskIdParamSchema, ...assignTaskSchema }),
    tasksController.assignTask
);

// POST /api/v1/tasks/:id/comments - Add a comment (all authenticated users)
router.post(
    '/:id/comments',
    tasksController.addComment
);

// DELETE /api/v1/tasks/:id - Delete task (Manager/Admin)
router.delete(
    '/:id',
    requirePermission('task:delete'),
    validate(taskIdParamSchema),
    tasksController.deleteTask
);

module.exports = router;
