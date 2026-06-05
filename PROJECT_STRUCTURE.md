# Cheezka - Complete Project Structure

## Full Directory Tree

```
Cheezka/
 README.md                    # Main project documentation
 QUICKSTART.md               # Quick start guide
 SETUP_CHECKLIST.md          # Detailed checklist of completed tasks
 PROJECT_STRUCTURE.md        # This file
 .gitignore                  # Root git ignore

 index.js               # Server entry point     server/                     # 
 package.json           # Backend dependencies    
 package-lock.json      # Dependency lock file   
 .env                   # Environment variables    
 .gitignore             # Git ignore for server    
   
 config/                # Configuration files    
 database.js        # MongoDB connection       
   
 controllers/           # Request handlers    
 README.md          # Folder guidance      
 healthController.js # Health check handler       
   
 models/                # Mongoose schemas    
 User.js            # User model placeholder       
 MenuItem.js        # Menu item model placeholder       
 Order.js           # Order model placeholder       
   
 routes/                # API endpoint definitions    
 README.md          # Folder guidance      
 health.js          # Health check route       
   
 middleware/            # Custom middleware    
 README.md          # Folder guidance      
 errorHandler.js    # Global error handler       
   
 services/              # Business logic layer    
 README.md          # Folder guidance      
   
 utils/                 # Utility functions    
 AppError.js        # Custom error class       
   
 uploads/               # File upload directory    
   
 node_modules/          # Dependencies (auto-installed)   

 index.html             # HTML entry point      client/                     # 
 package.json           # Frontend dependencies     
 package-lock.json      # Dependency lock file    
 .env                   # Environment variables     
 .gitignore             # Git ignore for client     
 vite.config.js         # Vite configuration     
    
 public/                # Static assets folder     
    
 src/                   # Source code folder     
 main.jsx           # React entry point        
 App.jsx            # Root app component        
 index.css          # Global styles        
       
 components/        # Reusable components        
 Header.jsx     # Navigation header           
 Footer.jsx     # Footer component           
       
 pages/             # Page components        
 Home.jsx       # Landing page           
 Login.jsx      # Login page           
 Register.jsx   # Registration page           
 Dashboard.jsx  # User dashboard           
       
 layouts/           # Layout components        
 MainLayout.jsx # Main layout with Header/Footer           
       
 routes/            # Route definitions        
 index.jsx      # Route configuration           
       
 services/          # API services        
 api.js         # Axios instance with interceptors           
       
 context/           # React Context        
 AuthContext.jsx # Authentication context           
       
 utils/             # Utility functions       
 (to be created as needed)           
    
 node_modules/          # Dependencies (auto-installed)    
```

## File Descriptions

### Backend Files

#### Core Server
- **index.js** - Express server setup, middleware configuration, route registration, error handling
- **package.json** - Project metadata and dependencies list

#### Configuration
- **.env** - Environment variables (PORT, MONGODB_URI, JWT_SECRET, etc.)
- **config/database.js** - MongoDB connection with Mongoose

#### Controllers
- **controllers/healthController.js** - Health check endpoint handler
- **controllers/README.md** - Guidance for adding new controllers

#### Models
- **models/User.js** - User schema placeholder (name, email, role, address, etc.)
- **models/MenuItem.js** - Menu item schema placeholder (price, inventory, etc.)
- **models/Order.js** - Order schema placeholder (items, status, payment, delivery, etc.)

#### Routes
- **routes/health.js** - Health check endpoint definition
- **routes/README.md** - Guidance for API route organization

#### Middleware
- **middleware/errorHandler.js** - Centralized error handling (logs and formats errors)
- **middleware/README.md** - Guidance for adding authentication, validation middleware

#### Services
- **services/README.md** - Guidance for business logic services

#### Utils
- **utils/AppError.js** - Custom error class for consistent error handling

### Frontend Files

#### Core App
- **main.jsx** - React app initialization (ReactDOM.createRoot)
- **App.jsx** - Root component (imports routes)
- **index.html** - HTML template (with root div)
- **index.css** - Global styles (reset, fonts, base styles)
- **package.json** - Project metadata and dependencies list

#### Configuration
- **.env** - Environment variables (VITE_API_BASE_URL)
- **vite.config.js** - Vite bundler configuration

#### Components
- **components/Header.jsx** - Navigation header (logo, links, logout button)
- **components/Footer.jsx** - Footer (copyright, links)

#### Pages
- **pages/Home.jsx** - Landing page (welcome message, CTA button)
- **pages/Login.jsx** - User login form (email, password)
- **pages/Register.jsx** - User registration form (name, email, password, role)
- **pages/Dashboard.jsx** - User dashboard (welcome, user info)

#### Layouts
- **layouts/MainLayout.jsx** - Main layout wrapper (Header + content + Footer)

#### Routes
- **routes/index.jsx** - React Router configuration (all page routes)

#### Services
- **services/api.js** - Axios instance with:
  - Base URL from env variable
  - Request interceptor (auto-inject JWT token)
  - Response interceptor (handle 401, redirect to login)

#### Context
- **context/AuthContext.jsx** - Authentication state management:
  - User state
  - isAuthenticated flag
  - login/logout methods
  - useAuth hook for components

## Technology Stack Summary

### Backend (Server)
```
 Framework: Express.js v5.2.1
 Database: MongoDB + Mongoose v9.5.0
 Authentication: JWT (jsonwebtoken v9.0.3)
 Security: bcryptjs v3.0.3
 File Upload: multer v2.1.1
 Logging: morgan v1.10.1
 Email: nodemailer v8.0.5
 CORS: cors v2.8.6
 Config: dotenv v17.4.2
 Dev Tool: nodemon v3.1.14
```

### Frontend (Client)
```
 Framework: React v18.2.0
 Bundler: Vite v5.0.8
 Routing: React Router v6.20.0
 HTTP Client: Axios v1.6.2
 State: Context API (React built-in)
 Plugin: @vitejs/plugin-react v4.2.0
```

## Feature Readiness Status

###  Implemented
- Project structure and organization
- Environment configuration
- Database connection setup
- Error handling middleware
- Health check endpoint
- Frontend routing
- Authentication context (skeleton)
- API service with interceptors
- Responsive layout
- UI placeholder pages

- User registration endpoint### 
- User login endpoint
- JWT token generation
- Password hashing with bcryptjs
- Authentication middleware
- Role-based access control
- Protected routes
- Login/Register functionality

- Menu CRUD operations### 
- Order management system
- Payment verification system
- Inventory tracking
- Email notifications
- Rider assignment
- Admin dashboard
- Analytics dashboard

## Development Workflow

### 1. Start Both Servers
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

### 2. Development URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Base: http://localhost:5000/api

### 3. API Testing
```bash
# Health check
curl http://localhost:5000/api/health

# Expected response
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

## Key Design Decisions

1. **MVC Architecture** - Separation of concerns (Controllers, Services, Models)
2. **Centralized Error Handling** - Single error handler for consistency
3. **Environment-Based Config** - Secure credential management
4. **Axios Interceptors** - Automatic JWT injection and error handling
5. **Context API** - Lightweight state management for auth
6. **Modular Routes** - Organized endpoint definitions
7. **Model Placeholders** - Foundation ready for implementation
8. **Responsive Layout** - Flexible MainLayout component

## File Statistics

- **Total Files**: 50+ (including node_modules)
- **Custom Files**: 24 (excluding dependencies)
- **Backend Custom**: 10
- **Frontend Custom**: 14
- **Documentation**: 4

---

Generated: April 23, 2024
Status: Foundation Phase Complete 
Next: Phase 2 - Authentication Setup
