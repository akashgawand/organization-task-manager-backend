const { getPrismaClient } = require('../../config/db');
const { ACTIVITY_TYPES } = require('../../constants/taskStatus');

const prisma = getPrismaClient();

class PhasesService {
    /**
     * Create custom phase
     */
    async createPhase(phaseData, userId) {
        const { project_id, name, description, display_order } = phaseData;

        // Verify project exists
        const project = await prisma.project.findUnique({
            where: { project_id },
        });

        if (!project || project.is_deleted) {
            throw new Error('Project not found');
        }

        // Get next display order if not provided
        let order = display_order;
        if (order === undefined) {
            const lastPhase = await prisma.phase.findFirst({
                where: { project_id, is_deleted: false },
                orderBy: { display_order: 'desc' },
            });
            order = lastPhase ? lastPhase.display_order + 1 : 0;
        }

        const phase = await prisma.phase.create({
            data: {
                project_id,
                name,
                description,
                display_order: order,
            },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                user_id: userId,
                activity_type: ACTIVITY_TYPES.PHASE_CREATED,
                description: `Created phase: ${name} in project ${project.name}`,
                metadata: JSON.stringify({ phase_id: phase.phase_id, project_id }),
            },
        });

        return phase;
    }

    /**
     * Get phases by project
     */
    async getPhasesByProject(projectId) {
        const project = await prisma.project.findUnique({
            where: { project_id: parseInt(projectId) },
        });

        if (!project || project.is_deleted) {
            throw new Error('Project not found');
        }

        const phases = await prisma.phase.findMany({
            where: {
                project_id: parseInt(projectId),
                is_deleted: false,
            },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
            orderBy: { display_order: 'asc' },
        });

        return phases;
    }

    /**
     * Update phase
     */
    async updatePhase(phaseId, updateData, userId) {
        const phase = await prisma.phase.findUnique({
            where: { phase_id: parseInt(phaseId) },
            include: { project: true },
        });

        if (!phase || phase.is_deleted) {
            throw new Error('Phase not found');
        }

        const updatedPhase = await prisma.phase.update({
            where: { phase_id: parseInt(phaseId) },
            data: updateData,
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                user_id: userId,
                activity_type: ACTIVITY_TYPES.PHASE_UPDATED,
                description: `Updated phase: ${updatedPhase.name}`,
                metadata: JSON.stringify({ phase_id: updatedPhase.phase_id }),
            },
        });

        return updatedPhase;
    }

    /**
     * Delete phase (only if no tasks assigned)
     */
    async deletePhase(phaseId, userId) {
        const phase = await prisma.phase.findUnique({
            where: { phase_id: parseInt(phaseId) },
            include: {
                _count: {
                    select: {
                        tasks: true,
                    },
                },
            },
        });

        if (!phase || phase.is_deleted) {
            throw new Error('Phase not found');
        }

        if (phase._count.tasks > 0) {
            throw new Error('Cannot delete phase with assigned tasks');
        }

        await prisma.phase.update({
            where: { phase_id: parseInt(phaseId) },
            data: { is_deleted: true },
        });
    }

    /**
     * Reorder phases
     */
    async reorderPhases(phasesOrder, userId) {
        await prisma.$transaction(
            phasesOrder.map(({ phase_id, display_order }) =>
                prisma.phase.update({
                    where: { phase_id },
                    data: { display_order },
                })
            )
        );

        return { message: 'Phases reordered successfully' };
    }
}

module.exports = new PhasesService();
