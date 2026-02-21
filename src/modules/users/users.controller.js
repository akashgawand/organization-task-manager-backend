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

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    changeUserRole,
};
