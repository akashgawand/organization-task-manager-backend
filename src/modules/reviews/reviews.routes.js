const express = require('express');
const reviewsController = require('./reviews.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
    approveSubmissionSchema,
    rejectSubmissionSchema,
    submissionIdParamSchema,
} = require('./reviews.validation');

const router = express.Router();

router.use(authenticate);
router.use(requirePermission('review:read')); // Baseline permission for all review operations

// POST /api/v1/reviews/approve - Approve submission
router.post(
    '/approve',
    requirePermission('review:create'),
    validate(approveSubmissionSchema),
    reviewsController.approveSubmission.bind(reviewsController)
);

// POST /api/v1/reviews/reject - Reject submission
router.post(
    '/reject',
    requirePermission('review:create'),
    validate(rejectSubmissionSchema),
    reviewsController.rejectSubmission.bind(reviewsController)
);

// GET /api/v1/reviews/submission/:submissionId - Get reviews by submission
router.get(
    '/submission/:submissionId',
    validate(submissionIdParamSchema),
    reviewsController.getReviewsBySubmission.bind(reviewsController)
);

// GET /api/v1/reviews/pending - Get pending reviews
router.get(
    '/pending',
    reviewsController.getPendingReviews.bind(reviewsController)
);

module.exports = router;
