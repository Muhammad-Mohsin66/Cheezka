const User = require('../models/User');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');
const Rider = require('../models/Rider');
const AppError = require('../utils/AppError');
const { generateToken } = require('../utils/jwt');
const { createAuditEntry } = require('./auditLogController');
const bcrypt = require('bcryptjs');

const getModelByRole = (role) => {
  switch (role) {
    case 'admin':
      return User;
    case 'customer':
      return Customer;
    case 'employee':
      return Employee;
    case 'rider':
      return Rider;
    default:
      return User;
  }
};

/**
 * GET /api/users
 * List all users (admin only). Supports ?role=&search=&page=&limit=
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    let users = [];
    let total = 0;

    if (role) {
      const Model = getModelByRole(role);
      const skip = (parseInt(page) - 1) * parseInt(limit);
      [users, total] = await Promise.all([
        Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        Model.countDocuments(filter),
      ]);
    } else {
      // Query all collections
      const [admins, employees, riders, customers] = await Promise.all([
        User.find(filter),
        Employee.find(filter),
        Rider.find(filter),
        Customer.find(filter),
      ]);
      const all = [...admins, ...employees, ...riders, ...customers];
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      total = all.length;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      users = all.slice(skip, skip + parseInt(limit));
    }

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
    const user = await User.findById(req.params.id) ||
                 await Customer.findById(req.params.id) ||
                 await Employee.findById(req.params.id) ||
                 await Rider.findById(req.params.id);
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

    const allowedRoles = ['admin', 'employee', 'rider', 'customer'];
    if (!allowedRoles.includes(role)) {
      return next(new AppError(`Role must be one of: ${allowedRoles.join(', ')}`, 400));
    }

    // Check if user already exists in ANY collection
    const existing = await User.findOne({ $or: [{ email }, { phone }] }) ||
                     await Customer.findOne({ $or: [{ email }, { phone }] }) ||
                     await Employee.findOne({ $or: [{ email }, { phone }] }) ||
                     await Rider.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return next(new AppError('User with this email or phone already exists', 400));
    }

    const Model = getModelByRole(role);
    const user = await Model.create({ name, email, phone, password, role, isEmailVerified: true });
    const token = generateToken(user._id, user.role);

    await createAuditEntry(req, 'create', 'User', user._id, user.email);

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
    
    // Find where user is
    let user = await User.findById(req.params.id);
    let Model = User;
    if (!user) { user = await Customer.findById(req.params.id); Model = Customer; }
    if (!user) { user = await Employee.findById(req.params.id); Model = Employee; }
    if (!user) { user = await Rider.findById(req.params.id); Model = Rider; }
    
    if (!user) return next(new AppError('User not found', 404));

    // Check if role changed
    if (role && role !== user.role) {
      const allowedRoles = ['admin', 'employee', 'rider', 'customer'];
      if (!allowedRoles.includes(role)) {
        return next(new AppError(`Invalid role: ${role}`, 400));
      }
      
      // Delete from old collection, write to new collection
      const userData = user.toObject();
      userData.role = role;
      
      if (name) userData.name = name.trim();
      if (email) userData.email = email.toLowerCase().trim();
      if (phone) userData.phone = phone.trim();
      if (isActive !== undefined) userData.isActive = isActive;
      
      // Remove old doc
      await Model.findByIdAndDelete(user._id);
      
      // Create new doc with same ID
      const NewModel = getModelByRole(role);
      user = await NewModel.create(userData);
    } else {
      if (name) user.name = name.trim();
      if (email) user.email = email.toLowerCase().trim();
      if (phone) user.phone = phone.trim();
      if (isActive !== undefined) user.isActive = isActive;
      await user.save();
    }

    await createAuditEntry(req, 'update', 'User', user._id, user.email);

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

    let user = await User.findById(req.params.id).select('+password') ||
               await Customer.findById(req.params.id).select('+password') ||
               await Employee.findById(req.params.id).select('+password') ||
               await Rider.findById(req.params.id).select('+password');
    if (!user) return next(new AppError('User not found', 404));

    user.password = newPassword;
    await user.save();

    await createAuditEntry(req, 'update', 'User', user._id, `${user.email} (Password Reset)`);

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
    let user = await User.findById(req.params.id) ||
               await Customer.findById(req.params.id) ||
               await Employee.findById(req.params.id) ||
               await Rider.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    // Prevent admin from deactivating their own account
    if (user._id.toString() === req.user.id) {
      return next(new AppError('You cannot deactivate your own account', 400));
    }

    user.isActive = !user.isActive;
    await user.save();

    await createAuditEntry(req, 'update', 'User', user._id, `${user.email} (${user.isActive ? 'Activated' : 'Deactivated'})`);

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
    let user = await User.findById(req.params.id) ||
               await Customer.findById(req.params.id) ||
               await Employee.findById(req.params.id) ||
               await Rider.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    if (user._id.toString() === req.user.id) {
      return next(new AppError('You cannot delete your own account', 400));
    }

    user.isActive = false;
    await user.save();

    await createAuditEntry(req, 'delete', 'User', user._id, user.email);

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
    const [adminCount, employeeCount, riderCount, customerCount] = await Promise.all([
      User.countDocuments({}),
      Employee.countDocuments({}),
      Rider.countDocuments({}),
      Customer.countDocuments({}),
    ]);

    const [adminActive, employeeActive, riderActive, customerActive] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Employee.countDocuments({ isActive: true }),
      Rider.countDocuments({ isActive: true }),
      Customer.countDocuments({ isActive: true }),
    ]);

    const stats = [
      { _id: 'admin', count: adminCount, active: adminActive },
      { _id: 'employee', count: employeeCount, active: employeeActive },
      { _id: 'rider', count: riderCount, active: riderActive },
      { _id: 'customer', count: customerCount, active: customerActive },
    ];

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
