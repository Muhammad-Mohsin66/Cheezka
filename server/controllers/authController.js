const User = require('../models/User');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');
const Rider = require('../models/Rider');
const OTPReset = require('../models/OTPReset');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOTPEmail,
} = require('../config/email');
const crypto = require('crypto');

// Helper to set cookie based on role
const setTokenCookie = (res, token, role) => {
  const cookieName = role === 'customer' ? 'customer_token' : 'staff_token';
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
  res.cookie(cookieName, token, options);
};

const findUserByEmail = async (email) => {
  const norm = email.toLowerCase().trim();
  return await User.findOne({ email: norm }) ||
         await Customer.findOne({ email: norm }) ||
         await Employee.findOne({ email: norm }) ||
         await Rider.findOne({ email: norm });
};

const findUserByEmailWithPassword = async (email) => {
  const norm = email.toLowerCase().trim();
  return await User.findOne({ email: norm }).select('+password') ||
         await Customer.findOne({ email: norm }).select('+password') ||
         await Employee.findOne({ email: norm }).select('+password') ||
         await Rider.findOne({ email: norm }).select('+password');
};

const findUserByVerificationToken = async (hashedToken) => {
  const query = {
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() }
  };
  return await User.findOne(query) ||
         await Customer.findOne(query) ||
         await Employee.findOne(query) ||
         await Rider.findOne(query);
};

const findUserByResetToken = async (hashedToken) => {
  const query = {
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  };
  return await User.findOne(query) ||
         await Customer.findOne(query) ||
         await Employee.findOne(query) ||
         await Rider.findOne(query);
};

const findUserByOTP = async (email, hashedOTP) => {
  const query = {
    email,
    otpCode: hashedOTP,
    otpExpire: { $gt: Date.now() }
  };
  return await User.findOne(query) ||
         await Customer.findOne(query) ||
         await Employee.findOne(query) ||
         await Rider.findOne(query);
};

/**
 * Register a new user
 * POST /api/auth/register
 */
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return next(new AppError('Please provide all required fields', 400));
    }

    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters', 400));
    }

    // Check if user already exists
    let user = await findUserByEmail(email) ||
               (phone ? await User.findOne({ phone }) || await Customer.findOne({ phone }) || await Employee.findOne({ phone }) || await Rider.findOne({ phone }) : null);

    if (user) {
      return next(new AppError('User with this email or phone already exists', 400));
    }

    // Create user in Customer collection (storefront signups are always customers)
    user = await Customer.create({
      name,
      email,
      phone,
      password,
      role: 'customer',
    });

    // Check dynamic setting for email verification
    const SystemSetting = require('../models/SystemSetting');
    const emailVerifSetting = await SystemSetting.findOne({ key: 'EMAIL_VERIFICATION_REQUIRED' });
    // Default to false based on seed config
    const requireVerification = emailVerifSetting ? (emailVerifSetting.value === true || emailVerifSetting.value === 'true') : false;

    if (requireVerification) {
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
      user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      // Send verification email
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      await sendVerificationEmail(email, verificationToken, baseUrl);
    } else {
      user.isEmailVerified = true;
    }

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);
    setTokenCookie(res, token, user.role);

    res.status(201).json({
      success: true,
      message: requireVerification 
        ? 'User registered successfully. Please verify your email.' 
        : 'User registered successfully.',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Get user with password field from correct collection
    const user = await findUserByEmailWithPassword(email);

    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('Your account is inactive', 403));
    }

    // Compare password
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);
    setTokenCookie(res, token, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email
 * POST /api/auth/verify-email
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new AppError('Verification token is required', 400));
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token
    const user = await findUserByVerificationToken(hashedToken);

    if (!user) {
      return next(new AppError('Invalid or expired verification token', 400));
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * POST /api/auth/request-reset
 */
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    // Send reset email
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    await sendPasswordResetEmail(email, resetToken, baseUrl);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return next(new AppError('Token and new password are required', 400));
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await findUserByResetToken(hashedToken);

    if (!user) {
      return next(new AppError('Invalid or expired reset token', 400));
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request OTP
 * POST /api/auth/request-otp
 */
exports.requestOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!user.isActive) {
      return next(new AppError('Your account is inactive', 403));
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send OTP via email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new AppError('Email and OTP are required', 400));
    }

    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Find user with valid OTP
    const user = await findUserByOTP(email, hashedOTP);

    if (!user) {
      return next(new AppError('Invalid or expired OTP', 400));
    }

    // Clear OTP
    user.otpCode = undefined;
    user.otpExpire = undefined;

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);
    setTokenCookie(res, token, user.role);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to compute salted SHA256 hash of an OTP
 */
