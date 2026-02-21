const express = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin, requireManagerOrAdmin } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
    updateUserSchema,
    changeRoleSchema,
    queryUsersSchema,
    userIdParamSchema,
} = require('./users.validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/users - Get all users (Manager/Admin)
router.get(
    '/',
    requireManagerOrAdmin,
    validate(queryUsersSchema),
    usersController.getUsers
);

// GET /api/v1/users/:id - Get user by ID
router.get(
    '/:id',
    validate(userIdParamSchema),
    usersController.getUserById
);

// PUT /api/v1/users/:id - Update user
router.put(
    '/:id',
    validate({ ...userIdParamSchema, ...updateUserSchema }),
    usersController.updateUser
);

// DELETE /api/v1/users/:id - Delete user (Admin only)
router.delete(
    '/:id',
    requireAdmin,
    validate(userIdParamSchema),
    usersController.deleteUser
);

// PATCH /api/v1/users/:id/role - Change user role (Admin only)
router.patch(
    '/:id/role',
    requireAdmin,
    validate({ ...userIdParamSchema, ...changeRoleSchema }),
    usersController.changeUserRole
);

module.exports = router;
