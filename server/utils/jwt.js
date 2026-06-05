const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user authentication
 * @param {string} userId - User ID from database
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );
  } catch (error) {
    return null;
  }
};

/**
 * Decode JWT token without verification (useful for debugging)
 * @param {string} token - JWT token to decode
 * @returns {object} Decoded token payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
