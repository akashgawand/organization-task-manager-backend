const reviewsService = require('./reviews.service');
const { successResponse, errorResponse } = require('../../utils/response');

const approveSubmission = async (req, res, next) => {
    try {
        const review = await reviewsService.approveSubmission(
            req.body.submission_id,
            req.body.review_note,
            req.user.user_id
        );
        return successResponse(res, review, 'Submission approved successfully');
    } catch (error) {
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        if (error.message.includes('not pending')) {
            return errorResponse(res, error.message, 400);
        }
        next(error);
    }
};

const rejectSubmission = async (req, res, next) => {
    try {
        const review = await reviewsService.rejectSubmission(
            req.body.submission_id,
            req.body.review_note,
            req.user.user_id
        );
        return successResponse(res, review, 'Submission rejected successfully');
    } catch (error) {
        if (error.message.includes('not found')) {
            return errorResponse(res, error.message, 404);
        }
        if (error.message.includes('not pending')) {
            return errorResponse(res, error.message, 400);
        }
        next(error);
    }
};

const getReviewsBySubmission = async (req, res, next) => {
    try {
        const reviews = await reviewsService.getReviewsBySubmission(req.params.submissionId);
        return successResponse(res, reviews, 'Reviews retrieved successfully');
    } catch (error) {
        if (error.message === 'Submission not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

const getPendingReviews = async (req, res, next) => {
    try {
        const isAll = req.query.all === 'true';
        const submissions = await reviewsService.getPendingReviews(isAll);
        return successResponse(res, submissions, 'Reviews retrieved successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    approveSubmission,
    rejectSubmission,
    getReviewsBySubmission,
    getPendingReviews,
};
