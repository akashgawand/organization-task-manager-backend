const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.user.updateMany({
        data: {
            fcm_tokens: null
        }
    });
    console.log("Tokens cleared.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
