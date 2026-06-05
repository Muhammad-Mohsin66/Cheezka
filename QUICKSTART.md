# Cheezka - Quick Start Guide

## Prerequisites
- Node.js v14+ and npm v6+
- MongoDB (local or cloud)
- Git

## Installation & Running

### 1. Setup Backend

```bash
cd server

# Install dependencies
npm install

# Configure environment
# Edit .env file with your MongoDB URI and JWT secret
nano .env

# Start development server
npm run dev
```

Backend will be available at: `http://localhost:5000`

**Health Check:**
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-04-23T09:27:39.095Z"
}
```

### 2. Setup Frontend

In a new terminal:

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

The app will open in your browser automatically.

## Environment Files

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cheezka
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
SMTP_SERVICE=gmail
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Project Structure Overview

```
Cheezka/
├── server/               # Express + MongoDB backend
│   ├── config/          # Database config
│   ├── controllers/      # Route handlers
│   ├── models/          # Mongoose schemas (User, Order, MenuItem)
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware (error handler, auth)
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── index.js         # Server entry point
│   └── package.json
│
└── client/              # React + Vite frontend
    ├── src/
    │   ├── components/  # Reusable components (Header, Footer)
    │   ├── pages/       # Page components (Home, Login, Register, Dashboard)
    │   ├── layouts/     # Layout components (MainLayout)
    │   ├── routes/      # Route definitions
    │   ├── services/    # API services (axios instance)
    │   ├── context/     # Auth context
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Available Pages & Features

### Frontend
- **Home** (`/`) - Landing page
- **Login** (`/login`) - User login
- **Register** (`/register`) - User registration
- **Dashboard** (`/dashboard`) - User dashboard

### Backend API
- **Health Check** - `GET /api/health`
- **Root** - `GET /` (server info)

## Features Ready for Development

- ✅ Project structure
- ✅ Environment configuration
- ✅ Database connection setup
- ✅ Error handling middleware
- ✅ Health check endpoint
- ✅ Frontend routing
- ✅ Auth context (frontend)
- ✅ API service (Axios with interceptors)
- ⏳ Authentication system
- ⏳ User management
- ⏳ Menu management
- ⏳ Order management
- ⏳ Payment verification
- ⏳ Inventory tracking
- ⏳ Rider management
- ⏳ Admin dashboard

## Development Commands

### Backend
```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
```

### Frontend
```bash
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
```

## Debugging

### Backend
- Check console logs for server output
- Verify MongoDB connection
- Check `.env` file for correct credentials

### Frontend
- Check browser console for errors
- Verify API base URL in `.env`
- Check Network tab for API calls

## Next Steps

1. **Implement Authentication**
   - Create User model
   - Implement JWT auth service
   - Create login/register endpoints

2. **Setup RBAC**
   - Create authentication middleware
   - Implement role checks
   - Protected routes

3. **Build Core Features**
   - Menu management
   - Order creation & tracking
   - Inventory management
   - Payment verification

4. **Advanced Features**
   - Email notifications
   - Rider assignment
   - Admin dashboard
   - Analytics

## Troubleshooting

### Backend won't start
- Check if port 5000 is available
- Verify MongoDB connection
- Check `.env` file
- Check Node.js version (v14+)

### Frontend won't load
- Check if port 3000 is available
- Verify API base URL in `.env`
- Clear browser cache
- Check Node.js version (v14+)

### API calls failing
- Verify backend is running
- Check CORS configuration
- Verify API endpoint URLs
- Check browser console for errors

## Production Deployment

Before deploying to production:
- [ ] Change JWT_SECRET to strong value
- [ ] Set NODE_ENV=production
- [ ] Setup proper MongoDB (Atlas, etc.)
- [ ] Configure CORS for production domain
- [ ] Setup HTTPS
- [ ] Add rate limiting
- [ ] Setup logging and monitoring
- [ ] Environment-specific configs

## Support & Documentation

- See `README.md` for detailed project info
- Check folder READMEs for specific guidance
- Review model schemas for data structure

---

**Happy coding! 🍕**
