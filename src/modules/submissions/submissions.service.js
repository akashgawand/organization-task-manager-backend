const { getPrismaClient } = require('../../config/db');
const { TASK_STATUS, SUBMISSION_STATUS, ACTIVITY_TYPES } = require('../../constants/taskStatus');
const notificationService = require('../notifications/notification.service');

const prisma = getPrismaClient();

class SubmissionsService {
    async createSubmission(submissionData, userId) {
        const { task_id, submission_note, attachments } = submissionData;

        const task = await prisma.task.findUnique({ where: { task_id } });
        if (!task || task.is_deleted) throw new Error('Task not found');

        // Validate task status
        if (task.status !== TASK_STATUS.IN_PROGRESS && task.status !== TASK_STATUS.REJECTED) {
            throw new Error('Task must be in IN_PROGRESS or REJECTED status to submit');
        }

        // Verify user is assigned to the task
        if (task.assigned_to !== userId) {
            throw new Error('Only the assigned user can submit this task');
        }

        const submission = await prisma.$transaction(async (tx) => {
            // Create submission
            const newSubmission = await tx.submission.create({
                data: {
                    task_id,
                    submitted_by: userId,
                    submission_note,
                    attachments: attachments ? JSON.stringify(attachments) : null,
                    status: SUBMISSION_STATUS.PENDING_REVIEW,
                },
                include: {
                    task: { select: { task_id: true, title: true } },
                    submitter: { select: { user_id: true, full_name: true } },
                },
            });

            // Update task status to SUBMITTED
            await tx.task.update({
                where: { task_id },
                data: { status: TASK_STATUS.SUBMITTED },
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    user_id: userId,
                    task_id,
                    activity_type: ACTIVITY_TYPES.TASK_SUBMITTED,
                    description: `Submitted task: ${task.title}`,
                },
            });

            return newSubmission;
        });

        // Queue notification
        let team_lead_id = null;
        const proj = await prisma.project.findUnique({ where: { project_id: task.project_id } });
        if (proj && proj.team_id) {
            const team = await prisma.team.findUnique({ where: { team_id: proj.team_id } });
            if (team) team_lead_id = team.lead_id;
        }

        await notificationService.queueEvent('REVIEW_REQUESTED', {
            task_id,
            task_title: task.title,
            actor_name: submission.submitter.full_name,
            team_lead_id
        });

        return submission;
    }

    async getSubmissionsByTask(taskId) {
        const task = await prisma.task.findUnique({ where: { task_id: parseInt(taskId) } });
        if (!task || task.is_deleted) throw new Error('Task not found');

        const submissions = await prisma.submission.findMany({
            where: { task_id: parseInt(taskId) },
            include: {
                submitter: { select: { user_id: true, full_name: true, email: true } },
                reviews: {
                    include: {
                        reviewer: { select: { user_id: true, full_name: true } },
                    },
                },
            },
            orderBy: { submitted_at: 'desc' },
        });

        return submissions.map(sub => ({
            ...sub,
            attachments: sub.attachments ? JSON.parse(sub.attachments) : [],
        }));
    }

    async getSubmissionById(submissionId) {
        const submission = await prisma.submission.findUnique({
            where: { submission_id: parseInt(submissionId) },
            include: {
                task: {
                    include: {
                        project: { select: { name: true } },
                        phase: { select: { name: true } },
                    },
                },
                submitter: { select: { user_id: true, full_name: true, email: true } },
                reviews: {
                    include: {
                        reviewer: { select: { user_id: true, full_name: true, email: true } },
                    },
                    orderBy: { reviewed_at: 'desc' },
                },
            },
        });

        if (!submission) throw new Error('Submission not found');

        return {
            ...submission,
            attachments: submission.attachments ? JSON.parse(submission.attachments) : [],
        };
    }

    async updateSubmission(submissionId, updateData, userId) {
        const submission = await prisma.submission.findUnique({
            where: { submission_id: parseInt(submissionId) },
        });

        if (!submission) throw new Error('Submission not found');

        // Only submitter can update
        if (submission.submitted_by !== userId) {
            throw new Error('Only the submitter can update this submission');
        }

        // Can only update if sent back
        if (submission.status !== SUBMISSION_STATUS.SENT_BACK) {
            throw new Error('Can only update submissions that were sent back');
        }

        const updatedSubmission = await prisma.submission.update({
            where: { submission_id: parseInt(submissionId) },
            data: {
                ...updateData,
                ...(updateData.attachments && { attachments: JSON.stringify(updateData.attachments) }),
                status: SUBMISSION_STATUS.PENDING_REVIEW,
            },
            include: {
                task: { select: { task_id: true, title: true } },
                submitter: { select: { user_id: true, full_name: true } },
            },
        });

        return {
            ...updatedSubmission,
            attachments: updatedSubmission.attachments ? JSON.parse(updatedSubmission.attachments) : [],
        };
    }
}

module.exports = new SubmissionsService();
