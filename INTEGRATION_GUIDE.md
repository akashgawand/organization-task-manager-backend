# ApexPlanner Frontend-Backend Integration Guide

This guide provides complete setup instructions for running the ApexPlanner backend and integrating it with the apex-task-manager frontend.

## Prerequisites

- Node.js 16+ and npm/yarn
- MySQL 8.0+
- Git

## Backend Setup (ApexPlanner-backend)

### Step 1: Environment Configuration

Create a `.env` file in the backend root directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/apexplanner"

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-token-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS Configuration (set to your frontend URL)
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### Step 2: Database Setup

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database with sample data
npm run prisma:seed
```

### Step 3: Start Backend Server

```bash
# Development mode with hot reload
npm run dev

# Or production mode
npm start
```

The backend will run on `http://localhost:5000` by default.

## Frontend Setup (apex-task-manager)

### Step 1: Environment Configuration

Create a `.env.local` file in the frontend root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Frontend Server

```bash
npm run dev
```

The frontend will run on `http://localhost:3000` by default.

## API Integration Points

### Authentication Flow

1. **Login** (`POST /api/v1/auth/login`)
   - Request: `{ email: string, password: string }`
   - Response: `{ user: {...}, accessToken: string, refreshToken: string }`

2. **Token Refresh** (`POST /api/v1/auth/refresh-token`)
   - Request: `{ refresh_token: string }`
   - Response: `{ accessToken: string, user: {...} }`

3. **Register** (`POST /api/v1/auth/register`)
   - Request: `{ email: string, password: string, full_name: string, role?: string }`
   - Response: User object

### Key Endpoints

#### Tasks

- `GET /api/v1/tasks` - List all tasks (paginated)
- `POST /api/v1/tasks` - Create new task
- `GET /api/v1/tasks/:id` - Get task details
- `PUT /api/v1/tasks/:id` - Update task
- `PATCH /api/v1/tasks/:id/status` - Update task status
- `PATCH /api/v1/tasks/:id/assign` - Assign task to user
- `DELETE /api/v1/tasks/:id` - Delete task

#### Projects

- `GET /api/v1/projects` - List all projects (paginated)
- `POST /api/v1/projects` - Create new project
- `GET /api/v1/projects/:id` - Get project details
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

#### Teams

- `GET /api/v1/teams` - List all teams (paginated)
- `POST /api/v1/teams` - Create new team
- `GET /api/v1/teams/:id` - Get team details
- `PUT /api/v1/teams/:id` - Update team
- `DELETE /api/v1/teams/:id` - Delete team
- `POST /api/v1/teams/:id/members` - Add member to team
- `DELETE /api/v1/teams/:id/members/:user_id` - Remove member from team

#### Users

- `GET /api/v1/users` - List all users (paginated)
- `GET /api/v1/users/:id` - Get user details

#### Dashboard

- `GET /api/v1/dashboard/analytics` - Get analytics
- `GET /api/v1/dashboard/employee-productivity/:userId?` - Get productivity data
- `GET /api/v1/dashboard/project-stats/:projectId` - Get project statistics

## Response Format

All API responses follow a standard format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Data retrieved",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": {} // Optional detailed errors
}
```

## Common Issues & Solutions

### CORS Errors

- **Issue**: Frontend gets CORS errors when calling backend
- **Solution**: Update `CORS_ORIGIN` in backend `.env` to match your frontend URL
  ```env
  CORS_ORIGIN=http://localhost:3000
  ```

### 401 Unauthorized

- **Issue**: API returns 401 Unauthorized even with valid token
- **Solution**:
  1. Ensure authorization header format: `Authorization: Bearer <token>`
  2. Verify JWT secrets in `.env` are set correctly
  3. Check if token has expired

### Database Connection Errors

- **Issue**: Cannot connect to MySQL database
- **Solution**:
  1. Verify MySQL is running
  2. Check DATABASE_URL format: `mysql://username:password@host:port/dbname`
  3. Verify user has database creation permissions

### Token Refresh Not Working

- **Issue**: Frontend fails to refresh expired tokens
- **Solution**:
  1. Verify backend has `/auth/refresh-token` endpoint
  2. Check that `refreshToken` is stored in localStorage
  3. Ensure JWT_REFRESH_SECRET is configured in backend

## Frontend API Service Architecture

The frontend uses a centralized API service (`app/services/api.ts`) that:

1. Handles automatic token injection from localStorage
2. Manages token refresh on 401 responses
3. Normalizes response format (extracts `data` object)
4. Provides consistent error handling

Example usage:

```typescript
import { api } from "@/services/api";

// GET request
const tasks = await api.get("/tasks", { page: 1 });

// POST request
const newTask = await api.post("/tasks", { title: "...", ... });

// PATCH request
const updated = await api.patch("/tasks/123", { status: "DONE" });

// DELETE request
await api.delete("/tasks/123");
```

## Database Schema

The application uses Prisma ORM with MySQL. Key models:

- **User**: System users with roles (SUPER_ADMIN, ADMIN, TEAM_LEAD, SENIOR_DEVELOPER, EMPLOYEE)
- **Team**: Groups of users led by a team lead
- **Project**: Work items created by managers/admins
- **Phase**: Project phases (Requirements, Design, Development, Testing, Deployment)
- **Task**: Individual work items assigned to team members
- **Submission**: Task submissions for review
- **Review**: Approvals/rejections of submissions

## Authentication & Authorization

### User Roles

1. **SUPER_ADMIN**: Full system access
2. **ADMIN**: Administrative access
3. **TEAM_LEAD**: Manages team and tasks
4. **SENIOR_DEVELOPER**: Reviews and verifies tasks
5. **EMPLOYEE**: Can view and work on assigned tasks

### Token Management

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Frontend automatically refreshes access tokens when needed
- Refresh tokens are stored in database for validation

## Testing the Integration

### 1. Test Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123"}'
```

### 2. Test Authenticated Request

```bash
curl -X GET http://localhost:5000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Test Token Refresh

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

## Production Deployment Considerations

1. **Environment Variables**: Set proper values for production (strong JWT secrets, correct CORS origins)
2. **Database**: Use managed MySQL service (AWS RDS, Azure Database, etc.)
3. **Frontend Build**: Run `npm run build` before deployment
4. **SSL/HTTPS**: Enable SSL certificates for secure token transmission
5. **API Rate Limiting**: Consider implementing rate limiting
6. **Monitoring**: Set up error tracking and logging
7. **Backups**: Regular database backups

## Support & Troubleshooting

- Check backend logs: `npm run dev` shows detailed logs
- Check frontend console: Open DevTools (F12) for client-side errors
- Database queries: Use `npm run prisma:studio` to inspect database
- API testing: Use Postman/Insomnia with the provided collection

## Next Steps

1. Configure environment variables for both backend and frontend
2. Set up the database and run migrations
3. Start both servers
4. Test the login flow
5. Verify API calls from frontend
6. Deploy to production when ready
