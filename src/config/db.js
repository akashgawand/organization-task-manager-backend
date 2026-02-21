const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// Singleton pattern for Prisma Client
let prisma;

const getPrismaClient = () => {
    if (!prisma) {
        prisma = new PrismaClient({
            log: [
                { level: 'query', emit: 'event' },
                { level: 'error', emit: 'stdout' },
                { level: 'warn', emit: 'stdout' },
            ],
        });

        // Log queries in development
        if (process.env.NODE_ENV === 'development') {
            prisma.$on('query', (e) => {
                logger.debug(`Query: ${e.query}`);
                logger.debug(`Duration: ${e.duration}ms`);
            });
        }
    }
    return prisma;
};

const connectDatabase = async () => {
    try {
        const client = getPrismaClient();
        await client.$connect();
        logger.info('✅ Database connected successfully');
        return client;
    } catch (error) {
        logger.error('❌ Database connection failed:', error);
        throw error;
    }
};

const disconnectDatabase = async () => {
    try {
        if (prisma) {
            await prisma.$disconnect();
            logger.info('Database disconnected');
        }
    } catch (error) {
        logger.error('Error disconnecting database:', error);
        throw error;
    }
};

module.exports = {
    getPrismaClient,
    connectDatabase,
    disconnectDatabase,
};
