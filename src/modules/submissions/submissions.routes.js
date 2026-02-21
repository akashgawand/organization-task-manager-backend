const express = require('express');
const submissionsController = require('./submissions.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
    createSubmissionSchema,
    updateSubmissionSchema,
    submissionIdParamSchema,
    taskIdParamSchema,
} = require('./submissions.validation');

const router = express.Router();

router.use(authenticate);

// POST /api/v1/submissions - Create submission
router.post(
    '/',
    validate(createSubmissionSchema),
    submissionsController.createSubmission.bind(submissionsController)
);

// GET /api/v1/submissions/task/:taskId - Get submissions by task
router.get(
    '/task/:taskId',
    validate(taskIdParamSchema),
    submissionsController.getSubmissionsByTask.bind(submissionsController)
);

// GET /api/v1/submissions/:id - Get submission by ID
router.get(
    '/:id',
    validate(submissionIdParamSchema),
    submissionsController.getSubmissionById.bind(submissionsController)
);

// PUT /api/v1/submissions/:id - Update submission (resubmit)
router.put(
    '/:id',
    validate({ ...submissionIdParamSchema, ...updateSubmissionSchema }),
    submissionsController.updateSubmission.bind(submissionsController)
);

module.exports = router;
