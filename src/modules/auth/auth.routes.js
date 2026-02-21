const express = require('express');
const authController = require('./auth.controller');
const { validate } = require('../../middleware/validate.middleware');
const { registerSchema, loginSchema, refreshTokenSchema } = require('./auth.validation');

const router = express.Router();

// POST /api/v1/auth/register - Register new user
router.post(
    '/register',
    validate(registerSchema),
    authController.register
);

// POST /api/v1/auth/login - Login user
router.post(
    '/login',
    validate(loginSchema),
    authController.login
);

// POST /api/v1/auth/refresh-token - Refresh access token
router.post(
    '/refresh-token',
    validate(refreshTokenSchema),
    authController.refreshToken
);

// POST /api/v1/auth/logout - Logout user
router.post(
    '/logout',
    validate(refreshTokenSchema),
    authController.logout
);

module.exports = router;
