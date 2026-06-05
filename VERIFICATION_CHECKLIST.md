# Phase 2 Authentication - Verification Checklist

## 🔍 Complete Verification Guide

Use this checklist to verify all Phase 2 features are working correctly.

---

## 1️⃣ JWT Authentication Verification

### Password Hashing
```
✅ Register new user
   └─ Check response: password NOT included
   
✅ Login with correct password
   └─ Should return: 200 OK + JWT token
   
✅ Login with incorrect password
   └─ Should return: 401 Unauthorized
   
✅ Check MongoDB
   └─ db.users.findOne({})
   └─ password field should be: $2a$10$... (bcrypt format)
   └─ Should NOT be plain text
```

### Test Steps:
```bash
# 1. Start server
npm run dev

# 2. Register user (Postman)
POST /api/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "9876543210",
  "password": "TestPass123"
}

# Expected: ✅ 201 + JWT token + user data (no password)
# Database: ✅ password is hashed ($2a$10$...)

# 3. Check wrong password
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "WrongPass123"
}

# Expected: ✅ 401 Unauthorized
```

---

## 2️⃣ JWT Token Generation Verification

### Token Format
```
✅ Login returns JWT
   └─ Format: eyJhbGciOiJIUzI1NiIs...
   └─ Has 3 parts separated by dots: header.payload.signature
   
✅ Token includes payload
   └─ Decode at: https://jwt.io
   └─ Should contain: { id: "...", role: "..." }
   
✅ Token expires
   └─ Default: 7 days (604800 seconds)
   └─ Check: exp claim in decoded payload
```

### Test Steps:
```bash
# 1. Login
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "TestPass123"
}

# Copy the token from response

# 2. Decode token at https://jwt.io
# Paste token and verify:
# ✅ Header has: "alg": "HS256"
# ✅ Payload has: "id": "...", "role": "...", "exp": ...
# ✅ Signature verifies correctly

# 3. Use token for protected route
GET /api/auth/me
Headers: Authorization: Bearer <token>

# Expected: ✅ 200 OK + user info
```

---

## 3️⃣ Role-Based Access Control Verification

### Default Role
```
✅ Register without specifying role
   └─ Should default to: "customer"
   └─ Response should show: "role": "customer"
```

### RBAC Enforcement
```
✅ Customer accessing /api/test/admin
   └─ Should return: 403 Forbidden
   └─ Message: "not authorized"
   
✅ Admin accessing /api/test/admin
   └─ Should return: 200 OK
   └─ Message: "Admin access granted"
   
✅ Multiple role route: /api/test/staff
   └─ Admin can access: ✅ 200 OK
   └─ Employee can access: ✅ 200 OK
   └─ Rider can access: ✅ 200 OK
   └─ Customer cannot access: ✅ 403 Forbidden
```

### Test Steps:
```bash
# 1. Register as customer
POST /api/auth/register
{
  "name": "Customer User",
  "email": "customer@test.com",
  "phone": "1111111111",
  "password": "Pass123",
  "role": "customer"
}
# Save customer_token

# 2. Register as admin
POST /api/auth/register
{
  "name": "Admin User",
  "email": "admin@test.com",
  "phone": "2222222222",
  "password": "Pass123",
  "role": "admin"
}
# Save admin_token

# 3. Test customer accessing admin route
GET /api/test/admin
Authorization: Bearer customer_token

# Expected: ✅ 403 Forbidden
# Message: "User role \"customer\" is not authorized"

# 4. Test admin accessing admin route
GET /api/test/admin
Authorization: Bearer admin_token

# Expected: ✅ 200 OK
# Message: "Admin access granted"

# 5. Verify default role
POST /api/auth/register
{
  "name": "Default User",
  "email": "default@test.com",
  "phone": "3333333333",
  "password": "Pass123"
  # No role specified
}

# Expected: ✅ "role": "customer" (default)
```

---

