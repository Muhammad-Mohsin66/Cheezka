# Cheezka - Food Ordering System

A production-ready MERN stack application for single-branch restaurant food ordering with role-based access control.

## Project Structure

```
Cheezka/
├── client/                  # React frontend (Vite)
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── layouts/         # Layout components
│   │   ├── routes/          # Route definitions
│   │   ├── services/        # API service (axios instance)
│   │   ├── context/         # React Context (Auth, etc.)
│   │   ├── utils/           # Utility functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env
│   └── .gitignore
│
└── server/                  # Node.js/Express backend
    ├── config/              # Configuration files
    │   └── database.js      # MongoDB connection ✓
    ├── controllers/         # Request handlers (business logic)
    ├── models/              # Mongoose schemas
    ├── routes/              # API endpoint definitions
    ├── middleware/          # Custom middleware
    │   └── errorHandler.js  # Global error handler ✓
    ├── services/            # Business logic layer
    ├── utils/               # Utility functions
    │   └── AppError.js      # Custom error class ✓
    ├── uploads/             # File upload directory
    ├── index.js             # Server entry point ✓
    ├── package.json
    ├── .env
    └── .gitignore
```

## Features

- **Roles**: Admin, Employee, Rider, Customer
- **Authentication**: JWT-based RBAC
- **Database**: MongoDB with Mongoose
- **Payment**: Manual verification system
- **Inventory**: Stock tracking
- **Orders**: Complete order management
- **Frontend**: React with Vite
- **API**: RESTful API with Express

## Technology Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT for authentication
- bcryptjs for password hashing
- multer for file uploads
- nodemailer for email notifications
- morgan for logging
- CORS for cross-origin requests

### Frontend
- React 18
- Vite
- React Router v6
- Axios
- Context API for state management

## Getting Started

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Configure environment variables in `.env`:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cheezka
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

3. Install dependencies:
```bash
npm install
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Configure API endpoint in `.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

4. Start the dev server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Authentication (To be implemented)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Token refresh

### Users (To be implemented)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/{id}` - Get user by ID

### Orders (To be implemented)
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/{id}` - Get order details
- `PUT /api/orders/{id}/status` - Update order status

### Menu (To be implemented)
- `GET /api/menu` - Get all menu items
- `GET /api/menu/categories` - Get categories
- `GET /api/menu/{id}` - Get menu item details

### Admin (To be implemented)
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/analytics` - Sales analytics
- `GET /api/admin/inventory` - Inventory status

### Riders (To be implemented)
- `GET /api/riders/assignments` - Get assignments
- `PUT /api/riders/delivery/{id}` - Update delivery status

## Project Phases

### Phase 1: Foundation ✓
- Project structure setup
- Environment configuration
- Database connection
- Middleware setup
- Base health endpoint

### Phase 2: Authentication (Next)
- User model and schema
- JWT implementation
- Role-based access control
- Login/Register endpoints

### Phase 3: Core Features
- Menu management
- Order management
- Inventory tracking
- Payment verification

### Phase 4: Advanced Features
- Delivery tracking
- Analytics dashboard
- Email notifications
- File uploads

## Development Notes

- All environment variables must be configured before running the server
- MongoDB should be running locally or use a cloud service (MongoDB Atlas)
- Frontend API requests are automatically authenticated with JWT tokens
- Error handling is centralized in the global error handler
- All API responses follow a consistent JSON format

## Error Handling

The server includes a centralized error handler that logs errors and returns consistent error responses:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message here"
}
```

## File Uploads

The `/uploads` folder is designated for user file uploads (menu images, order receipts, etc.).

## Next Steps

1. Implement User authentication service
2. Create User model and authentication routes
3. Setup RBAC middleware for role-based access control
4. Build menu management features
5. Implement order management system
6. Add payment verification system
7. Setup inventory tracking
8. Build admin dashboard
9. Implement rider assignment and tracking

## Production Considerations

- Use environment-specific configs (development, staging, production)
- Implement rate limiting on API endpoints
- Add request validation middleware
- Use HTTPS in production
- Secure JWT secrets with strong values
- Setup logging and monitoring
- Implement database backups
- Use CDN for static assets
- Add caching strategies
