# ApexPlanner Backend

Production-ready task management backend system built with Node.js, Express, Prisma, and MySQL.

## Features

- ✅ JWT Authentication with refresh tokens
- ✅ Role-based access control (Admin, Manager, Reviewer, Member)
- ✅ Project management with auto-generated default phases
- ✅ Task lifecycle management (8-stage workflow)
- ✅ 2-step review workflow
- ✅ Comprehensive analytics dashboard
- ✅ Activity logging and tracking
- ✅ Clean architecture with modular design

## 🎯 Frontend Integration

This backend is designed to work with the **apex-task-manager** frontend (Next.js).

**Important Documentation:**

- 📖 [Quick Start Guide](./QUICK_START.md) - Get running in 5 minutes
- 📚 [Integration Guide](./INTEGRATION_GUIDE.md) - Complete setup instructions
- ✅ [Integration Checklist](./INTEGRATION_CHECKLIST.md) - Verification steps
- 🐛 [Bug Fixes Applied](./BUGFIXES.md) - Issues fixed during integration
- 📋 [Integration Summary](./INTEGRATION_SUMMARY.md) - Overview of all changes

**Quick Setup:**

```bash
npm install
cp .env.example .env    # Update with your database credentials
npm run prisma:migrate
npm run dev             # Backend runs on port 5000
```

In another terminal:

```bash
cd ../apex-task-manager
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > .env.local
npm run dev             # Frontend runs on port 3000
```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: MySQL
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Logging**: Winston

## Project Structure

```
src/
├── app.js                 # Express app configuration
├── server.js              # Server entry point
├── routes/                # Route definitions
│   └── index.js
├── modules/               # Feature modules
│   ├── auth/
│   ├── users/
│   ├── projects/
│   ├── phases/
│   ├── tasks/
│   ├── submissions/
│   ├── reviews/
│   ├── dashboard/
│   └── activity/
├── middleware/            # Custom middleware
│   ├── auth.middleware.js
│   ├── role.middleware.js
│   ├── validate.middleware.js
│   └── error.middleware.js
├── utils/                 # Utility functions
│   ├── logger.js
│   ├── pagination.js
│   ├── response.js
│   └── date.js
├── config/                # Configuration
│   ├── db.js
│   └── env.js
└── constants/             # Constants
    ├── roles.js
    └── taskStatus.js
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:

   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your database credentials and JWT secrets

5. Generate Prisma client:

   ```bash
   npm run prisma:generate
   ```

6. Run database migrations:

   ```bash
   npm run prisma:migrate
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - Logout user

### User Endpoints

- `GET /users` - Get all users (Manager/Admin)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (Admin)
- `PATCH /users/:id/role` - Change user role (Admin)

### Project Endpoints

- `POST /projects` - Create project (Manager/Admin)
- `GET /projects` - Get all projects
- `GET /projects/:id` - Get project by ID
- `PUT /projects/:id` - Update project (Manager/Admin)
- `DELETE /projects/:id` - Delete project (Manager/Admin)

### Phase Endpoints

- `POST /phases` - Create phase (Manager/Admin)
- `GET /phases/project/:projectId` - Get phases by project
- `PUT /phases/:id` - Update phase (Manager/Admin)
- `DELETE /phases/:id` - Delete phase (Manager/Admin)
- `PATCH /phases/reorder` - Reorder phases (Manager/Admin)

### Task Endpoints

- `POST /tasks` - Create task (Manager/Admin)
- `GET /tasks` - Get all tasks
- `GET /tasks/:id` - Get task by ID
- `PUT /tasks/:id` - Update task
- `PATCH /tasks/:id/status` - Update task status
- `PATCH /tasks/:id/assign` - Assign task (Manager/Admin)
- `DELETE /tasks/:id` - Delete task (Manager/Admin)

### Submission Endpoints

- `POST /submissions` - Create submission
- `GET /submissions/task/:taskId` - Get submissions by task
- `GET /submissions/:id` - Get submission by ID
- `PUT /submissions/:id` - Update submission (resubmit)

### Review Endpoints

- `POST /reviews/approve` - Approve submission (Reviewer/Manager/Admin)
- `POST /reviews/reject` - Reject submission (Reviewer/Manager/Admin)
- `GET /reviews/submission/:submissionId` - Get reviews by submission
- `GET /reviews/pending` - Get pending reviews

### Dashboard Endpoints

- `GET /dashboard/analytics` - Get overall analytics
- `GET /dashboard/employee-productivity/:userId?` - Get employee productivity
- `GET /dashboard/project-stats/:projectId` - Get project statistics

### Activity Endpoints

- `GET /activity/user/:userId` - Get user activity
- `GET /activity/my-activity` - Get my activity

## Task Lifecycle

```
CREATED → ASSIGNED → IN_PROGRESS → SUBMITTED → UNDER_REVIEW
                                                     ↓
                                    REJECTED ←──────┘
                                       ↓
                                    ASSIGNED (loop back)

UNDER_REVIEW → VERIFIED → COMPLETED
```

## Default Phases

When a project is created, 5 default waterfall phases are automatically generated:

1. Requirement
2. Design
3. Development
4. Testing
5. Deployment

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed database
- `npm run prisma:reset` - Reset database

## License

ISC
