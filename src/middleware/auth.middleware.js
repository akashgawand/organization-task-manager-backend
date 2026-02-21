const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { errorResponse } = require('../utils/response');
const { getPrismaClient } = require('../config/db');

const prisma = getPrismaClient();

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 'No token provided', 401);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, config.jwt.accessSecret);

        // Fetch user from database
        const user = await prisma.user.findUnique({
            where: { user_id: decoded.userId },
            select: {
                user_id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
                is_deleted: true,
            },
        });

        if (!user) {
            return errorResponse(res, 'User not found', 401);
        }

        if (!user.is_active || user.is_deleted) {
            return errorResponse(res, 'Account is inactive or deleted', 403);
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return errorResponse(res, 'Invalid token', 401);
        }
        if (error.name === 'TokenExpiredError') {
            return errorResponse(res, 'Token expired', 401);
        }
        return errorResponse(res, 'Authentication failed', 401);
    }
};

/**
 * Optional authentication - attach user if token exists, but don't require it
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, config.jwt.accessSecret);

        const user = await prisma.user.findUnique({
            where: { user_id: decoded.userId },
            select: {
                user_id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
                is_deleted: true,
            },
        });

        if (user && user.is_active && !user.is_deleted) {
            req.user = user;
        }

        next();
    } catch (error) {
        // Ignore errors for optional authentication
        next();
    }
};

module.exports = {
    authenticate,
    optionalAuthenticate,
};
