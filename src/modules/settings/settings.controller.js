const { prisma } = require('../../config/db');
const { successResponse, errorResponse } = require('../../utils/response');
const { Prisma } = require('@prisma/client');

class SettingsController {
    async getSettings(req, res) {
        try {
            // Find the single settings row or create it if it doesn't exist
            let settings = await prisma.systemSettings.findFirst();

            if (!settings) {
                settings = await prisma.systemSettings.create({
                    data: {} // Uses default values defined in schema
                });
            }

            return successResponse(res, settings, 'Settings retrieved successfully');
        } catch (error) {
            console.error('Get Settings error:', error);
            return errorResponse(res, 'Failed to fetch settings', 500);
        }
    }

    async updateSettings(req, res) {
        try {
            const updateData = req.body;

            // Find existing
            let settings = await prisma.systemSettings.findFirst();

            if (!settings) {
                // Create if missing
                settings = await prisma.systemSettings.create({
                    data: updateData
                });
            } else {
                // Update the existing row
                settings = await prisma.systemSettings.update({
                    where: { id: settings.id },
                    data: updateData,
                });
            }

            return successResponse(res, settings, 'Settings updated successfully');
        } catch (error) {
            console.error('Update Settings Error:', error);

            if (error instanceof Prisma.PrismaClientValidationError) {
                return errorResponse(res, 'Invalid settings data provided', 400);
            }
            return errorResponse(res, 'Failed to update settings', 500);
        }
    }
}

module.exports = new SettingsController();
