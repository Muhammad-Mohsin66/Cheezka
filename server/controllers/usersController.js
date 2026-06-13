const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

/**
 * GET /api/users
 * List all users (admin only). Supports ?role=&search=&page=&limit=
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Get single user by ID
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 * Create a new internal user (admin/employee/rider) — admin only
 */
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return next(new AppError('Please provide all required fields', 400));
    }

    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters', 400));
    }

    const allowedRoles = ['admin', 'employee', 'rider'];
    if (!allowedRoles.includes(role)) {
      return next(new AppError(`Role must be one of: ${allowedRoles.join(', ')}`, 400));
    }

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return next(new AppError('User with this email or phone already exists', 400));
    }

    const user = await User.create({ name, email, phone, password, role, isEmailVerified: true });
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id
 * Update user details (admin only)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, phone, role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (phone) user.phone = phone.trim();
    if (role) {
      const allowedRoles = ['admin', 'employee', 'rider', 'customer'];
      if (!allowedRoles.includes(role)) {
        return next(new AppError(`Invalid role: ${role}`, 400));
      }
      user.role = role;
    }
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/password
 * Reset a user's password (admin only)
 */
exports.resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return next(new AppError('Password must be at least 8 characters', 400));
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return next(new AppError('User not found', 404));

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/toggle
 * Activate / deactivate a user account (admin only)
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    // Prevent admin from deactivating their own account
    if (user._id.toString() === req.user.id) {
      return next(new AppError('You cannot deactivate your own account', 400));
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 * Soft-delete user (set isActive = false) — admin only
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    if (user._id.toString() === req.user.id) {
      return next(new AppError('You cannot delete your own account', 400));
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/stats
 * User count by role (admin only)
 */
exports.getUserStats = async (req, res, next) => {
  try {
    const stats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
