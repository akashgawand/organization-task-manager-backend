const { PrismaClient } = require('@prisma/client');
const tasksService = require('../src/modules/tasks/tasks.service');

const prisma = new PrismaClient();

async function testUpdate() {
    const task = await prisma.task.findFirst({
        where: { is_deleted: false, }
    });

    if (!task) {
        console.log("No task found to test with.");
        return;
    }

    console.log(`Testing edit date on task ${task.task_id}...`);

    try {
        await tasksService.updateTask(task.task_id, {
            deadline: "2026-03-05"
        }, task.created_by, "ADMIN");
        console.log("SUCCESS! Update passed.");
    } catch (err) {
        console.error("FAIL:", err.message);
    }
}

testUpdate().catch(console.error).finally(() => prisma.$disconnect());
