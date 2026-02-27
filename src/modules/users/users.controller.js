const usersService = require('./users.service');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');

/**
 * Get all users
 */
const getUsers = async (req, res, next) => {
    try {
        const result = await usersService.getUsers(req.query);
        return paginatedResponse(
            res,
            result.data,
            result.pagination,
            'Users retrieved successfully'
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res, next) => {
    try {
        const user = await usersService.getUserById(req.params.id);
        return successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
        if (error.message === 'User not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * Update user
 */
const updateUser = async (req, res, next) => {
    try {
        const user = await usersService.updateUser(req.params.id, req.body);
        return successResponse(res, user, 'User updated successfully');
    } catch (error) {
        if (error.message === 'User not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * Delete user
 */
const deleteUser = async (req, res, next) => {
    try {
        await usersService.deleteUser(req.params.id);
        return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
        if (error.message === 'User not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * Change user role
 */
const changeUserRole = async (req, res, next) => {
    try {
        const user = await usersService.changeUserRole(req.params.id, req.body.role);
        return successResponse(res, user, 'User role updated successfully');
    } catch (error) {
        if (error.message === 'User not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * Update own profile
 */
const updateOwnProfile = async (req, res, next) => {
    try {
        const user = await usersService.updateOwnProfile(req.user.user_id, req.body);
        return successResponse(res, user, 'Profile updated successfully');
    } catch (error) {
        if (error.message === 'Email already in use') {
            return errorResponse(res, error.message, 400);
        }
        if (error.message === 'User not found or inactive') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * Update password
 */
const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        await usersService.updatePassword(req.user.user_id, currentPassword, newPassword);
        return successResponse(res, null, 'Password updated successfully');
    } catch (error) {
        if (error.message === 'Incorrect current password') {
            return errorResponse(res, error.message, 400);
        }
        if (error.message === 'User not found or inactive') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

/**
 * Save FCM token
 */
const saveFcmToken = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            return errorResponse(res, 'Token is required', 400);
        }
        await usersService.saveFcmToken(req.user.user_id, token);
        return successResponse(res, null, 'FCM token saved successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    changeUserRole,
    updateOwnProfile,
    updatePassword,
    saveFcmToken,
};
