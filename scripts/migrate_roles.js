const { PrismaClient } = require('@prisma/client');
const { ROLES, ROLE_PERMISSIONS } = require('../src/constants/roles');

const prisma = new PrismaClient();

async function migrateRoles() {
    console.log("Starting RBAC Data Migration...");

    try {
        // 1. Sync Roles and Permissions from constant
        for (const [roleKey, roleName] of Object.entries(ROLES)) {
            // Upsert Role
            const role = await prisma.role.upsert({
                where: { name: roleName },
                update: {},
                create: { name: roleName }
            });

            console.log(`Synced Role: ${roleName}`);

            // Upsert associated permissions
            const permissions = ROLE_PERMISSIONS[roleName] || [];

            for (const permName of permissions) {
                const permission = await prisma.permission.upsert({
                    where: { name: permName },
                    update: {},
                    create: { name: permName }
                });

                // Link role and permission
                await prisma.rolePermission.upsert({
                    where: {
                        role_id_permission_id: {
                            role_id: role.id,
                            permission_id: permission.id
                        }
                    },
                    update: {},
                    create: {
                        role_id: role.id,
                        permission_id: permission.id
                    }
                });
            }
            console.log(`Synced Permissions for Role: ${roleName}`);
        }

        // 2. Migrate Users
        const users = await prisma.user.findMany();
        console.log(`Found ${users.length} users to migrate.`);

        for (const user of users) {
            // user.role still exists as the enum string
            const legacyRoleName = user.role;

            // Find matching Role record
            const roleRecord = await prisma.role.findUnique({
                where: { name: legacyRoleName }
            });

            if (roleRecord) {
                await prisma.userRoleAssignment.upsert({
                    where: {
                        user_id_role_id: {
                            user_id: user.user_id,
                            role_id: roleRecord.id
                        }
                    },
                    update: {},
                    create: {
                        user_id: user.user_id,
                        role_id: roleRecord.id
                    }
                });
                console.log(`Assigned role ${legacyRoleName} to user ${user.email}`);
            } else {
                console.warn(`Could not find a matching Role record for user ${user.email} with role '${legacyRoleName}'`);
            }
        }

        console.log("Migration Complete!");

    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

migrateRoles();
