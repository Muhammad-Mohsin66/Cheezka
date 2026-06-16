require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const { globalErrorHandler } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/test');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const bankAccountRoutes = require('./routes/bankAccounts');
const refundRoutes = require('./routes/refunds');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
// Admin panel routes
const usersRoutes = require('./routes/users');
const dealsRoutes = require('./routes/deals');
const deliveryZonesRoutes = require('./routes/deliveryZones');
const inventoryRoutes = require('./routes/inventory');
const auditLogsRoutes = require('./routes/auditLogs');
const settingsRoutes = require('./routes/settings');
const uploadRoutes = require('./routes/upload');

const app = express();

// Trust proxy for secure cookies and rate limiting behind reverse proxies (Nginx, AWS, Heroku)
app.set('trust proxy', 1);

// Sentry Request Handler (must be the first middleware)
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  app.use(Sentry.Handlers.requestHandler());
}

// Connect to MongoDB
connectDB();

// Rate limiting for auth and sensitive endpoints to prevent brute-force attacks
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth/reset requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
const helmet = require('helmet');
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.CLIENT_URL || '').split(',').map(url => url.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Sanitize user-supplied data to prevent MongoDB Operator Injection / NoSQL Injection
// Uses custom recursion for Express 5 compatibility (where req.query is read-only)
const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
};

app.use((req, res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);
  next();
});
const logger = require('./utils/logger');
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply rate limiter specifically to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/request-otp', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/request-reset', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/reset-request', authLimiter);
app.use('/api/auth/reset-verify', authLimiter);
app.use('/api/auth/reset-complete', authLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
// Admin panel routes
app.use('/api/users', usersRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/delivery-zones', deliveryZonesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

// Health check root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Cheezka API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Sentry Error Handler (must run before other error handlers)
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  app.use(Sentry.Handlers.errorHandler());
}

// Global error handler (must be last)
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
