const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // -------------------------------------------------------
    // 1. CLEAN UP (respecting foreign key order)
    // -------------------------------------------------------
    await prisma.activityLog.deleteMany();
    await prisma.review.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.subTask.deleteMany();
    await prisma.task.deleteMany();
    await prisma.phase.deleteMany();
    await prisma.project.deleteMany();
    await prisma.team.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.notificationPreference.deleteMany();
    // RBAC clean up – order matters (junction tables first)
    await prisma.userRoleAssignment.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.tag.deleteMany();
    console.log('Cleaned up existing data.');

    // -------------------------------------------------------
    // 2. SEED PERMISSIONS (upsert by id)
    // -------------------------------------------------------
    const permissions = [
        { id: 1, name: 'user:create' },
        { id: 2, name: 'user:read' },
        { id: 3, name: 'user:update' },
        { id: 4, name: 'user:delete' },
        { id: 5, name: 'user:change-role' },
        { id: 6, name: 'project:create' },
        { id: 7, name: 'project:read' },
        { id: 8, name: 'project:update' },
        { id: 9, name: 'project:delete' },
        { id: 10, name: 'phase:create' },
        { id: 11, name: 'phase:read' },
        { id: 12, name: 'phase:update' },
        { id: 13, name: 'phase:delete' },
        { id: 14, name: 'task:create' },
        { id: 15, name: 'task:read' },
        { id: 16, name: 'task:update' },
        { id: 17, name: 'task:delete' },
        { id: 18, name: 'task:assign' },
        { id: 19, name: 'team:create' },
        { id: 20, name: 'team:read' },
        { id: 21, name: 'team:update' },
        { id: 22, name: 'team:delete' },
        { id: 23, name: 'tag:create' },
        { id: 24, name: 'tag:read' },
        { id: 25, name: 'tag:update' },
        { id: 26, name: 'tag:delete' },
        { id: 27, name: 'submission:create' },
        { id: 28, name: 'submission:read' },
        { id: 29, name: 'review:create' },
        { id: 30, name: 'review:read' },
        { id: 31, name: 'dashboard:read' },
        { id: 32, name: 'activity:read' },
    ];

    for (const p of permissions) {
        await prisma.permission.upsert({
            where: { id: p.id },
            update: { name: p.name },
            create: { id: p.id, name: p.name },
        });
    }
    console.log(`Seeded ${permissions.length} permissions.`);

    // -------------------------------------------------------
    // 3. SEED ROLES (upsert by id)
    // -------------------------------------------------------
    const roles = [
        { id: 1, name: 'SUPER_ADMIN' },
        { id: 2, name: 'ADMIN' },
        { id: 3, name: 'TEAM_LEAD' },
        { id: 4, name: 'SENIOR_DEVELOPER' },
        { id: 5, name: 'EMPLOYEE' },
    ];

    for (const r of roles) {
        await prisma.role.upsert({
            where: { id: r.id },
            update: { name: r.name },
            create: { id: r.id, name: r.name },
        });
    }
    console.log(`Seeded ${roles.length} roles.`);

    // -------------------------------------------------------
    // 4. SEED ROLE → PERMISSION MAPPINGS
    // -------------------------------------------------------
    const SUPER_ADMIN_PERMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
    const ADMIN_PERMS = [2, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32];
    const TEAM_LEAD_PERMS = [2, 7, 11, 14, 15, 16, 18, 20, 24, 28, 29, 30, 31, 32];
    const SENIOR_DEV_PERMS = [2, 7, 11, 14, 15, 16, 18, 20, 24, 28, 29, 30, 31, 32];
    const EMPLOYEE_PERMS = [2, 7, 11, 15, 16, 20, 24, 27, 28, 32];

    const rolePermMappings = [
        ...SUPER_ADMIN_PERMS.map(pid => ({ role_id: 1, permission_id: pid })),
        ...ADMIN_PERMS.map(pid => ({ role_id: 2, permission_id: pid })),
        ...TEAM_LEAD_PERMS.map(pid => ({ role_id: 3, permission_id: pid })),
        ...SENIOR_DEV_PERMS.map(pid => ({ role_id: 4, permission_id: pid })),
        ...EMPLOYEE_PERMS.map(pid => ({ role_id: 5, permission_id: pid })),
    ];

    for (const rp of rolePermMappings) {
        await prisma.rolePermission.upsert({
            where: {
                role_id_permission_id: {
                    role_id: rp.role_id,
                    permission_id: rp.permission_id,
                },
            },
            update: {},
            create: { role_id: rp.role_id, permission_id: rp.permission_id },
        });
    }
    console.log(`Seeded role-permission mappings.`);

    // -------------------------------------------------------
    // 5. SEED USERS (upsert by email – your real users)
    // -------------------------------------------------------
    const SHARED_HASH = '$2a$12$qDckY8zRRrtPdZhpK15vUuiLxr83YH4qB.v7ZKGIQAiDsV9BvoLsO'; // password123

    const users = [
        {
            user_id: 8,
            email: 'sahil@apexquants.com',
            password: SHARED_HASH,
            full_name: 'Sahil Shaikh',
            role: 'SUPER_ADMIN',
            avatar: 'SJ',
            department: 'Executive',
            position: 'CEO',
            skills: ['Leadership', 'Strategic Planning', 'Management'],
            fcm_tokens: ['dqdkNg81VGYF-rIyIvfL2O:APA91bEwvNT6zk8Zm8Fi6VkTpvDHjeZa2r07y60g6Qynuo_P4qyeNDhf7QSxjQkiIGu9wyN2h0PNw9e0zROvg1s-OApeBaTRE_AXPbCsh5_pGRFIzjOQU9g'],
        },
        {
            user_id: 9,
            email: 'faizan@apexquants.com',
            password: SHARED_HASH,
            full_name: 'Faizan Shaikh',
            role: 'ADMIN',
            avatar: 'MC',
            department: 'Engineering',
            position: 'Engineering Manager',
            skills: ['System Design', 'Team Management', 'React', 'Node.js'],
            fcm_tokens: null,
        },
        {
            user_id: 10,
            email: 'deepak@apexquants.com',
            password: SHARED_HASH,
            full_name: 'Deepak Chauhan',
            role: 'TEAM_LEAD',
            avatar: 'ER',
            department: 'Engineering',
            position: 'Senior Developer',
            skills: ['React', 'TypeScript', 'Frontend Architecture'],
            fcm_tokens: ['doEm1-BG_S-flPAoaJJGFM:APA91bHC_l8_8JhGW6PA85omJIUMsK2nS9mv6Ne_I0QJhJ2gq1q51MHS2J8q8xv0P4XepnpFmFtfKNrDcngY-oXDSuoNcBwbpcQax4VRjFGsQdO2Nyy-gm8'],
        },
        {
            user_id: 11,
            email: 'naeem@apexquants.com',
            password: SHARED_HASH,
            full_name: 'Nadeem Ashahar',
            role: 'EMPLOYEE',
            avatar: 'DK',
            department: 'Engineering',
            position: 'Frontend Developer',
            skills: ['UI/UX', 'CSS', 'React'],
            fcm_tokens: ['cQ_PbUt0ksraDvaKAeYGaR:APA91bHr1qHYUeR-Tc_hGq1gzn3EOmqsg4SA0oO_PDUS9HIO4WeuYRpjxOPjKc18w57SHqT6dLuZx7uDP5fxvauHuduAtt3o4lNNN8-qPwdo3OXT5I6CXg4'],
        },
        {
            user_id: 12,
            email: 'akash@apexquants.com',
            password: SHARED_HASH,
            full_name: 'Akash',
            role: 'EMPLOYEE',
            avatar: 'AK',
            department: null,
            position: null,
            skills: null,
            fcm_tokens: null,
        },
        {
            user_id: 19,
            email: 'priyanshu@apexquant.com',
            password: '$2a$12$CSMDfw/xX.T4xHlO/pHYGe0RAdGDjowXvz2TcKeo9KDKStxS62Wqm',
            full_name: 'Priyanshu Singh',
            role: 'SENIOR_DEVELOPER',
            avatar: 'PR',
            department: null,
            position: null,
            skills: null,
            fcm_tokens: null,
        },
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                full_name: u.full_name,
                role: u.role,
                avatar: u.avatar,
                department: u.department,
                position: u.position,
                skills: u.skills,
                fcm_tokens: u.fcm_tokens,
            },
            create: {
                user_id: u.user_id,
                email: u.email,
                password: u.password,
                full_name: u.full_name,
                role: u.role,
                avatar: u.avatar,
                department: u.department,
                position: u.position,
                skills: u.skills,
                fcm_tokens: u.fcm_tokens,
                is_active: true,
                is_deleted: false,
            },
        });
    }
    console.log(`Seeded ${users.length} users.`);

    // -------------------------------------------------------
    // 6. SEED USER → ROLE ASSIGNMENTS (upsert by composite key)
    // -------------------------------------------------------
    const userRolesData = [
        { user_id: 8, role_id: 1 }, // sahil      → SUPER_ADMIN
        { user_id: 9, role_id: 2 }, // faizan     → ADMIN
        { user_id: 10, role_id: 3 }, // deepak     → TEAM_LEAD
        { user_id: 11, role_id: 5 }, // naeem      → EMPLOYEE
        { user_id: 12, role_id: 5 }, // akash      → EMPLOYEE
        { user_id: 19, role_id: 4 }, // priyanshu  → SENIOR_DEVELOPER
    ];

    for (const ur of userRolesData) {
        await prisma.userRoleAssignment.upsert({
            where: {
                user_id_role_id: {
                    user_id: ur.user_id,
                    role_id: ur.role_id,
                },
            },
            update: {},
            create: { user_id: ur.user_id, role_id: ur.role_id },
        });
    }
    console.log(`Seeded user-role assignments.`);

    console.log('Seeding finished successfully!');
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
