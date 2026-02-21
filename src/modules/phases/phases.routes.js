const express = require('express');
const phasesController = require('./phases.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireManagerOrAdmin } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
    createPhaseSchema,
    updatePhaseSchema,
    reorderPhasesSchema,
    phaseIdParamSchema,
    projectIdParamSchema,
} = require('./phases.validation');

const router = express.Router();

router.use(authenticate);

// POST /api/v1/phases - Create phase (Manager/Admin)
router.post(
    '/',
    requireManagerOrAdmin,
    validate(createPhaseSchema),
    phasesController.createPhase.bind(phasesController)
);

// GET /api/v1/phases/project/:projectId - Get phases by project
router.get(
    '/project/:projectId',
    validate(projectIdParamSchema),
    phasesController.getPhasesByProject.bind(phasesController)
);

// PUT /api/v1/phases/:id - Update phase (Manager/Admin)
router.put(
    '/:id',
    requireManagerOrAdmin,
    validate({ ...phaseIdParamSchema, ...updatePhaseSchema }),
    phasesController.updatePhase.bind(phasesController)
);

// DELETE /api/v1/phases/:id - Delete phase (Manager/Admin)
router.delete(
    '/:id',
    requireManagerOrAdmin,
    validate(phaseIdParamSchema),
    phasesController.deletePhase.bind(phasesController)
);

// PATCH /api/v1/phases/reorder - Reorder phases (Manager/Admin)
router.patch(
    '/reorder',
    requireManagerOrAdmin,
    validate(reorderPhasesSchema),
    phasesController.reorderPhases.bind(phasesController)
);

module.exports = router;
