# Phase 2 Authentication - Testing Guide

## Quick Start Testing

### 1. Register New User

**Endpoint:** `POST http://localhost:5000/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "SecurePass123",
  "role": "customer"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d5ec49c0dc5b0015c8e8a1",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "customer",
    "isEmailVerified": false,
    "isActive": true,
    "createdAt": "2024-05-16T10:30:00Z",
    "updatedAt": "2024-05-16T10:30:00Z"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "User with this email or phone already exists"
}

{
  "success": false,
  "message": "Please provide all required fields"
}
```

---

### 2. Verify Email

**Check Email** - Look for verification link in email inbox

**Endpoint:** `POST http://localhost:5000/api/auth/verify-email`

**Request Body:**
```json
{
  "token": "token_from_email"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "_id": "60d5ec49c0dc5b0015c8e8a1",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "customer",
    "isEmailVerified": true,
    "isActive": true,
    "createdAt": "2024-05-16T10:30:00Z",
    "updatedAt": "2024-05-16T10:30:00Z"
  }
}
```

---

### 3. Login User

**Endpoint:** `POST http://localhost:5000/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d5ec49c0dc5b0015c8e8a1",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "customer",
    "isEmailVerified": true,
    "isActive": true,
    "createdAt": "2024-05-16T10:30:00Z",
    "updatedAt": "2024-05-16T10:30:00Z"
  }
}
```

**Save this token** - You'll need it for protected routes

---

### 4. Get Current User (Protected Route)

**Endpoint:** `GET http://localhost:5000/api/auth/me`

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "60d5ec49c0dc5b0015c8e8a1",
    "role": "customer"
  }
}
```

---

### 5. Request Password Reset

**Endpoint:** `POST http://localhost:5000/api/auth/request-reset`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

**Check Email** - Look for reset link

---

### 6. Reset Password

**Endpoint:** `POST http://localhost:5000/api/auth/reset-password`

**Request Body:**
```json
{
  "token": "token_from_reset_email",
  "newPassword": "NewSecurePass456"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Now login with new password:**
```json
{
  "email": "john@example.com",
  "password": "NewSecurePass456"
}
```

---

### 7. Request OTP

**Endpoint:** `POST http://localhost:5000/api/auth/request-otp`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

**Check Email** - Look for OTP code (6 digits)

---

### 8. Verify OTP

**Endpoint:** `POST http://localhost:5000/api/auth/verify-otp`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d5ec49c0dc5b0015c8e8a1",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "customer",
    "isEmailVerified": true,
    "isActive": true
  }
}
```

---

### 9. Get All Users (Admin Only)

**Endpoint:** `GET http://localhost:5000/api/auth/users`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "count": 5,
  "users": [
    {
      "_id": "60d5ec49c0dc5b0015c8e8a1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "customer",
      "isEmailVerified": true,
      "isActive": true,
      "createdAt": "2024-05-16T10:30:00Z",
      "updatedAt": "2024-05-16T10:30:00Z"
    }
  ]
}
```

**Error (Non-Admin User):**
```json
{
  "success": false,
  "message": "User role \"customer\" is not authorized to access this resource"
}
```

---

## Test Scenarios

### Scenario 1: Complete Registration Flow
1. Register new user ✓
2. Check email for verification link
3. Verify email ✓
4. Login with credentials ✓
5. Access protected routes ✓

### Scenario 2: Password Reset Flow
1. Login user ✓
2. Request password reset ✓
3. Check email for reset link
4. Reset password ✓
5. Login with new password ✓

### Scenario 3: OTP Login Flow
1. Request OTP ✓
2. Check email for OTP
3. Verify OTP ✓
4. Receive JWT token ✓
5. Access protected routes ✓

### Scenario 4: RBAC Testing
1. Create admin user manually
2. Create customer user
3. Test admin endpoint with customer token (should fail)
4. Test admin endpoint with admin token (should succeed)

### Scenario 5: Error Scenarios
1. Login with wrong password ✗
2. Register with duplicate email ✗
3. Access protected route without token ✗
4. Use invalid token ✗
5. Use expired token ✗

---

## Curl Command Reference

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "SecurePass123",
    "role": "customer"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Get Me (Protected)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Request Reset
```bash
curl -X POST http://localhost:5000/api/auth/request-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### Request OTP
```bash
curl -X POST http://localhost:5000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456"
  }'
```

---

## Postman Collection Import

Create a new Postman Collection with these requests:

1. **Register User**
   - Method: POST
   - URL: `{{base_url}}/api/auth/register`
   - Body: Raw JSON (see examples above)

2. **Verify Email**
   - Method: POST
   - URL: `{{base_url}}/api/auth/verify-email`
   - Body: `{"token": "your_token"}`

3. **Login**
   - Method: POST
   - URL: `{{base_url}}/api/auth/login`
   - Body: Raw JSON email & password

4. **Get Me**
   - Method: GET
   - URL: `{{base_url}}/api/auth/me`
   - Headers: `Authorization: Bearer {{token}}`

5. **Request Reset**
   - Method: POST
   - URL: `{{base_url}}/api/auth/request-reset`
   - Body: `{"email": "your_email"}`

**Set Variables in Postman:**
- `base_url`: `http://localhost:5000`
- `token`: (Update after login response)

---

## Debugging Tips

### Check Server Logs
```bash
# If running with nodemon
npm run dev
# Watch for console.log output and error messages
```

### Test Email Configuration
1. Check `.env` email credentials
2. Verify Gmail App Password (not regular password)
3. Check CORS settings if frontend can't reach server

### Token Issues
- Token format: `Bearer <token>`
- Check Authorization header spelling
- Verify token is from latest login
- Check JWT_SECRET in `.env`

### Database Issues
- Verify MongoDB is running
- Check MONGODB_URI in `.env`
- Check for unique index violations (email/phone)
- Clear collections if needed: `db.users.deleteMany({})`

---

## Success Indicators ✅

- [x] All endpoints return proper status codes
- [x] Errors have meaningful messages
- [x] Protected routes require valid token
- [x] Emails send successfully (check provider settings)
- [x] Tokens expire as configured
- [x] Passwords are hashed (not plain text in DB)
- [x] Sensitive fields not in responses
- [x] RBAC prevents unauthorized access

---

Last Updated: May 16, 2026
