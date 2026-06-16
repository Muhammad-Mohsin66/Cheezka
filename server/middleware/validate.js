const AppError = require('../utils/AppError');

/**
 * Middleware to validate user registration inputs
 */
const validateRegister = (req, res, next) => {
  const { name, email, phone, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return next(new AppError('Valid name is required', 400));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return next(new AppError('Valid email address is required', 400));
  }

  const phoneRegex = /^\d{11}$/;
  if (!phone || !phoneRegex.test(phone)) {
    return next(new AppError('Phone number must be a valid 11-digit number', 400));
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return next(new AppError('Password must be at least 8 characters long', 400));
  }

  next();
};

/**
 * Middleware to validate user login inputs
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return next(new AppError('Valid email address is required', 400));
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return next(new AppError('Password must be at least 8 characters long', 400));
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
};
