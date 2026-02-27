const { PrismaClient } = require('@prisma/client');
const tasksService = require('../src/modules/tasks/tasks.service');

const prisma = new PrismaClient();

async function testStatusChange() {
    const task = await prisma.task.findFirst({
        where: { is_deleted: false, }
    });

    if (!task) {
        console.log("No task found to test with.");
        return;
    }

    console.log(`Testing edit status backwards on task ${task.task_id} from ${task.status} to TODO...`);

    try {
        await tasksService.updateTaskStatus(task.task_id, 'TODO', task.created_by, "ADMIN");
        console.log("SUCCESS! Status moved backwards.");
    } catch (err) {
        console.error("FAIL:", err.message);
    }
}

testStatusChange().catch(console.error).finally(() => prisma.$disconnect());
