const express = require('express');
const projectsController = require('./projects.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
    createProjectSchema,
    updateProjectSchema,
    queryProjectsSchema,
    projectIdParamSchema,
} = require('./projects.validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /api/v1/projects - Create project (Manager/Admin)
router.post(
    '/',
    requirePermission('project:create'),
    validate(createProjectSchema),
    projectsController.createProject
);

// GET /api/v1/projects - Get all projects
router.get(
    '/',
    validate(queryProjectsSchema),
    projectsController.getProjects
);

// GET /api/v1/projects/:id - Get project by ID
router.get(
    '/:id',
    validate(projectIdParamSchema),
    projectsController.getProjectById
);

// PUT /api/v1/projects/:id - Update project (Manager/Admin)
router.put(
    '/:id',
    requirePermission('project:update'),
    validate({ ...projectIdParamSchema, ...updateProjectSchema }),
    projectsController.updateProject
);

// DELETE /api/v1/projects/:id - Delete project (Manager/Admin)
router.delete(
    '/:id',
    requirePermission('project:delete'),
    validate(projectIdParamSchema),
    projectsController.deleteProject
);

module.exports = router;
