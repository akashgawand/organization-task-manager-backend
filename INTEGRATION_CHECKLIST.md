# Frontend-Backend Integration Checklist

Use this checklist to ensure proper integration between the apex-task-manager frontend and ApexPlanner-backend.

## ✅ Environment Setup

- [ ] Backend `.env` file created with all required variables
- [ ] Frontend `.env.local` file created with `NEXT_PUBLIC_API_URL`
- [ ] MySQL database created and accessible
- [ ] Backend JWT secrets configured (not using defaults)
- [ ] CORS_ORIGIN set to frontend URL in backend

## ✅ Database Setup

- [ ] Prisma Client generated (`npm run prisma:generate` in backend)
- [ ] Database migrations run (`npm run prisma:migrate` in backend)
- [ ] Database schema verified (tables exist: users, tasks, projects, etc.)
- [ ] (Optional) Seed data loaded (`npm run prisma:seed` in backend)

## ✅ Dependencies

- [ ] Backend dependencies installed (`npm install` in backend)
- [ ] Frontend dependencies installed (`npm install` in frontend)
- [ ] No dependency conflicts or warnings

## ✅ API Services Integration

### Backend API Routes

- [ ] `/auth` routes validated
- [ ] `/tasks` routes validated
- [ ] `/projects` routes validated
- [ ] `/teams` routes validated
- [ ] `/users` routes validated
- [ ] `/dashboard` routes validated

### Frontend API Services

- [ ] `authServices.ts` correctly maps responses
- [ ] `taskServices.ts` handles field name mapping (snake_case to camelCase)
- [ ] `projectServices.ts` formats responses correctly
- [ ] `teamServices.ts` handles pagination
- [ ] `userServices.ts` role conversion working
- [ ] `dashboardServices.ts` using correct endpoints

## ✅ Authentication Flow

- [ ] User can register with valid credentials
- [ ] User can login and receives tokens
- [ ] Access token stored in localStorage
- [ ] Refresh token stored in localStorage
- [ ] Authorization header format: `Bearer {token}`
- [ ] Token refresh works when access token expires
- [ ] Logout clears tokens and localStorage
- [ ] Expired token triggers redirect to login

## ✅ API Response Handling

- [ ] API responses unwrap `.data` correctly
- [ ] Pagination responses include `pagination` metadata
- [ ] Error responses show user-friendly messages
- [ ] 404 errors handled gracefully
- [ ] 401 errors trigger token refresh or login redirect
- [ ] Network timeouts handled with retry logic

## ✅ Common Operations

### Tasks

- [ ] Can fetch all tasks with pagination
- [ ] Can create new task
- [ ] Can update task details
- [ ] Can update task status
- [ ] Can assign/reassign task
- [ ] Can delete task
- [ ] Task status transitions valid (TODO → IN_PROGRESS → REVIEW → DONE)
- [ ] Priority field correctly mapped (lowercase)

### Projects

- [ ] Can fetch all projects
- [ ] Can create project (auto-generates phases)
- [ ] Can update project
- [ ] Can delete project
- [ ] Project fields mapped correctly (camelCase)

### Teams

- [ ] Can fetch all teams
- [ ] Can create team
- [ ] Can add members to team
- [ ] Can remove members from team
- [ ] Can delete team (admin only)

### Users

- [ ] Can fetch user list
- [ ] Can fetch individual user
- [ ] Role correctly converted to lowercase

### Dashboard

- [ ] Analytics endpoint returns data
- [ ] Project stats endpoint returns correct data
- [ ] Employee productivity endpoint works with/without userId
- [ ] Dashboard data formats correctly for charts

## ✅ Error Handling

- [ ] Invalid credentials show error message
- [ ] Network errors handled gracefully
- [ ] API errors show in console
- [ ] Non-200 responses caught as errors
- [ ] 403 Forbidden handled (permission errors)
- [ ] 500 errors show generic message to user

## ✅ Frontend Features

- [ ] Login page functional and submits to backend
- [ ] Dashboard loads without errors
- [ ] Task list displays correctly
- [ ] Can create new task from UI
- [ ] Task status updates reflect on server
- [ ] Project list displays
- [ ] Team management works
- [ ] User profile displays correct info

## ✅ Performance & Security

- [ ] No sensitive data logged to console
- [ ] Tokens not exposed in URLs
- [ ] CORS properly configured
- [ ] Authentication required for protected routes
- [ ] Role-based access control working (manager/admin only operations)
- [ ] Rate limiting considered for production

## ✅ Deployment Preparation

- [ ] Environment variables documented
- [ ] No hardcoded API URLs in frontend code
- [ ] Backend ready for production (error handling, logging)
- [ ] Database backups configured
- [ ] HTTPS required for production
- [ ] JWT secrets updated for production

## ✅ Testing

- [ ] Manual login test completed
- [ ] API endpoints tested with Postman/Insomnia
- [ ] Frontend console no errors
- [ ] Backend logs no errors
- [ ] Database migrations applied successfully
- [ ] Token refresh tested

## Notes Section

Use this section to track any issues or special configurations:

```
Issue: [describe]
Solution: [describe]

Issue: [describe]
Solution: [describe]
```

## Quick Start Command Reference

```bash
# Backend startup
cd ApexPlanner-backend
npm install
npm run prisma:migrate
npm run dev

# Frontend startup (in another terminal)
cd apex-task-manager
npm install
npm run dev
```

Then access:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API: http://localhost:5000/api/v1
- Health Check: http://localhost:5000/api/v1/health
