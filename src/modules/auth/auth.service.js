const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPrismaClient } = require('../../config/db');
const config = require('../../config/env');
const logger = require('../../utils/logger');

const prisma = getPrismaClient();

/**
 * Generate access token
 */
const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiry,
    });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiry,
    });
};

/**
 * Register a new user
 */
const register = async (userData) => {
    const { email, password, full_name, role } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            full_name,
            role: role || 'EMPLOYEE',
        },
        select: {
            user_id: true,
            email: true,
            full_name: true,
            role: true,
            created_at: true,
        },
    });

    logger.info(`New user registered: ${email}`);

    return user;
};

/**
 * Login user and generate tokens
 */
const login = async (email, password) => {
    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (!user.is_active || user.is_deleted) {
        throw new Error('Account is inactive or deleted');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.user_id);
    const refreshToken = generateRefreshToken(user.user_id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
        data: {
            user_id: user.user_id,
            token: refreshToken,
            expires_at: expiresAt,
        },
    });

    logger.info(`User logged in: ${email}`);

    return {
        user: {
            user_id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
        },
        accessToken,
        refreshToken,
    };
};

/**
 * Refresh access token
 */
const refreshToken = async (refreshTokenValue) => {
    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshTokenValue, config.jwt.refreshSecret);

        // Check if token exists in database
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshTokenValue },
            include: { user: true },
        });

        if (!storedToken) {
            throw new Error('Invalid refresh token');
        }

        // Check if token is expired
        if (new Date() > storedToken.expires_at) {
            // Delete expired token
            await prisma.refreshToken.delete({
                where: { token_id: storedToken.token_id },
            });
            throw new Error('Refresh token expired');
        }

        // Check if user is active
        if (!storedToken.user.is_active || storedToken.user.is_deleted) {
            throw new Error('Account is inactive or deleted');
        }

        // Generate new access token
        const accessToken = generateAccessToken(storedToken.user.user_id);

        return {
            accessToken,
            user: {
                user_id: storedToken.user.user_id,
                email: storedToken.user.email,
                full_name: storedToken.user.full_name,
                role: storedToken.user.role,
            },
        };
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

/**
 * Logout user (invalidate refresh token)
 */
const logout = async (refreshTokenValue) => {
    await prisma.refreshToken.deleteMany({
        where: { token: refreshTokenValue },
    });

    logger.info('User logged out');
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    generateAccessToken,
    generateRefreshToken,
};
