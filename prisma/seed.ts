import { PrismaClient, UserRole, TeamStatus, ProjectStatus, TaskPriority, TaskStatus } from '@prisma/client';

const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    TEAM_LEAD: 'TEAM_LEAD',
    SENIOR_DEVELOPER: 'SENIOR_DEVELOPER',
    EMPLOYEE: 'EMPLOYEE',
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
    [ROLES.SUPER_ADMIN]: [
        'user:create', 'user:read', 'user:update', 'user:delete', 'user:change-role',
        'project:create', 'project:read', 'project:update', 'project:delete',
        'phase:create', 'phase:read', 'phase:update', 'phase:delete',
        'task:create', 'task:read', 'task:update', 'task:delete', 'task:assign',
        'team:create', 'team:read', 'team:update', 'team:delete',
        'tag:create', 'tag:read', 'tag:update', 'tag:delete',
        'submission:create', 'submission:read',
        'review:create', 'review:read',
        'dashboard:read', 'activity:read',
    ],
    [ROLES.ADMIN]: [
        'user:read',
        'project:create', 'project:read', 'project:update', 'project:delete',
        'phase:create', 'phase:read', 'phase:update', 'phase:delete',
        'task:create', 'task:read', 'task:update', 'task:delete', 'task:assign',
        'team:create', 'team:read', 'team:update', 'team:delete',
        'tag:create', 'tag:read', 'tag:update', 'tag:delete',
        'submission:read',
        'review:create', 'review:read',
        'dashboard:read', 'activity:read',
    ],
    [ROLES.TEAM_LEAD]: [
        'user:read', 'project:read', 'phase:read',
        'task:create', 'task:read', 'task:update', 'task:assign',
        'team:read', 'tag:read', 'submission:read',
        'review:create', 'review:read',
        'dashboard:read', 'activity:read',
    ],
    [ROLES.SENIOR_DEVELOPER]: [
        'user:read', 'project:read', 'phase:read',
        'task:create', 'task:read', 'task:update', 'task:assign',
        'team:read', 'tag:read', 'submission:read',
        'review:create', 'review:read',
        'dashboard:read', 'activity:read',
    ],
    [ROLES.EMPLOYEE]: [
        'user:read', 'project:read', 'phase:read',
        'task:read', 'task:update', 'team:read', 'tag:read',
        'submission:create', 'submission:read',
        'activity:read',
    ],
};

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Clean up existing data (Order matters due to foreign keys)
  await prisma.activityLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.subTask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.project.deleteMany();
  await prisma.team.deleteMany();
  
  // RBAC Clean up
  await prisma.userRoleAssignment.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  
  await prisma.tag.deleteMany();

  console.log('Deleted existing data.');

  // 2. Seed Roles and Permissions
  console.log('Seeding Roles and Permissions...');
  const roleMap: Record<string, any> = {};

  for (const [roleKey, roleName] of Object.entries(ROLES)) {
    const roleStr = roleName as string;
    // Create Role
    const role = await prisma.role.create({
      data: { name: roleStr }
    });
    roleMap[roleStr] = role;

    // Create Permissions and link them
    const permissions = ROLE_PERMISSIONS[roleStr] || [];
    for (const permName of permissions) {
      // Upsert to avoid duplicates if multiple roles share a permission
      const permission = await prisma.permission.upsert({
        where: { name: permName },
        update: {},
        create: { name: permName }
      });

      await prisma.rolePermission.create({
        data: {
          role_id: role.id,
          permission_id: permission.id
        }
      });
    }
  }
  console.log('Roles and Permissions seeded.');


  // 3. Create Users
  const usersData = [
    {
      email: 'sarah.johnson@company.com',
      password: '$2a$12$KkQeZq5K/x5QYkMZ8rMjB.mF5qA7lB2B4l2zLpZ4N6Y1eTqN4y/hW', // hashed 'password123' just as placeholder
      full_name: 'Sarah Johnson',
      role: UserRole.SUPER_ADMIN,
      avatar: 'SJ',
      department: 'Executive',
      position: 'CEO',
      skills: ['Leadership', 'Strategic Planning', 'Management'],
    },
    {
      email: 'michael.chen@company.com',
      password: '$2a$12$KkQeZq5K/x5QYkMZ8rMjB.mF5qA7lB2B4l2zLpZ4N6Y1eTqN4y/hW',
      full_name: 'Michael Chen',
      role: UserRole.ADMIN,
      avatar: 'MC',
      department: 'Engineering',
      position: 'Engineering Manager',
      skills: ['System Design', 'Team Management', 'React', 'Node.js'],
    },
    {
      email: 'emily.rodriguez@company.com',
      password: '$2a$12$KkQeZq5K/x5QYkMZ8rMjB.mF5qA7lB2B4l2zLpZ4N6Y1eTqN4y/hW',
      full_name: 'Emily Rodriguez',
      role: UserRole.TEAM_LEAD,
      avatar: 'ER',
      department: 'Engineering',
      position: 'Senior Developer',
      skills: ['React', 'TypeScript', 'Frontend Architecture'],
    },
    {
      email: 'david.kim@company.com',
      password: '$2a$12$KkQeZq5K/x5QYkMZ8rMjB.mF5qA7lB2B4l2zLpZ4N6Y1eTqN4y/hW',
      full_name: 'David Kim',
      role: UserRole.EMPLOYEE,
      avatar: 'DK',
      department: 'Engineering',
      position: 'Frontend Developer',
      skills: ['UI/UX', 'CSS', 'React'],
    },
    {
      email: 'lisa.martinez@company.com',
      password: '$2a$12$KkQeZq5K/x5QYkMZ8rMjB.mF5qA7lB2B4l2zLpZ4N6Y1eTqN4y/hW',
      full_name: 'Lisa Martinez',
      role: UserRole.EMPLOYEE,
      avatar: 'LM',
      department: 'Engineering',
      position: 'Backend Developer',
      skills: ['Node.js', 'PostgreSQL', 'AWS'],
    },
    {
      email: 'james.wilson@company.com',
      password: '$2a$12$KkQeZq5K/x5QYkMZ8rMjB.mF5qA7lB2B4l2zLpZ4N6Y1eTqN4y/hW',
      full_name: 'James Wilson',
      role: UserRole.ADMIN,
      avatar: 'JW',
      department: 'Product',
      position: 'Product Manager',
    },
    {
      email: 'robert.taylor@company.com',
      password: '$2a$12$KkQeZq5K/x5QYkMZ8rMjB.mF5qA7lB2B4l2zLpZ4N6Y1eTqN4y/hW',
      full_name: 'Robert Taylor',
      role: UserRole.ADMIN,
      avatar: 'RT',
      department: 'Product',
      position: 'Product Director',
      skills: ['Product Strategy', 'Roadmapping', 'Agile'],
    },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.create({ data: u });
    createdUsers.push(user);
    
    // Assign role in the new DB table
    if (roleMap[user.role]) {
       await prisma.userRoleAssignment.create({
         data: {
           user_id: user.user_id,
           role_id: roleMap[user.role].id
         }
       });
    }
  }
  
  // Map email to user for easy access
  const userMap = createdUsers.reduce((acc, user) => {
    acc[user.email] = user;
    return acc;
  }, {} as Record<string, typeof createdUsers[0]>);

  console.log(`Created ${createdUsers.length} users and assigned DB roles.`);

  // 4. Create Teams
  const teamsData = [
    {
      name: 'Engineering Team Alpha',
      description: 'Core platform development team',
      lead_email: 'emily.rodriguez@company.com',
      member_emails: ['emily.rodriguez@company.com', 'david.kim@company.com', 'lisa.martinez@company.com'],
      status: TeamStatus.ACTIVE,
      avatar: 'bg-blue-100 text-blue-600',
    },
    {
      name: 'Product Team',
      description: 'Product strategy and design',
      lead_email: 'james.wilson@company.com',
      member_emails: ['james.wilson@company.com'],
      status: TeamStatus.ACTIVE,
      avatar: 'bg-purple-100 text-purple-600',
    },
    {
      name: 'QA Team',
      description: 'Quality Assurance and Testing',
      lead_email: 'james.wilson@company.com',
      member_emails: ['david.kim@company.com', 'lisa.martinez@company.com'],
      status: TeamStatus.IDLE,
      avatar: 'bg-green-100 text-green-600',
    },
  ];

  const createdTeams = [];
  for (const t of teamsData) {
    const team = await prisma.team.create({
      data: {
        name: t.name,
        description: t.description,
        status: t.status,
        avatar: t.avatar,
        lead: { connect: { user_id: userMap[t.lead_email].user_id } },
        members: {
          connect: t.member_emails.map(email => ({ user_id: userMap[email].user_id })),
        },
      },
    });
    createdTeams.push(team);
  }
  
  const teamMap = createdTeams.reduce((acc, team) => {
    acc[team.name] = team;
    return acc;
  }, {} as Record<string, typeof createdTeams[0]>);

  console.log(`Created ${createdTeams.length} teams.`);

  // 5. Create Tags
  const tagsData = [
    { name: 'infrastructure', color: '#3B82F6' },
    { name: 'backend', color: '#10B981' },
    { name: 'migration', color: '#F59E0B' },
    { name: 'mobile', color: '#8B5CF6' },
    { name: 'ios', color: '#000000' },
    { name: 'android', color: '#3DDC84' },
    { name: 'planning', color: '#EF4444' },
    { name: 'strategy', color: '#6366F1' },
  ];

  const createdTags = [];
  for (const t of tagsData) {
    const tag = await prisma.tag.create({ data: t });
    createdTags.push(tag);
  }
  
   const tagMap = createdTags.reduce((acc, tag) => {
    acc[tag.name] = tag;
    return acc;
  }, {} as Record<string, typeof createdTags[0]>);

  console.log(`Created ${createdTags.length} tags.`);

  // 6. Create Projects
  const projectsData = [
    {
      name: 'Platform Modernization',
      description: 'Upgrade core infrastructure and migrate to microservices architecture',
      status: ProjectStatus.ACTIVE,
      priority: TaskPriority.HIGH,
      start_date: new Date('2026-02-01'),
      end_date: new Date('2026-06-30'),
      progress: 65,
      created_by_email: 'michael.chen@company.com',
      team_name: 'Engineering Team Alpha',
      tags: ['infrastructure', 'backend', 'migration'],
      phases: [
        { name: 'Planning', order: 1 },
        { name: 'Design', order: 2 },
        { name: 'Development', order: 3 },
        { name: 'Testing', order: 4 },
        { name: 'Deployment', order: 5 },
      ],
    },
    {
      name: 'Mobile App Development',
      description: 'Build native iOS and Android applications',
      status: ProjectStatus.ACTIVE,
      priority: TaskPriority.MEDIUM,
      start_date: new Date('2026-03-01'),
      end_date: new Date('2026-08-31'),
      progress: 35,
      created_by_email: 'michael.chen@company.com',
      team_name: 'Engineering Team Alpha',
      tags: ['mobile', 'ios', 'android'],
      phases: [
        { name: 'Planning', order: 1 },
        { name: 'Design', order: 2 },
        { name: 'Development', order: 3 },
      ],
    },
    {
      name: 'Q2 Product Roadmap',
      description: 'Plan and execute Q2 2024 product initiatives',
      status: ProjectStatus.PLANNING,
      priority: TaskPriority.HIGH,
      start_date: new Date('2026-04-01'),
      progress: 10,
      created_by_email: 'james.wilson@company.com',
      team_name: 'Product Team',
      tags: ['planning', 'strategy'],
      phases: [
        { name: 'Research', order: 1 },
        { name: 'Strategy', order: 2 },
      ],
    },
  ];

  const createdProjects = [];
  for (const p of projectsData) {
    const project = await prisma.project.create({
      data: {
        name: p.name,
        description: p.description,
        status: p.status,
        priority: p.priority,
        start_date: p.start_date,
        end_date: p.end_date,
        progress: p.progress,
        creator: { connect: { user_id: userMap[p.created_by_email].user_id } },
        team: { connect: { team_id: teamMap[p.team_name].team_id } },
        tags: {
            connect: p.tags.map(tagName => ({ tag_id: tagMap[tagName].tag_id }))
        },
        phases: {
          create: p.phases.map(ph => ({
            name: ph.name,
            display_order: ph.order,
            start_date: p.start_date,
            end_date: p.end_date,
            status: ProjectStatus.PLANNING,
          })),
        },
      },
      include: { phases: true },
    });
    createdProjects.push(project);
  }
  
  const projectMap = createdProjects.reduce((acc, proj) => {
    acc[proj.name] = proj;
    return acc;
  }, {} as Record<string, typeof createdProjects[0]>);

  console.log(`Created ${createdProjects.length} projects.`);

  // 7. Create Tasks
  const p1Phases = projectMap['Platform Modernization'].phases;
  
  const tasksData = [
    {
      title: 'Design API Gateway Architecture',
      description: 'Create detailed architecture diagrams and documentation',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      project_name: 'Platform Modernization',
      phase_id: p1Phases.find(p => p.name === 'Design')?.phase_id,
      creator_email: 'michael.chen@company.com',
      assignee_emails: ['emily.rodriguez@company.com', 'david.kim@company.com'],
      start_date: new Date('2026-02-10'),
      deadline: new Date('2026-02-20'),
      estimated_hours: 20,
      actual_hours: 12,
      tags: ['infrastructure', 'backend'],
      subtasks: [
        { title: 'Research existing solutions', is_completed: true },
        { title: 'Create architecture diagram', is_completed: true },
        { title: 'Document API specifications', is_completed: false },
        { title: 'Review with team', is_completed: false },
      ],
    },
    {
      title: 'Implement User Authentication Service',
      description: 'Build microservice for user authentication',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      project_name: 'Platform Modernization',
      phase_id: p1Phases.find(p => p.name === 'Development')?.phase_id,
      creator_email: 'michael.chen@company.com',
      assignee_emails: ['lisa.martinez@company.com'],
      deadline: new Date('2026-02-25'),
      estimated_hours: 40,
      tags: ['backend'],
      subtasks: [
        { title: 'Setup service scaffolding', is_completed: false },
        { title: 'Implement OAuth2 flow', is_completed: false },
        { title: 'Add JWT token generation', is_completed: false },
      ],
    },
  ];

  for (const t of tasksData) {
    if (!t.phase_id) continue;
    
    await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        start_date: t.start_date,
        deadline: t.deadline,
        estimated_hours: t.estimated_hours,
        actual_hours: t.actual_hours,
        project: { connect: { project_id: projectMap[t.project_name].project_id } },
        phase: { connect: { phase_id: t.phase_id } },
        creator: { connect: { user_id: userMap[t.creator_email].user_id } },
        assignees: {
            connect: t.assignee_emails.map(email => ({ user_id: userMap[email].user_id }))
        },
        tags: {
             connect: t.tags.map(tagName => ({ tag_id: tagMap[tagName].tag_id }))
        },
        subtasks: {
          create: t.subtasks.map(st => ({
            title: st.title,
            is_completed: st.is_completed,
          })),
        },
        comments: {
          create: [
            {
              content: "Initial requirements seem clear.",
              user_id: userMap[t.creator_email].user_id,
            },
            {
              content: "I will start working on this tomorrow.",
              user_id: userMap[t.assignee_emails[0]].user_id,
            }
          ]
        }
      },
    });
  }

  console.log(`Created tasks.`);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
