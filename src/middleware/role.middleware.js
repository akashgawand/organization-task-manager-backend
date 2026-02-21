const { errorResponse } = require('../utils/response');
const { canAccessResource } = require('../constants/roles');

/**
 * Check if user has required role
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required', 401);
        }

        if (!canAccessResource(req.user.role, allowedRoles)) {
            return errorResponse(
                res,
                'Insufficient permissions to access this resource',
                403
            );
        }

        next();
    };
};

/**
 * Check if user is admin
 */
const requireAdmin = requireRole(['ADMIN']);

/**
 * Check if user is admin or manager
 */
const requireManagerOrAdmin = requireRole(['SUPER_ADMIN', 'ADMIN']);

/**
 * Check if user is reviewer, admin, or manager
 */
const requireReviewer = requireRole(['ADMIN', 'MANAGER', 'REVIEWER']);

/**
 * Check if user owns the resource or is admin
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 */
const requireOwnershipOrAdmin = (getResourceOwnerId) => {
    return async (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required', 401);
        }

        // Admins can access any resource
        if (req.user.role === 'ADMIN') {
            return next();
        }

        try {
            const ownerId = await getResourceOwnerId(req);

            if (req.user.user_id !== ownerId) {
                return errorResponse(
                    res,
                    'You do not have permission to access this resource',
                    403
                );
            }

            next();
        } catch (error) {
            return errorResponse(res, 'Error verifying resource ownership', 500);
        }
    };
};

module.exports = {
    requireRole,
    requireAdmin,
    requireManagerOrAdmin,
    requireReviewer,
    requireOwnershipOrAdmin,
};
