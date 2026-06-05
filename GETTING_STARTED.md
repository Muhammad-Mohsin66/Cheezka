# Cheezka - Getting Started Guide

## ✅ What You Have

Your complete MERN stack food ordering system foundation is ready!

### Project Contents
- **Backend**: Express.js + MongoDB + JWT
- **Frontend**: React 18 + Vite + React Router v6
- **Documentation**: Complete guides for development and deployment
- **Dependencies**: All major packages installed
- **Configuration**: Environment files configured

## 🚀 Running the Project

### Step 1: Start Backend Server

```bash
cd server
npm run dev
```

**Expected Output:**
```
Server is running on port 5000
Environment: development
MongoDB Connected: localhost
```

**Test the backend:**
```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-04-23T..."
}
```

### Step 2: Start Frontend (New Terminal)

```bash
cd client
npm run dev
```

**Expected Output:**
```
VITE v5.0.8  ready in 123 ms

➜  Local:   http://localhost:3000/
➜  press h to show help
```

### Step 3: Access the App

Open your browser and go to: **http://localhost:3000**

You'll see:
- Landing page (Home)
- Navigation header with links to Login, Register, Dashboard
- Responsive footer
- Clean UI ready for development

## 📋 Available Routes

### Frontend Pages
- `/` - Home page
- `/login` - Login page (form placeholder)
- `/register` - Registration page (form placeholder)
- `/dashboard` - Dashboard page (auth required in future)

### Backend API
- `GET /` - Server info
- `GET /api/health` - Health check
- *More routes to be implemented*

## 🔧 Project Structure Overview

```
Cheezka/
├── server/                  # Backend
│   ├── index.js            # Start here
│   ├── config/             # Database config
│   ├── controllers/        # Request handlers
│   ├── models/             # Data schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   └── services/           # Business logic
│
└── client/                  # Frontend
    ├── src/
    │   ├── main.jsx        # Start here
    │   ├── pages/          # Page components
    │   ├── components/     # Reusable components
    │   ├── routes/         # Route definitions
    │   ├── services/       # API client
    │   └── context/        # Auth state
```

## 📝 Configuration Files

### Backend Environment (.env)

Located at: `server/.env`

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cheezka
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

### Frontend Environment (.env)

Located at: `client/.env`

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🎯 Development Workflow

### 1. Making Backend Changes

**Location**: `server/` folder

Example - Add a new route:
1. Create controller in `controllers/`
2. Create route in `routes/`
3. Import route in `server/index.js`
4. Server auto-reloads (nodemon)

### 2. Making Frontend Changes

**Location**: `client/src/` folder

Example - Add a new page:
1. Create component in `pages/`
2. Add route in `routes/index.jsx`
3. Page automatically loads (Vite HMR)

### 3. API Communication

The axios instance in `services/api.js` automatically:
- Adds JWT token to requests
- Redirects to login on 401 errors
- Uses base URL from `.env`

## 🔐 Authentication (Next Phase)

Currently the auth context is a skeleton. To implement:

1. **Backend**: Create authentication endpoints
2. **Frontend**: Connect login/register to API
3. **Security**: Add RBAC middleware

See `QUICKSTART.md` for the next steps.

## 📚 Documentation Guide

- **README.md** - Complete project overview and features
- **QUICKSTART.md** - Detailed quick start and troubleshooting
- **SETUP_CHECKLIST.md** - What has been completed
- **PROJECT_STRUCTURE.md** - Detailed file descriptions
- **DEPLOYMENT_GUIDE.md** - Production deployment instructions
- **Folder README.md** - Guidance in each folder

## 🛠️ Common Tasks

### Install a New Package

Backend:
```bash
cd server
npm install package-name
```

Frontend:
```bash
cd client
npm install package-name
```

### Stop the Servers

Press `Ctrl+C` in each terminal.

### Clear Dependencies

To start fresh (if needed):
```bash
rm -rf node_modules package-lock.json
npm install
```

### Debug Backend

- Check `console.log` output in terminal
- Check MongoDB connection
- Verify `.env` file settings
- Check port 5000 is available

### Debug Frontend

- Check browser console (F12)
- Check Network tab for API calls
- Verify `.env` settings
- Check port 3000 is available

## ✨ What's Ready for Development

✅ **Backend Foundation**
- Express server
- MongoDB connection
- Error handling
- Request logging
- CORS configured

✅ **Frontend Foundation**
- React 18 setup
- React Router
- Axios API client
- Auth context
- Layout components

✅ **Project Structure**
- Organized folders
- Placeholder models
- README guides
- Environment config

## 🎓 Learning Resources

### Backend Concepts
- Express.js: `server/index.js`
- MongoDB/Mongoose: `server/config/database.js`
- Error Handling: `server/middleware/errorHandler.js`
- Models: `server/models/`

### Frontend Concepts
- React Router: `client/src/routes/index.jsx`
- Context API: `client/src/context/AuthContext.jsx`
- Axios: `client/src/services/api.js`
- Components: `client/src/components/`

## 🚢 Deployment

When ready for production:

1. Read `DEPLOYMENT_GUIDE.md`
2. Choose hosting provider
3. Update environment variables
4. Build frontend: `npm run build`
5. Deploy both server and client

## ❓ Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify port 5000 is free
- Check `.env` file
- Review error message in terminal

### Frontend won't load
- Check if backend is running
- Verify port 3000 is free
- Check `.env` in client folder
- Check browser console for errors

### API calls failing
- Verify backend is running
- Check API base URL in frontend `.env`
- Check CORS settings
- Check request headers in Network tab

### Dependencies issue
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Restart the server

## 📞 Next Steps

1. ✅ Understand the project structure (you're here!)
2. Run both servers and explore the UI
3. Read `README.md` for feature overview
4. See `QUICKSTART.md` for detailed setup
5. Start implementing Phase 2: Authentication

---

**You're all set! Happy coding! 🍕**

Start the servers and begin development:
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Then visit: http://localhost:3000
