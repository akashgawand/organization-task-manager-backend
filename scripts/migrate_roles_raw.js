const { PrismaClient } = require('@prisma/client');
const { ROLES, ROLE_PERMISSIONS } = require('../src/constants/roles');

const prisma = new PrismaClient();

async function migrateRoles() {
    console.log("Starting RBAC Data Migration using Raw SQL...");
    try {
        for (const [roleKey, roleName] of Object.entries(ROLES)) {
            // Upsert Role
            await prisma.$executeRawUnsafe(`
                INSERT IGNORE INTO roles (name) 
                VALUES (?)
            `, roleName);

            // Get Role ID
            const roleRes = await prisma.$queryRawUnsafe(`SELECT id FROM roles WHERE name = ?`, roleName);
            const roleId = roleRes[0].id;
            console.log(`Role ${roleName} ID is ${roleId}`);

            const permissions = ROLE_PERMISSIONS[roleName] || [];
            for (const permName of permissions) {
                // Upsert Permission
                await prisma.$executeRawUnsafe(`
                    INSERT IGNORE INTO permissions (name) 
                    VALUES (?)
                `, permName);

                // Get Permission ID
                const permRes = await prisma.$queryRawUnsafe(`SELECT id FROM permissions WHERE name = ?`, permName);
                const permId = permRes[0].id;

                // Upsert RolePermission
                await prisma.$executeRawUnsafe(`
                    INSERT IGNORE INTO role_permissions (role_id, permission_id) 
                    VALUES (?, ?)
                `, roleId, permId);
            }
        }

        // Migrate Users
        const users = await prisma.$queryRawUnsafe(`SELECT user_id, email, role FROM users`);
        console.log(`Found ${users.length} users to migrate.`);

        for (const user of users) {
            const legacyRoleName = user.role;
            const roleRes = await prisma.$queryRawUnsafe(`SELECT id FROM roles WHERE name = ?`, legacyRoleName);
            if (roleRes.length > 0) {
                const roleId = roleRes[0].id;
                await prisma.$executeRawUnsafe(`
                    INSERT IGNORE INTO user_roles (user_id, role_id) 
                    VALUES (?, ?)
                 `, user.user_id, roleId);
                console.log(`Assigned role ${legacyRoleName} to user ${user.email}`);
            } else {
                console.warn(`Could not find a matching Role record for user ${user.email} with legacy role '${legacyRoleName}'`);
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