## 4️⃣ Email Token Generation Verification

### Verification Token
```
✅ Registration sends verification email
   └─ Email contains: verification link with token
   └─ Token expires in: 24 hours
   
✅ Token hashed in database
   └─ db.users.findOne({})
   └─ emailVerificationToken: "$2a$10$..." (hashed)
   └─ emailVerificationExpire: ISODate (future date)
   
✅ After verification
   └─ emailVerificationToken: null
   └─ emailVerificationExpire: null
   └─ isEmailVerified: true
```

### Test Steps:
```bash
# 1. Register user
POST /api/auth/register
{
  "name": "Email Test",
  "email": "emailtest@test.com",
  "phone": "4444444444",
  "password": "Pass123"
}

# Expected: ✅ 201 + email sent

# 2. Check database for token
mongo
use cheezka
db.users.findOne({ email: "emailtest@test.com" })

# Verify:
# ✅ emailVerificationToken: "$2a$10$..." (hashed, not plain)
# ✅ emailVerificationExpire: ISODate (24 hours ahead)
# ✅ isEmailVerified: false

# 3. Get token from email or database query
# For testing, you can compute hash from register response token

# 4. Verify email
POST /api/auth/verify-email
{
  "token": "token_from_email"
}

# Expected: ✅ 200 OK

# 5. Check database after verification
db.users.findOne({ email: "emailtest@test.com" })

# Verify:
# ✅ emailVerificationToken: null (cleared)
# ✅ emailVerificationExpire: null (cleared)
# ✅ isEmailVerified: true
```

### Email Verification Flow
```
Register
  ├─ Generate random token
  ├─ Hash token
  ├─ Store hash in DB
  ├─ Send email with token
  │
  └─ User receives email
      └─ Click link
          └─ Send token to /verify-email
              ├─ Hash token
              ├─ Compare with DB hash
              ├─ Check expiration
              └─ Mark as verified + clear token
```

---

## 5️⃣ OTP Storage & Generation Verification

### OTP Generation
```
✅ Request OTP
   └─ Returns: 200 OK + "OTP sent"
   └─ Email sent with 6-digit code
   
✅ OTP stored in database
   └─ otpCode: "$2a$10$..." (hashed)
   └─ otpExpire: ISODate (10 minutes ahead)
   
✅ After OTP verification
   └─ otpCode: null (cleared)
   └─ otpExpire: null (cleared)
```

### Test Steps:
```bash
# 1. Request OTP
POST /api/auth/request-otp
{
  "email": "test@example.com"
}

# Expected: ✅ 200 OK + "OTP sent to your email"

# 2. Check database
mongo
use cheezka
db.users.findOne({ email: "test@example.com" })

# Verify:
# ✅ otpCode: "$2a$10$..." (hashed, not plain 6-digit code)
# ✅ otpExpire: ISODate (10 minutes from now)
# ✅ NOT plain text

# 3. Check email inbox
# Look for: "Your OTP Code - Cheezka"
# Extract: 6-digit code

# 4. Verify OTP
POST /api/auth/verify-otp
{
  "email": "test@example.com",
  "otp": "123456"
}

# Expected: ✅ 200 OK + JWT token

# 5. Check database after verification
db.users.findOne({ email: "test@example.com" })

# Verify:
# ✅ otpCode: null (cleared)
# ✅ otpExpire: null (cleared)
```

### OTP Security Features
```
✅ OTP is random 6 digits
   └─ Range: 100000 - 999999
   
✅ OTP is hashed before storage
   └─ Never plain text in database
   └─ Bcrypt format: $2a$10$...
   
✅ OTP expires in 10 minutes
   └─ otpExpire < current time = invalid
   
✅ OTP is single-use
   └─ After verification, cleared from DB
   └─ Cannot reuse same OTP
   
✅ Different OTP each time
   └─ New request = new OTP
```

---

## 6️⃣ Password Reset Token Verification

