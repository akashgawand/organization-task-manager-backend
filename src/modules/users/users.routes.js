const express = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
    updateUserSchema,
    changeRoleSchema,
    queryUsersSchema,
    userIdParamSchema,
    updateOwnProfileSchema,
    updatePasswordSchema
} = require('./users.validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/users - Get all users (Manager/Admin)
router.get(
    '/',
    requireRole(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD', 'SENIOR_DEVELOPER', 'EMPLOYEE']),
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
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    validate(userIdParamSchema),
    usersController.deleteUser
);

// PATCH /api/v1/users/:id/role - Change user role (Admin only)
router.patch(
    '/:id/role',
    requireRole(['SUPER_ADMIN', 'ADMIN']),
    validate({ ...userIdParamSchema, ...changeRoleSchema }),
    usersController.changeUserRole
);

// POST /api/v1/users/fcm-token - Save FCM device token
router.post(
    '/fcm-token',
    usersController.saveFcmToken
);

// PATCH /api/v1/users/profile - Update own profile
router.patch(
    '/profile',
    validate(updateOwnProfileSchema),
    usersController.updateOwnProfile
);

// PATCH /api/v1/users/password - Update own password
router.patch(
    '/password',
    validate(updatePasswordSchema),
    usersController.updatePassword
);

module.exports = router;
