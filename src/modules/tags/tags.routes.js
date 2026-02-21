const express = require('express');
const router = express.Router();
const tagsController = require('./tags.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin, requireManagerOrAdmin } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validate.middleware');
const tagsValidation = require('./tags.validation');

router.use(authenticate);

router.post('/', requireManagerOrAdmin, validate(tagsValidation.createTag), tagsController.createTag);
router.get('/', validate(tagsValidation.getTags), tagsController.getTags);
router.get('/:id', validate(tagsValidation.getTagById), tagsController.getTagById);
router.put('/:id', requireManagerOrAdmin, validate(tagsValidation.updateTag), tagsController.updateTag);
router.delete('/:id', requireAdmin, validate(tagsValidation.deleteTag), tagsController.deleteTag);

module.exports = router;