### Reset Token Generation
```
✅ Request password reset
   └─ Returns: 200 OK + "Reset link sent"
   └─ Email sent with reset link
   
✅ Reset token in database
   └─ resetPasswordToken: "$2a$10$..." (hashed)
   └─ resetPasswordExpire: ISODate (1 hour ahead)
   
✅ After password reset
   └─ resetPasswordToken: null (cleared)
   └─ resetPasswordExpire: null (cleared)
```

### Test Steps:
```bash
# 1. Request password reset
POST /api/auth/request-reset
{
  "email": "test@example.com"
}

# Expected: ✅ 200 OK + "Password reset link sent"

# 2. Check database
mongo
use cheezka
db.users.findOne({ email: "test@example.com" })

# Verify:
# ✅ resetPasswordToken: "$2a$10$..." (hashed)
# ✅ resetPasswordExpire: ISODate (1 hour from now)

# 3. Get token from email or database

# 4. Reset password
POST /api/auth/reset-password
{
  "token": "token_from_email",
  "newPassword": "NewPass456"
}

# Expected: ✅ 200 OK + "Password reset successfully"

# 5. Check database after reset
db.users.findOne({ email: "test@example.com" })

# Verify:
# ✅ resetPasswordToken: null (cleared)
# ✅ resetPasswordExpire: null (cleared)
# ✅ password: "$2a$10$..." (NEW hashed password)

# 6. Login with new password
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "NewPass456"
}

# Expected: ✅ 200 OK + JWT token
```

---

## 7️⃣ Protected Routes Verification

### Protected Route Access
```
✅ /api/auth/me requires token
   └─ Without token: 401 Unauthorized
   └─ With valid token: 200 OK + user info
   
✅ /api/test/protected requires token
   └─ Without token: 401 Unauthorized
   └─ With valid token: 200 OK
   
✅ /api/test/admin requires admin role
   └─ Without token: 401 Unauthorized
   └─ With customer token: 403 Forbidden
   └─ With admin token: 200 OK
```

### Test Steps:
```bash
# 1. Access protected route without token
GET /api/auth/me

# Expected: ✅ 401 Unauthorized
# Message: "No authentication token provided"

# 2. Access with invalid token
GET /api/auth/me
Authorization: Bearer invalid.token.here

# Expected: ✅ 401 Unauthorized
# Message: "Invalid or expired token"

# 3. Access with valid token
GET /api/auth/me
Authorization: Bearer <valid_jwt_token>

# Expected: ✅ 200 OK
# Response: { id: "...", role: "..." }

# 4. RBAC enforcement
GET /api/test/admin
Authorization: Bearer <customer_token>

# Expected: ✅ 403 Forbidden
# Message: "not authorized to access this resource"

# 5. Admin access
GET /api/test/admin
Authorization: Bearer <admin_token>

# Expected: ✅ 200 OK
# Message: "Admin access granted"
```

---

## 8️⃣ Complete Test Scenario

### Real-World Flow
```
1. New User Registration
   ├─ POST /api/auth/register
   ├─ Email sent with verification link
   ├─ Password hashed in database
   ├─ Role defaults to "customer"
   ├─ JWT token returned
   └─ ✅ VERIFY: Check email, DB password hash

2. Email Verification
   ├─ User clicks email link
   ├─ POST /api/auth/verify-email
   ├─ Email marked as verified
   ├─ Token cleared from database
   └─ ✅ VERIFY: Check isEmailVerified flag

3. User Login
   ├─ POST /api/auth/login
   ├─ Password verified (compared with hash)
   ├─ New JWT token generated
   └─ ✅ VERIFY: Check token format and decode

4. Access Protected Route
   ├─ GET /api/test/protected
   ├─ Authorization: Bearer <token>
   ├─ Token verified
   ├─ User info extracted
   └─ ✅ VERIFY: Check 200 OK response

5. Unauthorized Access
   ├─ GET /api/test/admin (as customer)
   ├─ Role check fails
   ├─ 403 Forbidden returned
   └─ ✅ VERIFY: Check error message

6. Password Reset Flow
   ├─ POST /api/auth/request-reset
   ├─ Email sent with reset link
   ├─ Token stored (hashed)
   ├─ POST /api/auth/reset-password
   ├─ New password hashed
   ├─ Old token cleared
   └─ ✅ VERIFY: Check token cleared, password changed

7. OTP Login Flow
   ├─ POST /api/auth/request-otp
   ├─ OTP sent via email (hashed in DB)
   ├─ POST /api/auth/verify-otp
   ├─ OTP verified
   ├─ JWT token returned
   ├─ OTP cleared from database
   └─ ✅ VERIFY: Check OTP hash, single-use
```

