const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const rawEvents = await prisma.notificationQueue.findMany({ orderBy: { queue_id: 'desc' }, take: 2 });
    console.log('--- Domain Events ---');
    console.log(JSON.stringify(rawEvents, null, 2));

    const pushes = await prisma.pushNotificationQueue.findMany({ orderBy: { id: 'desc' }, take: 4 });
    console.log('\n--- Push Deliveries ---');
    console.log(JSON.stringify(pushes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
