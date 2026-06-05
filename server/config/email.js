const nodemailer = require('nodemailer');

/**
 * Create email transporter for sending emails via Gmail
 * Configure environment variables:
 * - GMAIL_EMAIL: Your Gmail address
 * - GMAIL_PASSWORD: Your Gmail app password (not regular password)
 * For Gmail, use App Passwords: https://myaccount.google.com/apppasswords
 */
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true' ? true : false,
    auth: {
      user: process.env.EMAIL_USER || process.env.GMAIL_EMAIL,
      pass: process.env.EMAIL_PASSWORD || process.env.GMAIL_PASSWORD,
    },
  });
};

/**
 * Send email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 * @returns {Promise} Email sending result
 */
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.GMAIL_EMAIL,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send verification email
 * @param {string} email - User email
 * @param {string} token - Verification token
 * @param {string} baseUrl - Base URL for verification link
 */
const sendVerificationEmail = async (email, token, baseUrl) => {
  const verificationLink = `${baseUrl}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Email Verification</h2>
      <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
      <p>
        <a href="${verificationLink}" style="
          display: inline-block;
          padding: 10px 20px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
        ">Verify Email</a>
      </p>
      <p>Or paste this link in your browser:</p>
      <p style="word-break: break-all;">${verificationLink}</p>
      <p style="color: #999; font-size: 12px;">This link will expire in 24 hours.</p>
    </div>
  `;

  return sendEmail(email, 'Email Verification - Cheezka', html);
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} token - Reset token
 * @param {string} baseUrl - Base URL for reset link
 */
const sendPasswordResetEmail = async (email, token, baseUrl) => {
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>We received a request to reset your password. Click the link below to create a new password.</p>
      <p>
        <a href="${resetLink}" style="
          display: inline-block;
          padding: 10px 20px;
          background-color: #2196F3;
          color: white;
          text-decoration: none;
          border-radius: 5px;
        ">Reset Password</a>
      </p>
      <p>Or paste this link in your browser:</p>
      <p style="word-break: break-all;">${resetLink}</p>
      <p style="color: #999; font-size: 12px;">This link will expire in 1 hour.</p>
      <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
    </div>
  `;

  return sendEmail(email, 'Password Reset - Cheezka', html);
};

/**
 * Send OTP email
 * @param {string} email - User email
 * @param {string} otp - One-time password
 */
const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Your OTP Code</h2>
      <p>Your one-time password for Cheezka is:</p>
      <p style="
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 5px;
        background-color: #f0f0f0;
        padding: 15px;
        text-align: center;
        border-radius: 5px;
      ">${otp}</p>
      <p style="color: #999; font-size: 12px;">This OTP will expire in 10 minutes.</p>
      <p style="color: #999; font-size: 12px;">Never share this code with anyone.</p>
    </div>
  `;

  return sendEmail(email, 'Your OTP Code - Cheezka', html);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOTPEmail,
};
