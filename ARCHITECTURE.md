# Phase 2 Authentication System - Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATION                        │
│                    (React/Vue/Angular)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    HTTP/HTTPS Request
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    EXPRESS SERVER                                │
│          ┌────────────────────────────────────┐                │
│          │      CORS Middleware                │                │
│          │   Morgan Logging                   │                │
│          │   Body Parser                      │                │
│          └────────────────────────────────────┘                │
│                           │                                     │
│          ┌────────────────▼─────────────────────┐              │
│          │        Route Handler                  │              │
│          │    /api/auth/* routes               │              │
│          └────────────────┬─────────────────────┘              │
│                           │                                     │
│          ┌────────────────▼─────────────────────┐              │
│          │    Auth Middleware                   │              │
│          │ • JWT Verification (protect)         │              │
│          │ • Role Authorization (authorizeRoles)│              │
│          └────────────────┬─────────────────────┘              │
│                           │                                     │
│          ┌────────────────▼─────────────────────┐              │
│          │   Auth Controller                    │              │
│          │ • registerUser                       │              │
│          │ • loginUser                          │              │
│          │ • verifyEmail                        │              │
│          │ • requestPasswordReset               │              │
│          │ • resetPassword                      │              │
│          │ • requestOTP                         │              │
│          │ • verifyOTP                          │              │
│          └────────────────┬─────────────────────┘              │
│                           │                                     │
│          ┌────────────────▼─────────────────────┐              │
│          │    Utility Functions                 │              │
│          │ • JWT generation & verification      │              │
│          │ • Email sending                      │              │
│          │ • Password hashing (bcrypt)          │              │
│          │ • Error handling                     │              │
│          └────────────────┬─────────────────────┘              │
│                           │                                     │
│          ┌────────────────▼─────────────────────┐              │
│          │    Mongoose Models                   │              │
│          │ • User Schema                        │              │
│          │ • Pre-save hooks                     │              │
│          │ • Validation rules                   │              │
│          └────────────────┬─────────────────────┘              │
│                           │                                     │
└───────────────────────────┼──────────────────────────────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ▼                      ▼                      ▼
┌─────────────┐    ┌──────────────┐    ┌──────────────────┐
│  MongoDB    │    │   Gmail      │    │  Environment     │
│  Database   │    │   SMTP       │    │   Variables      │
│             │    │   (Email)    │    │                  │
│ • Users     │    │              │    │ • JWT_SECRET     │
│ • Tokens    │    │ • Sends      │    │ • EMAIL_USER     │
│ • Hashed    │    │   emails     │    │ • DB_CONNECTION  │
│   password  │    │ • Formatting │    │ • CLIENT_URL     │
└─────────────┘    └──────────────┘    └──────────────────┘
```

---

## Request/Response Flow

### Registration Flow
```
CLIENT                          SERVER                      DATABASE
  │                              │                            │
  │─ POST /register ─────────────>│                            │
  │  (name, email, phone, pwd)    │                            │
  │                              │                            │
  │                         [Validation]                      │
  │                         [Hash Password]                   │
  │                         [Generate Token]                  │
  │                              │─── CREATE USER ─────────>│
  │                              │<─── USER CREATED ────────│
  │                              │                            │
  │                         [Send Email]                      │
  │                              │─── SEND EMAIL ──────────> GMAIL
  │                              │                            │
  │<─ 201 + JWT Token ──────────┤                            │
  │  (success, user, token)      │                            │
  │                              │                            │
```

### Login Flow
```
CLIENT                          SERVER                      DATABASE
  │                              │                            │
  │─ POST /login ────────────────>│                            │
  │  (email, password)            │                            │
  │                              │                            │
  │                         [Validate Input]                  │
  │                              │─── FIND USER ───────────>│
  │                              │<─── USER FOUND ────────── │
  │                         [Check Password]                  │
  │                         [Generate JWT]                    │
  │<─ 200 + JWT Token ──────────┤                            │
  │  (success, user, token)      │                            │
  │                              │                            │
```

### Protected Route Flow
```
CLIENT                          SERVER                      DATABASE
  │                              │                            │
  │─ GET /me ────────────────────>│                            │
  │  Authorization: Bearer <token>│                            │
  │                              │                            │
  │                    [Verify Token]                         │
  │                    [Extract User ID & Role]               │
  │                    [Authorize Access]                     │
  │                              │─── FIND USER ───────────>│
  │                              │<─── USER DATA ────────── │
  │<─ 200 + User Data ──────────┤                            │
  │  (success, user)             │                            │
  │                              │                            │
```

---

## Authentication Methods Matrix

```
┌──────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION METHODS                        │
├───────────────────┬───────────────┬────────────┬────────────┤
│ Method            │ Endpoint      │ Response   │ Next Step  │
├───────────────────┼───────────────┼────────────┼────────────┤
│ Register          │ /register     │ JWT Token  │ Verify     │
│ + Email Verify    │ /verify-email │ Success    │ Login      │
├───────────────────┼───────────────┼────────────┼────────────┤
│ Login             │ /login        │ JWT Token  │ Protected  │
│ (Email + Pass)    │               │            │ Routes     │
├───────────────────┼───────────────┼────────────┼────────────┤
│ OTP Login         │ /request-otp  │ OTP Sent   │ /verify-otp│
│                   │ /verify-otp   │ JWT Token  │ Protected  │
├───────────────────┼───────────────┼────────────┼────────────┤
│ Password Reset    │ /request-reset│ Email Sent │ /reset-pwd │
│                   │ /reset-pwd    │ Success    │ Login      │
└───────────────────┴───────────────┴────────────┴────────────┘
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   AUTH ROUTES                           │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │Register  │ Login    │ Verify   │ Reset    │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
│         │           │           │           │           │
│         └─────────────┬─────────────────────┘           │
│                       ▼                                  │
│              ┌─────────────────┐                        │
│              │ AUTH CONTROLLER │                        │
│              │  (7 Methods)    │                        │
│              └────────┬────────┘                        │
│                       │                                  │
│         ┌─────────────┼──────────────┐                  │
│         │             │              │                  │
│         ▼             ▼              ▼                  │
│    ┌────────┐  ┌──────────┐  ┌──────────┐             │
│    │ Models │  │ Utils    │  │ Middleware│             │
│    │(User)  │  │(JWT,     │  │(Auth,    │             │
│    │        │  │Email,    │  │RBAC)     │             │
│    │• Validate
│  │Bcrypt)  │  │          │             │
│    │• Hash   │  │          │  │• Protect │             │
│    │• Compare│  │          │  │• AuthorizeRoles│     │
│    └────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
     ┌────────┐    ┌──────────┐   ┌──────────┐
     │ Database│   │ Email    │   │ Security │
     │ (User   │   │ (Gmail)  │   │ (Tokens) │
     │  Tokens)│   │          │   │          │
     └────────┘    └──────────┘   └──────────┘
```

---

## Data Flow for Registration

```
User Input
  │
  │ {name, email, phone, password}
  │
  ▼
Validation Layer
  ├─ Check required fields
  ├─ Validate email format
  ├─ Validate phone (10 digits)
  ├─ Check duplicate email/phone
  │
  ▼
Password Processing
  ├─ Bcrypt hash (10 rounds)
  │
  ▼
Database
  ├─ Save user with hashed password
  ├─ Generate verification token
  ├─ Set token expiry (24 hours)
  │
  ▼
Email Service
  ├─ Create verification email
  ├─ Send via Gmail SMTP
  │
  ▼
Response
  ├─ Generate JWT token
  ├─ Return user data (without sensitive fields)
  ├─ Return authentication token
  │
  ▼
Client
  ├─ Store JWT token
  ├─ Check email for verification
```

---

## Security Layers

```
┌────────────────────────────────────────────┐
│          SECURITY ARCHITECTURE              │
├────────────────────────────────────────────┤
│                                            │
│  Layer 1: Input Validation                │
│  ├─ Field presence check                  │
│  ├─ Format validation (email, phone)      │
│  ├─ Length constraints                    │
│  └─ Type checking                         │
│                                            │
│  Layer 2: Password Security                │
│  ├─ Bcrypt hashing (10 rounds)            │
│  ├─ Salted hashing                        │
│  ├─ Never store plain text                │
│  └─ Compare method for validation         │
│                                            │
│  Layer 3: Token Security                   │
│  ├─ JWT with secret key                   │
│  ├─ Token expiration                      │
│  ├─ Role-based payload                    │
│  └─ Bearer token validation                │
│                                            │
│  Layer 4: Email Security                   │
│  ├─ Hashed tokens in DB                   │
│  ├─ Time-limited tokens                   │
│  ├─ Single-use tokens                     │
│  └─ Secure comparison                     │
│                                            │
│  Layer 5: Access Control                   │
│  ├─ Authentication check                  │
│  ├─ Role authorization                    │
│  ├─ Active user verification              │
│  └─ 401/403 responses                     │
│                                            │
│  Layer 6: Data Protection                  │
│  ├─ Sensitive field exclusion              │
│  ├─ Request validation                    │
│  ├─ Error message sanitization            │
│  └─ CORS configuration                    │
│                                            │
└────────────────────────────────────────────┘
```

---

## Role-Based Access Control

```
┌─────────────────────────────────────┐
│      ROLE HIERARCHY & PERMISSIONS    │
├─────────────────────────────────────┤
│                                     │
│  ADMIN                              │
│  ├─ Access all endpoints            │
│  ├─ User management                 │
│  ├─ System configuration            │
│  ├─ Can call: /auth/users           │
│  └─ Override all access             │
│                                     │
│  EMPLOYEE                           │
│  ├─ Order management                │
│  ├─ Order tracking                  │
│  ├─ Customer service                │
│  └─ Limited admin functions         │
│                                     │
│  RIDER                              │
│  ├─ Delivery management             │
│  ├─ Order pickup/delivery           │
│  ├─ Location tracking               │
│  └─ Rider-specific functions        │
│                                     │
│  CUSTOMER (Default)                 │
│  ├─ Place orders                    │
│  ├─ View own orders                 │
│  ├─ Update profile                  │
│  └─ Limited to own data             │
│                                     │
└─────────────────────────────────────┘
```

---

## Token Lifecycle

```
Registration
     │
     ├─► Verification Token (24 hours)
     │      │
     │      └─► Expires or Used → Removed
     │
     └─► JWT Token (7 days)
            │
            ├─► [Valid for Protected Routes]
            │    │
            │    └─► Each Request Verified
            │
            └─► [Expires]
                 │
                 └─► Refresh Needed (Phase 3)
```

---

## Email Token Lifecycle

```
User Registration
     │
     ├─► Verification Token Generated
     │      │
     │      ├─► Hashed & Stored in DB
     │      ├─► Expires in 24 hours
     │      └─► Sent via Email
     │
     └─► User Clicks Link
            │
            └─► Token Verified
                 │
                 ├─► Valid & Not Expired → Email Verified
                 ├─► Expired → Request New Link
                 └─► Invalid → Error
```

---

## Error Handling Flow

```
Request
  │
  ▼
Try Execution
  │
  ├─ [Error] ──┐
  │            │
  ▼            │
Try Catch      │
  │            │
  ├─ Catch Error
  │            │
  ▼            │
Error Handler  │
  │            │
  ├─ AppError? │
  │            │
  ├─ Yes ──┐   │
  │        │   │
  │        ▼   │
  │     Map to │
  │    HTTP   │
  │   Status  │
  │        │   │
  └────────┤   │
           │   │
           ▼   │
        Response
           │
           └─ Client
```

---

## Database Schema Relationships

```
┌─────────────────────────────────────┐
│         USER COLLECTION             │
├─────────────────────────────────────┤
│ _id: ObjectId                       │
│ name: String                        │
│ email: String (unique)              │
│ phone: String (unique)              │
│ password: String (hashed)           │
│ role: String (enum)                 │
├─────────────────────────────────────┤
│ Email Verification                  │
│ ├─ isEmailVerified: Boolean         │
│ ├─ emailVerificationToken: String   │
│ └─ emailVerificationExpire: Date    │
├─────────────────────────────────────┤
│ Password Reset                      │
│ ├─ resetPasswordToken: String       │
│ └─ resetPasswordExpire: Date        │
├─────────────────────────────────────┤
│ OTP Login                           │
│ ├─ otpCode: String                 │
│ └─ otpExpire: Date                 │
├─────────────────────────────────────┤
│ Account Status                      │
│ ├─ isActive: Boolean                │
│ ├─ createdAt: Date                 │
│ └─ updatedAt: Date                 │
└─────────────────────────────────────┘
```

---

## HTTP Status Codes Used

```
┌──────┬─────────────────────────────────┐
│ Code │ Scenario                        │
├──────┼─────────────────────────────────┤
│ 200  │ Successful requests (login, me) │
│ 201  │ Resource created (register)     │
│ 400  │ Bad request (validation error)  │
│ 401  │ Unauthorized (invalid token)    │
│ 403  │ Forbidden (insufficient role)   │
│ 404  │ Not found (user doesn't exist)  │
│ 500  │ Server error                    │
└──────┴─────────────────────────────────┘
```

---

**System Architecture Designed for:**
- ✅ Scalability
- ✅ Security
- ✅ Maintainability
- ✅ Extensibility
- ✅ Performance

Last Updated: May 16, 2026
