# Phase 2: Authentication & RBAC System

## Overview

This document outlines the complete authentication and role-based access control (RBAC) system implemented for Cheezka.

---

## 1. User Roles

Four roles are supported:
- **admin**: Full system access, user management
- **employee**: Employee operations, order management
- **rider**: Delivery operations
- **customer**: Customer operations, placing orders

---

## 2. Architecture

### 2.1 User Model (`models/User.js`)
Complete Mongoose schema with:
- Password hashing using bcrypt (pre-save middleware)
- Email verification tokens
- Password reset tokens
- OTP support
- Role-based access
- Timestamp tracking

**Key Fields:**
```javascript
{
  name: String (required),
  email: String (unique, required),
  phone: String (unique, 10 digits, required),
  password: String (hashed, min 6 chars),
  role: String (enum: admin, employee, rider, customer),
  isEmailVerified: Boolean (default: false),
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  otpCode: String,
  otpExpire: Date,
  isActive: Boolean (default: true),
  timestamps: true
}
```

### 2.2 Authentication Features

#### JWT Tokens (`utils/jwt.js`)
- Token generation with user ID and role
- Configurable expiration (default: 7 days)
- Token verification utility

#### Email System (`config/email.js`)
- **Verification Email**: Sent during registration, expires in 24 hours
- **Password Reset Email**: Sent when user requests reset, expires in 1 hour
- **OTP Email**: Sent for OTP login, expires in 10 minutes
- Uses Nodemailer with Gmail SMTP

#### Password Hashing
- Bcrypt with salt rounds: 10
- Automatic hashing on save (if password is modified)
- Compare method for login validation

#### Auth Middleware (`middleware/auth.js`)
- `protect`: Verifies JWT token from Authorization header
- `authorizeRoles(...roles)`: Checks user role against required roles

---

## 3. API Endpoints

### 3.1 Public Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "securePassword123",
  "role": "customer"  // optional, defaults to 'customer'
}

Response:
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Verify Email
```
POST /api/auth/verify-email
Content-Type: application/json

Body:
{
  "token": "token_received_in_email"
}

Response:
{
  "success": true,
  "message": "Email verified successfully",
  "user": { ... }
}
```

#### Request Password Reset
```
POST /api/auth/request-reset
Content-Type: application/json

Body:
{
  "email": "john@example.com"
}

Response:
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

#### Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

Body:
{
  "token": "token_received_in_email",
  "newPassword": "newSecurePassword123"
}

Response:
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### Request OTP
```
POST /api/auth/request-otp
Content-Type: application/json

Body:
{
  "email": "john@example.com"
}

Response:
{
  "success": true,
  "message": "OTP sent to your email"
}
```

#### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

Body:
{
  "email": "john@example.com",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### 3.2 Protected Endpoints

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user": { ... }
}
```

#### Get All Users (Admin Only)
```
GET /api/auth/users
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 10,
  "users": [ ... ]
}
```

---

## 4. Authentication Flow

### 4.1 User Registration Flow
```
1. User submits: name, email, phone, password
2. Validation checks for duplicate email/phone
3. Password is hashed (bcrypt)
4. User created in DB
5. Verification token generated and stored (hashed)
6. Verification email sent
7. JWT token generated and returned
8. Response with user data and token
```

### 4.2 Email Verification Flow
```
1. User clicks link from email
2. Token sent to /api/auth/verify-email
3. Token hashed and compared with DB
4. If valid and not expired, mark email as verified
5. Clear verification token from DB
6. Return success response
```

### 4.3 Password Reset Flow
```
1. User requests reset via /api/auth/request-reset
2. Reset token generated and stored (hashed)
3. Reset email sent with token
4. User clicks link, enters new password
5. Token verified and new password set
6. Clear reset token from DB
7. Confirmation response
```

### 4.4 OTP Login Flow
```
1. User requests OTP via /api/auth/request-otp
2. 6-digit OTP generated and stored (hashed)
3. OTP sent via email (10-minute expiry)
4. User enters OTP at /api/auth/verify-otp
5. OTP verified and matched with email
6. JWT token generated and returned
7. Clear OTP from DB
```

---

## 5. Environment Setup

### 5.1 Required Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/cheezka

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@cheezka.com

