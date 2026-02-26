const { getPrismaClient } = require('../../config/db');
const { TASK_STATUS, SUBMISSION_STATUS, ACTIVITY_TYPES } = require('../../constants/taskStatus');
const notificationService = require('../notifications/notification.service');

const prisma = getPrismaClient();

class ReviewsService {
    async approveSubmission(submissionId, reviewNote, reviewerId) {
        const submission = await prisma.submission.findUnique({
            where: { submission_id: submissionId },
            include: {
                task: true,
                submitter: { select: { full_name: true } }
            },
        });

        if (!submission) throw new Error('Submission not found');

        if (submission.status !== SUBMISSION_STATUS.PENDING_REVIEW) {
            throw new Error('Submission is not pending review');
        }

        const result = await prisma.$transaction(async (tx) => {
            // Create review record
            const review = await tx.review.create({
                data: {
                    submission_id: submissionId,
                    reviewer_id: reviewerId,
                    review_note: reviewNote,
                    is_approved: true,
                },
                include: {
                    reviewer: { select: { user_id: true, full_name: true } },
                },
            });

            // Update submission status
            await tx.submission.update({
                where: { submission_id: submissionId },
                data: { status: SUBMISSION_STATUS.APPROVED },
            });

            // Update task status to VERIFIED
            await tx.task.update({
                where: { task_id: submission.task_id },
                data: { status: TASK_STATUS.VERIFIED },
            });

            // Create verified task record
            await tx.verifiedTask.create({
                data: {
                    task_id: submission.task_id,
                    reviewer_id: reviewerId,
                },
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    user_id: reviewerId,
                    task_id: submission.task_id,
                    activity_type: ACTIVITY_TYPES.TASK_APPROVED,
                    description: `Approved task: ${submission.task.title}`,
                },
            });

            return review;
        });

        // Queue notification
        let team_lead_id = null;
        const proj = await prisma.project.findUnique({ where: { project_id: submission.task.project_id } });
        if (proj && proj.team_id) {
            const team = await prisma.team.findUnique({ where: { team_id: proj.team_id } });
            if (team) team_lead_id = team.lead_id;
        }

        await notificationService.queueEvent('SUBMISSION_APPROVED', {
            task_id: submission.task_id,
            task_title: submission.task.title,
            submitter_id: submission.submitted_by,
            submitter_name: submission.submitter ? submission.submitter.full_name : 'Unknown',
            reviewer_name: result.reviewer.full_name,
            team_lead_id
        });

        return result;
    }

    async rejectSubmission(submissionId, reviewNote, reviewerId) {
        const submission = await prisma.submission.findUnique({
            where: { submission_id: submissionId },
            include: { task: true },
        });

        if (!submission) throw new Error('Submission not found');

        if (submission.status !== SUBMISSION_STATUS.PENDING_REVIEW) {
            throw new Error('Submission is not pending review');
        }

        const result = await prisma.$transaction(async (tx) => {
            // Create review record
            const review = await tx.review.create({
                data: {
                    submission_id: submissionId,
                    reviewer_id: reviewerId,
                    review_note: reviewNote,
                    is_approved: false,
                },
                include: {
                    reviewer: { select: { user_id: true, full_name: true } },
                },
            });

            // Update submission status
            await tx.submission.update({
                where: { submission_id: submissionId },
                data: { status: SUBMISSION_STATUS.SENT_BACK },
            });

            // Update task status to REJECTED (will loop back to ASSIGNED)
            await tx.task.update({
                where: { task_id: submission.task_id },
                data: { status: TASK_STATUS.REJECTED },
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    user_id: reviewerId,
                    task_id: submission.task_id,
                    activity_type: ACTIVITY_TYPES.TASK_REJECTED,
                    description: `Rejected task: ${submission.task.title}`,
                },
            });

            return review;
        });

        await notificationService.queueEvent('SUBMISSION_REJECTED', {
            task_id: submission.task_id,
            task_title: submission.task.title,
            submitter_id: submission.submitted_by,
            actor_name: result.reviewer.full_name
        });

        return result;
    }

    async getReviewsBySubmission(submissionId) {
        const submission = await prisma.submission.findUnique({
            where: { submission_id: parseInt(submissionId) },
        });

        if (!submission) throw new Error('Submission not found');

        const reviews = await prisma.review.findMany({
            where: { submission_id: parseInt(submissionId) },
            include: {
                reviewer: { select: { user_id: true, full_name: true, email: true } },
            },
            orderBy: { reviewed_at: 'desc' },
        });

        return reviews;
    }

    async getPendingReviews(all = false) {
        const query = {
            include: {
                task: {
                    include: {
                        project: { select: { name: true } },
                        phase: { select: { name: true } },
                        assignee: { select: { user_id: true, full_name: true } },
                    },
                },
                submitter: { select: { user_id: true, full_name: true, email: true } },
                reviews: {
                    include: {
                        reviewer: { select: { user_id: true, full_name: true } }
                    },
                    orderBy: { reviewed_at: 'desc' },
                    take: 1
                }
            },
            orderBy: { submitted_at: 'desc' },
        };

        if (!all) {
            query.where = { status: SUBMISSION_STATUS.PENDING_REVIEW };
        }

        const submissions = await prisma.submission.findMany(query);

        return submissions.map(sub => ({
            ...sub,
            attachments: sub.attachments ? JSON.parse(sub.attachments) : [],
        }));
    }
}

module.exports = new ReviewsService();
