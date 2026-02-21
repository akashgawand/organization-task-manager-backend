# 🚀 Quick Start Guide - ApexPlanner Frontend-Backend Integration

Get up and running in 5 minutes!

## Prerequisites

- Node.js 16+
- MySQL 8.0+
- npm or yarn

## 📋 Quick Setup

### Step 1: Backend Setup (Terminal 1)

```bash
cd ApexPlanner-backend

# Install dependencies
npm install

# Create .env file (copy from .env.example and update DATABASE_URL)
cp .env.example .env

# Edit .env with your values:
# - DATABASE_URL: Your MySQL connection string
# - JWT_ACCESS_SECRET: Some long random string
# - JWT_REFRESH_SECRET: Some other long random string
# - CORS_ORIGIN: http://localhost:3000

# Setup database
npm run prisma:migrate

# Optional: Load sample data
npm run prisma:seed

# Start the server
npm run dev
```

**✅ Backend ready when you see:**

```
Server running on port 5000
```

### Step 2: Frontend Setup (Terminal 2)

```bash
cd apex-task-manager

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > .env.local

# Start the server
npm run dev
```

**✅ Frontend ready when you see:**

```
Ready in 2.5s
```

### Step 3: Access the Application

- Open browser: **http://localhost:3000**
- Login with credentials from seed data or create new account

## 🔑 Test Credentials (if seed data loaded)

```
Email: admin@example.com
Password: Admin@123
```

Or register a new account on signup page.

## 📚 Documentation

- **Full Setup Guide**: See `INTEGRATION_GUIDE.md`
- **Verification Checklist**: See `INTEGRATION_CHECKLIST.md`
- **Bug Fixes Applied**: See `BUGFIXES.md`
- **Architecture Overview**: See `INTEGRATION_SUMMARY.md`

## 🐛 Troubleshooting

### CORS Error?

Update `CORS_ORIGIN` in backend `.env` to match frontend URL

### Database Connection Error?

Check `DATABASE_URL` format: `mysql://user:password@localhost:3306/dbname`

### Port Already in Use?

- Backend: Change PORT in .env
- Frontend: Frontend uses port 3000, change with `npm run dev -- -p 3001`

### API Returns 404?

- Verify backend is running on port 5000
- Check NEXT_PUBLIC_API_URL in frontend .env.local
- Verify endpoint paths in console logs

### Login Not Working?

- Check if database migrations ran successfully
- Verify user credentials
- Check backend logs for errors

## 🧪 Quick API Test

Test if everything is connected:

```bash
# Check backend health
curl http://localhost:5000/api/v1/health

# Test login (replace with real credentials)
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'
```

## 📱 Features to Try

1. **Dashboard** - View analytics and task overview
2. **Tasks** - Create, assign, and update tasks
3. **Projects** - Create projects (auto-generates phases)
4. **Teams** - Create teams and manage members
5. **Users** - View team members

## 🛠️ Useful Commands

### Backend

```bash
npm run dev              # Development mode with hot reload
npm start                # Production mode
npm run prisma:studio    # Open database GUI
npm run prisma:migrate   # Run pending migrations
npm run prisma:seed      # Load sample data
```

### Frontend

```bash
npm run dev              # Development mode
npm run build            # Build for production
npm run lint             # Check code quality
```

## 📝 Important Files

**Backend:**

- `.env` - Configuration file (create from .env.example)
- `prisma/schema.prisma` - Database schema
- `src/modules/*/` - API route handlers

**Frontend:**

- `.env.local` - Environment variables (create manually)
- `app/services/` - API service layer
- `app/dashboard/` - Dashboard pages

## 🔐 Security Notes

1. **Never commit `.env` or `.env.local`** - Already in .gitignore
2. **Change JWT secrets** in production
3. **Update CORS_ORIGIN** for production domain
4. **Use HTTPS** in production
5. **Store secrets** in environment variables only

## 📖 Next Steps

1. Read `INTEGRATION_GUIDE.md` for detailed information
2. Use `INTEGRATION_CHECKLIST.md` to verify everything
3. Check `BUGFIXES.md` for known issues and solutions
4. Deploy to production when ready

## 💡 Pro Tips

- **Use Postman/Insomnia** for API testing
- **Check browser DevTools** (F12) for frontend errors
- **Check terminal logs** for backend errors
- **Run `npm run prisma:studio`** to inspect database
- **Enable debug logging** by setting `LOG_LEVEL=debug` in backend .env

---

**Need Help?** See the detailed guides in this directory or check backend/frontend logs.

**Ready to start?** Run the three setup steps above! 🎉
