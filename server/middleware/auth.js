const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

/**
 * Middleware to protect routes - verify JWT token
 * Attaches user info to req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from headers or cookies (prioritize headers for tab isolation)
    const isStaffRoute = req.headers['x-session-type'] === 'staff';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (!isStaffRoute && req.cookies && req.cookies.customer_token) {
      token = req.cookies.customer_token;
    }

    if (!token) {
      return next(new AppError('No authentication token provided', 401));
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return next(new AppError('Invalid or expired token', 401));
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Authentication error', 401));
  }
};

/**
 * Middleware to authorize users by role
 * Usage: authorizeRoles('admin', 'employee')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `User role "${req.user.role}" is not authorized to access this resource`,
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};
