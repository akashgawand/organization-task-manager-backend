const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { r2Client, R2_BUCKET, R2_PUBLIC_URL } = require('../../config/r2');
const { getPrismaClient } = require('../../config/db');
const path = require('path');

const prisma = getPrismaClient();

// Allowed document MIME types
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const uploadAttachment = async (taskId, file, userId) => {
    // Validate task exists
    const task = await prisma.task.findUnique({ where: { task_id: parseInt(taskId) } });
    if (!task || task.is_deleted) throw new Error('Task not found');

    // Validate file type
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(`File type not allowed. Accepted types: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds the 10MB limit');
    }

    // Generate unique key for R2
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `task-attachments/${taskId}/${timestamp}_${safeName}`;

    // Upload to R2
    await r2Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
    }));

    // Build public URL
    const fileUrl = `${R2_PUBLIC_URL}/${fileKey}`;

    // Save metadata to DB
    const attachment = await prisma.taskAttachment.create({
        data: {
            task_id: parseInt(taskId),
            file_name: file.originalname,
            file_url: fileUrl,
            file_key: fileKey,
            file_type: file.mimetype,
            file_size: file.size,
            uploaded_by: userId,
        },
    });

    return attachment;
};

const getAttachments = async (taskId) => {
    const attachments = await prisma.taskAttachment.findMany({
        where: { task_id: parseInt(taskId) },
        orderBy: { created_at: 'desc' },
        include: {
            uploader: { select: { user_id: true, full_name: true } },
        },
    });
    return attachments;
};

const deleteAttachment = async (attachmentId, userId) => {
    const attachment = await prisma.taskAttachment.findUnique({
        where: { attachment_id: parseInt(attachmentId) },
    });

    if (!attachment) throw new Error('Attachment not found');

    // Delete from R2
    try {
        await r2Client.send(new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: attachment.file_key,
        }));
    } catch (err) {
        console.error('Failed to delete file from R2:', err);
        // Still proceed to delete DB record
    }

    // Delete from DB
    await prisma.taskAttachment.delete({
        where: { attachment_id: parseInt(attachmentId) },
    });

    return { message: 'Attachment deleted successfully' };
};

module.exports = {
    uploadAttachment,
    getAttachments,
    deleteAttachment,
};
