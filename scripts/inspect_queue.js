const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- LATEST DOMAIN EVENTS ---');
    const rawEvents = await prisma.notificationQueue.findMany({
        orderBy: { queue_id: 'desc' },
        take: 10
    });
    console.log(JSON.stringify(rawEvents.map(e => ({
        id: e.queue_id,
        type: e.event_type,
        actor: e.payload.actor_id,
        created_at: e.created_at
    })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
