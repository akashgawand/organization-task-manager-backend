const { errorResponse } = require('../utils/response');
const { getPrismaClient } = require('../config/db');

/**
 * Check if user has required permission using the DB tables
 * @param {string} permission - Required permission string
 */
const requirePermission = (permission) => {
    return async (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required', 401);
        }

        try {
            const prisma = getPrismaClient();
            const permissionsData = await prisma.$queryRawUnsafe(`
                SELECT p.name 
                FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                JOIN role_permissions rp ON r.id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = ?
            `, req.user.user_id);

            const userPermissions = permissionsData.map(p => p.name);

            if (!userPermissions.includes(permission)) {
                return errorResponse(
                    res,
                    `Insufficient permissions. Requires: ${permission}`,
                    403
                );
            }

            next();
        } catch (error) {
            console.error("RBAC Permission Check Error:", error);
            return errorResponse(res, 'Error verifying specific permissions', 500);
        }
    };
};

/**
 * Check if user has required role using DB tables
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required', 401);
        }

        try {
            const prisma = getPrismaClient();
            const rolesData = await prisma.$queryRawUnsafe(`
                SELECT r.name 
                FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = ?
            `, req.user.user_id);

            const userRoles = rolesData.map(r => r.name);
            const hasAccess = userRoles.some(role => allowedRoles.includes(role));

            if (!hasAccess) {
                return errorResponse(
                    res,
                    'Insufficient permissions to access this resource',
                    403
                );
            }

            next();
        } catch (error) {
            console.error("RBAC Role Check Error:", error);
            return errorResponse(res, 'Error verifying role permissions', 500);
        }
    };
};

/**
 * Check if user is admin
 */
const requireAdmin = requireRole(['ADMIN', 'SUPER_ADMIN']);

/**
 * Check if user is admin or manager
 */
const requireManagerOrAdmin = requireRole(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD']);

/**
 * Check if user is reviewer, admin, or manager
 */
const requireReviewer = requireRole(['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD', 'REVIEWER']);

/**
 * Check if user owns the resource or is admin
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 */
const requireOwnershipOrAdmin = (getResourceOwnerId) => {
    return async (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required', 401);
        }

        try {
            const prisma = getPrismaClient();
            const rolesData = await prisma.$queryRawUnsafe(`
                SELECT r.name 
                FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = ?
            `, req.user.user_id);

            const userRoles = rolesData.map(r => r.name);

            // Admins can access any resource
            if (userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN')) {
                return next();
            }

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
            console.error("RBAC Ownership Check Error:", error);
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
    requirePermission,
};
