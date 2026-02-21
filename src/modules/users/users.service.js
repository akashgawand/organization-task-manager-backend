const { getPrismaClient } = require('../../config/db');
const { getPaginationParams, createPaginatedResponse } = require('../../utils/pagination');

const prisma = getPrismaClient();

class UsersService {
    /**
     * Get all users with pagination and filtering
     */
    async getUsers({ page, limit, role, search }) {
        const { skip, take } = getPaginationParams(page, limit);

        const where = {
            is_deleted: false,
            ...(role && { role }),
            ...(search && {
                OR: [
                    { full_name: { contains: search } },
                    { email: { contains: search } },
                ],
            }),
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take,
                select: {
                    user_id: true,
                    email: true,
                    full_name: true,
                    role: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true,
                },
                orderBy: { created_at: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        return createPaginatedResponse(users, total, page, limit);
    }

    /**
     * Get user by ID with activity stats
     */
    async getUserById(userId) {
        const user = await prisma.user.findUnique({
            where: { user_id: parseInt(userId) },
            select: {
                user_id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
                created_at: true,
                updated_at: true,
                _count: {
                    select: {
                        created_tasks: true,
                        assigned_tasks: true,
                        submissions: true,
                        reviews: true,
                    },
                },
            },
        });

        if (!user || user.is_deleted) {
            throw new Error('User not found');
        }

        return user;
    }

    /**
     * Update user profile
     */
    async updateUser(userId, updateData) {
        const user = await prisma.user.findUnique({
            where: { user_id: parseInt(userId) },
        });

        if (!user || user.is_deleted) {
            throw new Error('User not found');
        }

        const updatedUser = await prisma.user.update({
            where: { user_id: parseInt(userId) },
            data: updateData,
            select: {
                user_id: true,
                email: true,
                full_name: true,
                role: true,
                is_active: true,
                updated_at: true,
            },
        });

        return updatedUser;
    }

    /**
     * Soft delete user
     */
    async deleteUser(userId) {
        const user = await prisma.user.findUnique({
            where: { user_id: parseInt(userId) },
        });

        if (!user || user.is_deleted) {
            throw new Error('User not found');
        }

        await prisma.user.update({
            where: { user_id: parseInt(userId) },
            data: {
                is_deleted: true,
                is_active: false,
            },
        });
    }

    /**
     * Change user role (admin only)
     */
    async changeUserRole(userId, newRole) {
        const user = await prisma.user.findUnique({
            where: { user_id: parseInt(userId) },
        });

        if (!user || user.is_deleted) {
            throw new Error('User not found');
        }

        const updatedUser = await prisma.user.update({
            where: { user_id: parseInt(userId) },
            data: { role: newRole },
            select: {
                user_id: true,
                email: true,
                full_name: true,
                role: true,
            },
        });

        return updatedUser;
    }
}

module.exports = new UsersService();
