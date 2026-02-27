const { PrismaClient } = require('@prisma/client');
const notificationService = require('../src/modules/notifications/notification.service');
const prisma = new PrismaClient();

async function testExtension() {
    // find a task
    const task = await prisma.task.findFirst({
        where: { is_deleted: false },
        include: { assignees: true }
    });

    if (!task) {
        console.log("No task found to test with.");
        return;
    }

    const assignee = task.assignees[0];
    if (!assignee) {
        console.log("Task has no assignees. Adding one for test...");
        // Add user 11 as an assignee
        await prisma.task.update({
            where: { task_id: task.task_id },
            data: { assignees: { connect: { user_id: 11 } } }
        });
        task.assignees = [{ user_id: 11, full_name: 'Test Assignee' }];
    }

    console.log(`Testing extension request from assignee ${task.assignees[0].user_id} on task ${task.task_id}...`);

    await notificationService.queueEvent('EXTENSION_REQUESTED', {
        task_id: task.task_id,
        task_title: task.title,
        actor_id: task.assignees[0].user_id,
        actor_name: task.assignees[0].full_name || 'Assignee',
        reason: "I need more time for research.",
        requested_date: new Date(Date.now() + 86400000 * 3).toISOString(), // +3 days
        creator_id: task.created_by,
        team_lead_id: null
    });

    console.log("Successfully queued EXTENSION_REQUESTED event.");
}

testExtension().catch(console.error).finally(() => prisma.$disconnect());
