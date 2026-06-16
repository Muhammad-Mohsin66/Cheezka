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

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('combined'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Global error handler (must be last)
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
