const express = require('express');
const multer = require('multer');
const attachmentsController = require('./attachments.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

// Multer config — store in memory buffer (will upload to R2)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.use(authenticate);

// POST /api/v1/tasks/:taskId/attachments — Upload a document
router.post(
    '/tasks/:taskId/attachments',
    upload.single('file'),
    attachmentsController.uploadAttachment
);

// GET /api/v1/tasks/:taskId/attachments — List attachments for a task
router.get(
    '/tasks/:taskId/attachments',
    attachmentsController.getAttachments
);

// DELETE /api/v1/attachments/:id — Delete an attachment
router.delete(
    '/attachments/:id',
    attachmentsController.deleteAttachment
);

module.exports = router;