# Client URL (for verification/reset links)
CLIENT_URL=http://localhost:3000
```

### 5.2 Gmail Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer" (or your device)
4. Copy the 16-character password
5. Use this password in `EMAIL_PASSWORD` in `.env`

---

## 6. Security Features

✅ **Password Security**
- Bcrypt hashing with 10 salt rounds
- Passwords never logged or returned in responses
- Minimum 6 characters enforced

✅ **Token Security**
- JWT tokens with expiration (default 7 days)
- Tokens must be sent in Authorization header
- Secrets stored in environment variables

✅ **Email Verification**
- Token-based verification required for new accounts
- Verification tokens expire after 24 hours
- Hashed tokens stored in database

✅ **Password Reset**
- Separate reset token for password changes
- Reset tokens expire after 1 hour
- Email verification required to complete reset

✅ **OTP Security**
- 6-digit OTP generated randomly
- OTP hashed before storage
- 10-minute expiration window
- Single-use tokens

✅ **Role-Based Access**
- RBAC middleware for route protection
- Multiple role support per endpoint
- Failed authorization returns 403 Forbidden

---

## 7. Usage Examples

### 7.1 Protecting a Route

```javascript
const { protect, authorizeRoles } = require('../middleware/auth');

// Protect with authentication only
router.get('/profile', protect, controllerMethod);

// Protect with specific roles
router.delete('/users/:id', protect, authorizeRoles('admin'), controllerMethod);

// Multiple roles allowed
router.get('/orders', protect, authorizeRoles('admin', 'employee'), controllerMethod);
```

### 7.2 Client-Side Token Usage

```javascript
// Store token after login
localStorage.setItem('token', response.token);

// Include token in API requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
};

// Fetch with token
const response = await fetch('/api/auth/me', { headers });
```

---

## 8. Error Handling

### Common Error Responses

```javascript
// 400 Bad Request - Validation error
{
  "success": false,
  "message": "Please provide all required fields"
}

// 401 Unauthorized - Auth failed
{
  "success": false,
  "message": "Invalid email or password"
}

// 403 Forbidden - Insufficient permissions
{
  "success": false,
  "message": "User role \"customer\" is not authorized to access this resource"
}

// 404 Not Found - Resource not found
{
  "success": false,
  "message": "User not found"
}
```

---

## 9. Database Indexes

Recommended MongoDB indexes for performance:

```javascript
// In User.js, add:
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ isEmailVerified: 1 });
userSchema.index({ resetPasswordExpire: 1 });
userSchema.index({ otpExpire: 1 });
```

---

## 10. Testing the System

### 10.1 Using Postman

1. **Register**: POST /api/auth/register
   - Capture verification token from email
   
2. **Verify Email**: POST /api/auth/verify-email
   - Use captured token
   
3. **Login**: POST /api/auth/login
   - Capture JWT token from response
   
4. **Protected Route**: GET /api/auth/me
   - Include Bearer token in Authorization header

### 10.2 Sample Request Sequence

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123"
  }'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# 3. Get Current User (use token from login response)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 11. Next Steps (Phase 3)

- [ ] User profile update endpoint
- [ ] Change password endpoint
- [ ] Logout mechanism with token blacklist
- [ ] Refresh token implementation
- [ ] Google/GitHub OAuth integration
- [ ] Two-factor authentication (2FA)
- [ ] Session management
- [ ] Audit logging for auth events

---

## 12. File Structure

```
server/
├── models/
│   └── User.js                 # User schema with hashing
├── controllers/
│   └── authController.js       # 7 auth methods
├── routes/
│   └── auth.js                 # Auth endpoints
├── middleware/
│   └── auth.js                 # JWT protection & RBAC
├── config/
│   └── email.js                # Nodemailer setup
├── utils/
│   └── jwt.js                  # Token generation/verification
├── .env.example                # Environment template
└── index.js                    # Updated with auth routes
```

---

## 13. Troubleshooting

### Issue: Email not sending
- Check Gmail App Password is correct
- Verify 2FA is enabled on Gmail account
- Check email credentials in .env
- Try with a different SMTP provider

### Issue: Token expired
- Adjust JWT_EXPIRE in .env
- Current default: 7 days

### Issue: Email verification token invalid
- Token must be used within 24 hours
- Request new verification email from registration

### Issue: User cannot reset password
- Reset link must be used within 1 hour
- Request new reset via /api/auth/request-reset

---

Last Updated: May 16, 2026
