const admin = require('../src/config/firebase');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPush() {
    const users = await prisma.user.findMany({
        where: { fcm_tokens: { not: null } }
    });

    console.log(`Found ${users.length} users with tokens.`);

    for (const u of users) {
        if (!u.fcm_tokens) continue;

        let tokens = [];
        try {
            tokens = typeof u.fcm_tokens === 'string' ? JSON.parse(u.fcm_tokens) : u.fcm_tokens;
        } catch (e) {
            console.log("Failed to parse tokens for user", u.user_id);
            continue;
        }

        if (Array.isArray(tokens) && tokens.length > 0) {
            console.log(`Sending manual test push to User ${u.user_id} with tokens:`, tokens);
            const message = {
                notification: {
                    title: 'System Debug Push',
                    body: 'This is a test ' + new Date().toISOString()
                },
                data: {
                    url: '/dashboard'
                },
                tokens: tokens
            };

            try {
                const response = await admin.messaging().sendEachForMulticast(message);
                console.log(`Success: ${response.successCount}, Failure: ${response.failureCount}`);
            } catch (err) {
                console.error('Error sending:', err);
            }
        }
    }
}

testPush().then(() => prisma.$disconnect()).catch(console.error);