const hashOtp = (otp, salt) => {
  const payload = `${salt}:${otp}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * Request OTP Password Reset Session
 * POST /api/auth/reset-request
 */
exports.resetRequest = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide an email address.', 400));
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return next(new AppError('Email address not found.', 404));
    }

    if (!user.isActive) {
      return next(new AppError('Your account is inactive.', 403));
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const requestId = crypto.randomBytes(24).toString('base64url');
    const salt = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    await OTPReset.create({
      requestId,
      email: normalizedEmail,
      otpHash: hashOtp(otp, salt),
      otpSalt: salt,
      expiresAt,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[OTP Reset Debug] Generated OTP for ${normalizedEmail}: ${otp}`);
    }

    await sendOTPEmail(normalizedEmail, otp);

    res.status(200).json({
      success: true,
      requestId,
      expiresAt: Math.floor(expiresAt.getTime() / 1000),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP code in Password Reset Session
 * POST /api/auth/reset-verify
 */
exports.resetVerify = async (req, res, next) => {
  try {
    const { requestId, otp } = req.body;

    if (!requestId || !otp) {
      return next(new AppError('Request ID and OTP code are required.', 400));
    }

    const record = await OTPReset.findOne({ requestId });
    if (!record) {
      return next(new AppError('Invalid reset session.', 400));
    }

    if (new Date() > record.expiresAt) {
      await OTPReset.deleteOne({ requestId });
      return next(new AppError('OTP code has expired.', 400));
    }

    if (record.attempts >= 5) {
      await OTPReset.deleteOne({ requestId });
      return next(new AppError('Too many failed attempts. Session locked.', 400));
    }

    const inputHash = hashOtp(otp.trim(), record.otpSalt);
    const bufferA = Buffer.from(inputHash, 'hex');
    const bufferB = Buffer.from(record.otpHash, 'hex');

    const isCorrect = (bufferA.length === bufferB.length) && crypto.timingSafeEqual(bufferA, bufferB);

    if (!isCorrect) {
      record.attempts += 1;
      await record.save();

      if (record.attempts >= 5) {
        await OTPReset.deleteOne({ requestId });
        return next(new AppError('Too many failed attempts. Session locked.', 400));
      }

      return next(new AppError('Invalid OTP code.', 400));
    }

    record.verified = true;
    await record.save();

    res.status(200).json({
      success: true,
      verified: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete Reset & Change Password
 * POST /api/auth/reset-complete
 */
exports.resetComplete = async (req, res, next) => {
  try {
    const { requestId, newPassword } = req.body;

    if (!requestId || !newPassword) {
      return next(new AppError('Request ID and new password are required.', 400));
    }

    if (newPassword.length < 8) {
      return next(new AppError('Password must be at least 8 characters.', 400));
    }

    const record = await OTPReset.findOne({ requestId });
    if (!record || !record.verified) {
      return next(new AppError('Invalid or unverified reset session.', 400));
    }

    const user = await findUserByEmail(record.email);
    if (!user) {
      return next(new AppError('User profile not found.', 404));
    }

    user.password = newPassword;
    await user.save();

    await OTPReset.deleteOne({ requestId });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user by clearing cookies
 * POST /api/auth/logout
 */
exports.logout = (req, res) => {
  const isStaffRoute = req.headers['x-session-type'] === 'staff';
  const cookieName = isStaffRoute ? 'staff_token' : 'customer_token';
  
  res.cookie(cookieName, 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
