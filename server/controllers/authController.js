const User = require('../models/User');
const OTPReset = require('../models/OTPReset');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOTPEmail,
} = require('../config/email');
const crypto = require('crypto');

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
    let user = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (user) {
      return next(
        new AppError(
          'User with this email or phone already exists',
          400
        )
      );
    }

    // Create user
    user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'customer',
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    // Send verification email
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    await sendVerificationEmail(email, verificationToken, baseUrl);

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
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

    // Get user with password field
    const user = await User.findOne({ email }).select('+password');

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

    // Hash the token to match with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

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

    const user = await User.findOne({ email });

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

    // Hash the token to match with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

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

    const user = await User.findOne({ email });

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

    // Hash the OTP to match with stored OTP
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Find user with valid OTP
    const user = await User.findOne({
      email,
      otpCode: hashedOTP,
      otpExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Invalid or expired OTP', 400));
    }

    // Clear OTP
    user.otpCode = undefined;
    user.otpExpire = undefined;

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

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
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Username enumeration protection or direct return: let's match the guide's standard
      return next(new AppError('Email address not found.', 404));
    }

    if (!user.isActive) {
      return next(new AppError('Your account is inactive.', 403));
    }

    // Generate secure 6-digit OTP code & requestId & random salt
    const otp = crypto.randomInt(100000, 1000000).toString();
    const requestId = crypto.randomBytes(24).toString('base64url');
    const salt = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    // Save reset record
    await OTPReset.create({
      requestId,
      email: normalizedEmail,
      otpHash: hashOtp(otp, salt),
      otpSalt: salt,
      expiresAt,
    });

    // In development mode, log the generated OTP code to enable testing without working SMTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OTP Reset Debug] Generated OTP for ${normalizedEmail}: ${otp}`);
    }

    // Send OTP email
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

    // Check expiry
    if (new Date() > record.expiresAt) {
      await OTPReset.deleteOne({ requestId });
      return next(new AppError('OTP code has expired.', 400));
    }

    // Check attempt threshold limit (max 5)
    if (record.attempts >= 5) {
      await OTPReset.deleteOne({ requestId });
      return next(new AppError('Too many failed attempts. Session locked.', 400));
    }

    // Hash the input OTP and run timing-attack-resistant compare_digest
    const inputHash = hashOtp(otp.trim(), record.otpSalt);
    const bufferA = Buffer.from(inputHash, 'hex');
    const bufferB = Buffer.from(record.otpHash, 'hex');

    const isCorrect = (bufferA.length === bufferB.length) && crypto.timingSafeEqual(bufferA, bufferB);

    if (!isCorrect) {
      // Increment attempt counter on failure
      record.attempts += 1;
      await record.save();

      // If they hit max attempts now, clean up immediately
      if (record.attempts >= 5) {
        await OTPReset.deleteOne({ requestId });
        return next(new AppError('Too many failed attempts. Session locked.', 400));
      }

      return next(new AppError('Invalid OTP code.', 400));
    }

    // Mark as verified
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

    const user = await User.findOne({ email: record.email });
    if (!user) {
      return next(new AppError('User profile not found.', 404));
    }

    // Update password (mongoose pre-save handles bcrypt hashing)
    user.password = newPassword;
    await user.save();

    // Immediately remove reset record to prevent replay attacks
    await OTPReset.deleteOne({ requestId });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
