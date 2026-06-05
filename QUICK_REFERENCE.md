# Phase 2 Authentication - Quick Reference Card

## 🚀 Start Server
```bash
cd server
npm run dev
```

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `models/User.js` | User schema with bcrypt |
| `controllers/authController.js` | 7 auth methods |
| `routes/auth.js` | API endpoints |
| `middleware/auth.js` | JWT + RBAC |
| `config/email.js` | Email sending |
| `utils/jwt.js` | Token generation |

---

## 📡 Endpoints

```
POST   /api/auth/register          Register user
POST   /api/auth/login             Login user
POST   /api/auth/verify-email      Verify email
POST   /api/auth/request-reset     Request password reset
POST   /api/auth/reset-password    Reset password
POST   /api/auth/request-otp       Request OTP
POST   /api/auth/verify-otp        Verify OTP
GET    /api/auth/me                Get current user (protected)
GET    /api/auth/users             Get all users (admin only)
```

---

## 🔐 Protect Routes

```javascript
// Basic protection
router.get('/route', protect, controller);

// With RBAC
router.delete('/route', protect, authorizeRoles('admin'), controller);

// Multiple roles
router.get('/route', protect, authorizeRoles('admin', 'employee'), controller);
```

---

## 📝 Sample Requests

**Register:**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "SecurePass123",
  "role": "customer"
}
```

**Login:**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Protected Request:**
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

---

## 🌍 Environment Variables

```
MONGODB_URI=mongodb://localhost:27017/cheezka
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
CLIENT_URL=http://localhost:3000
```

---

## 👥 User Roles

- **admin** - Full system access
- **employee** - Order management
- **rider** - Delivery operations
- **customer** - Place orders (default)

---

## 📊 Response Format

**Success:**
```json
{
  "success": true,
  "message": "...",
  "token": "...",
  "user": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## ⏱️ Token Expirations

- **JWT Token**: 7 days (configurable)
- **Email Verification**: 24 hours
- **Password Reset**: 1 hour
- **OTP**: 10 minutes

---

## 🧪 Quick Test

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","phone":"1234567890","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'

# Me (use token from login response)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Access User Info in Controller

```javascript
exports.someController = async (req, res, next) => {
  const userId = req.user.id;     // User ID
  const userRole = req.user.role; // User role
  
  // Use in logic
};
```

---

## 📧 Gmail Setup (One-Time)

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the 16-character password
4. Paste in `.env` as `EMAIL_PASSWORD`

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Email not sending | Check Gmail App Password |
| Token expired | Check JWT_EXPIRE value |
| 401 Unauthorized | Verify token in Authorization header |
| 403 Forbidden | User doesn't have required role |
| Duplicate email error | Email already registered |

---

## 📚 Documentation

- **Full Guide**: `AUTH_SETUP.md`
- **Testing**: `TESTING_GUIDE.md`
- **Checklist**: `PHASE2_CHECKLIST.md`
- **Summary**: `PHASE2_SUMMARY.md`

---

## ✨ Features

✅ JWT Authentication
✅ Password Hashing (bcrypt)
✅ Email Verification
✅ Password Reset
✅ OTP Login
✅ Role-Based Access Control
✅ Error Handling
✅ Input Validation

---

Last Updated: May 16, 2026
