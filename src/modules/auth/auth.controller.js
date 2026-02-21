const authService = require('./auth.service');
const { successResponse, errorResponse, createdResponse } = require('../../utils/response');

/**
 * Register a new user
 */
const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        return createdResponse(res, user, 'User registered successfully');
    } catch (error) {
        if (error.message === 'User with this email already exists') {
            return errorResponse(res, error.message, 409);
        }
        next(error);
    }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        return successResponse(res, result, 'Login successful');
    } catch (error) {
        if (
            error.message === 'Invalid credentials' ||
            error.message === 'Account is inactive or deleted'
        ) {
            return errorResponse(res, error.message, 401);
        }
        next(error);
    }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        const result = await authService.refreshToken(refresh_token);
        return successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
        return errorResponse(res, error.message, 401);
    }
};

/**
 * Logout user
 */
const logout = async (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        await authService.logout(refresh_token);
        return successResponse(res, null, 'Logout successful');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
};
