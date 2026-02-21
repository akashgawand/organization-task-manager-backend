const { Prisma } = require('@prisma/client');
const { ZodError } = require('zod');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
    });

    // Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return handlePrismaError(err, res);
    }

    // Prisma validation errors
    if (err instanceof Prisma.PrismaClientValidationError) {
        return res.status(400).json({
            success: false,
            message: 'Invalid data provided',
            ...(config.nodeEnv === 'development' && { error: err.message }),
        });
    }

    // Zod validation errors
    if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired',
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
};

/**
 * Handle Prisma-specific errors
 */
const handlePrismaError = (err, res) => {
    switch (err.code) {
        case 'P2002':
            // Unique constraint violation
            const field = err.meta?.target?.[0] || 'field';
            return res.status(409).json({
                success: false,
                message: `A record with this ${field} already exists`,
            });

        case 'P2025':
            // Record not found
            return res.status(404).json({
                success: false,
                message: 'Record not found',
            });

        case 'P2003':
            // Foreign key constraint violation
            return res.status(400).json({
                success: false,
                message: 'Invalid reference to related record',
            });

        case 'P2014':
            // Required relation violation
            return res.status(400).json({
                success: false,
                message: 'The change violates a required relation',
            });

        default:
            return res.status(500).json({
                success: false,
                message: 'Database error occurred',
                ...(config.nodeEnv === 'development' && { error: err.message }),
            });
    }
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`,
    });
};

module.exports = {
    errorHandler,
    notFoundHandler,
};