---

## ✅ Final Verification Checklist

```
PASSWORD HASHING
☐ Password not returned in any response
☐ Password hashed in database ($2a$10$ format)
☐ Wrong password login fails
☐ Correct password login succeeds

JWT TOKENS
☐ Login returns JWT token
☐ Token format valid (3 parts with dots)
☐ Token includes id and role
☐ Token expires after configured time
☐ Protected routes require token
☐ Invalid token rejected (401)
☐ No token rejected (401)

ROLE-BASED ACCESS CONTROL
☐ Default role is "customer"
☐ Role can be specified during registration
☐ Customer cannot access admin route (403)
☐ Admin can access admin route (200)
☐ Multiple roles supported
☐ Clear 403 error for insufficient permissions

EMAIL TOKENS
☐ Verification token hashed in database
☐ Verification email sent with token
☐ Token expires after 24 hours
☐ Token cleared after verification
☐ Cannot reuse expired token
☐ Email marked as verified after verification

OTP
☐ OTP is 6 random digits
☐ OTP hashed in database
☐ OTP email sent
☐ OTP expires after 10 minutes
☐ Cannot use expired OTP
☐ OTP cleared after verification
☐ JWT returned after OTP verification
☐ Cannot reuse same OTP

PASSWORD RESET
☐ Reset token hashed in database
☐ Reset email sent with token
☐ Token expires after 1 hour
☐ Cannot use expired token
☐ New password hashed correctly
☐ Token cleared after reset
☐ Can login with new password

ERROR HANDLING
☐ 400 for validation errors
☐ 401 for auth failures
☐ 403 for insufficient permissions
☐ 404 for missing users
☐ Error messages are clear
☐ Sensitive info not leaked

DATABASE
☐ Email unique index enforced
☐ Phone unique index enforced
☐ No plain text passwords
☐ No plain text tokens
☐ Expiration fields work correctly
☐ Fields cleared after use
```

---

## 📊 Test Report Template

```
DATE: May 16, 2026
TESTER: [Your Name]
PROJECT: Cheezka MERN - Phase 2 Auth

SUMMARY:
Total Tests: 30+
Passed: __/30
Failed: __/30
Status: ☐ PASS / ☐ FAIL / ☐ PARTIAL

ISSUES FOUND:
1. [Description]
2. [Description]
3. [Description]

NOTES:
- [Any additional notes]
- [Configuration notes]
- [Environment details]

SIGNED OFF: _____________  DATE: _______
```

---

## 🎯 Go/No-Go Criteria

```
✅ GO if:
   • All 30+ tests pass
   • No critical failures
   • All data properly hashed
   • RBAC working correctly
   • Email system functioning
   • No security issues found

❌ NO-GO if:
   • Any test fails
   • Password stored in plain text
   • Tokens not hashed
   • RBAC not enforced
   • Email system not working
   • Sensitive data exposed
```

---

**Verification Date**: May 16, 2026  
**Status**: Ready for Complete Testing  
**Next Step**: Execute all verification tests using POSTMAN_TESTING.md

