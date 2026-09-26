const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const db = require('../config/db');
const { ApiError, asyncHandler } = require('../middleware/errorMiddleware');

const SALT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 10;

const checkValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg);
  }
};

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.created_at,
});

const getMailTransport = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

/**
 * POST /api/auth/signup
 */
const signup = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { name, email, password, role } = req.body;

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash, role || 'warehouse_staff']
  );

  const user = result.rows[0];
  const token = signToken(user);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { user: sanitizeUser(user), token },
  });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { email, password } = req.body;

  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user: sanitizeUser(user), token },
  });
});

/**
 * POST /api/auth/forgot-password
 * Generates a 6-digit OTP, stores its hash, and emails it to the user.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { email } = req.body;

  const userResult = await db.query('SELECT id, name FROM users WHERE email = $1', [email]);

  // Always respond the same way whether or not the account exists,
  // to avoid leaking which emails are registered.
  if (userResult.rows.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, an OTP has been sent',
    });
  }

  const user = userResult.rows[0];
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.query(
    `INSERT INTO password_resets (user_id, otp_hash, expires_at, used)
     VALUES ($1, $2, $3, false)`,
    [user.id, otpHash, expiresAt]
  );

  try {
    const transporter = getMailTransport();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'StockSense - Password Reset OTP',
      text: `Hi ${user.name}, your OTP for resetting your StockSense password is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes. If you did not request this, you can ignore this email.`,
    });
  } catch (err) {
    // Email delivery failure shouldn't reveal internal errors to the client,
    // but it also shouldn't silently pretend to succeed for debugging purposes.
    // eslint-disable-next-line no-console
    console.error('Failed to send OTP email:', err.message);
  }

  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, an OTP has been sent',
  });
});

/**
 * POST /api/auth/verify-otp
 */
const verifyOtp = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { email, otp } = req.body;

  const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (userResult.rows.length === 0) {
    throw new ApiError(400, 'Invalid OTP or email');
  }
  const userId = userResult.rows[0].id;

  const resetResult = await db.query(
    `SELECT * FROM password_resets
     WHERE user_id = $1 AND used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (resetResult.rows.length === 0) {
    throw new ApiError(400, 'OTP is invalid or has expired');
  }

  const resetRow = resetResult.rows[0];
  const isMatch = await bcrypt.compare(otp, resetRow.otp_hash);
  if (!isMatch) {
    throw new ApiError(400, 'OTP is invalid or has expired');
  }

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
  });
});

/**
 * POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  checkValidation(req);
  const { email, otp, newPassword } = req.body;

  const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (userResult.rows.length === 0) {
    throw new ApiError(400, 'Invalid OTP or email');
  }
  const userId = userResult.rows[0].id;

  const resetResult = await db.query(
    `SELECT * FROM password_resets
     WHERE user_id = $1 AND used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (resetResult.rows.length === 0) {
    throw new ApiError(400, 'OTP is invalid or has expired');
  }

  const resetRow = resetResult.rows[0];
  const isMatch = await bcrypt.compare(otp, resetRow.otp_hash);
  if (!isMatch) {
    throw new ApiError(400, 'OTP is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      passwordHash,
      userId,
    ]);
    await client.query('UPDATE password_resets SET used = true WHERE id = $1', [resetRow.id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully',
  });
});

/**
 * GET /api/auth/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Profile fetched successfully',
    data: { user: req.user },
  });
});

/**
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    throw new ApiError(400, 'Name is required');
  }

  const result = await db.query(
    `UPDATE users SET name = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, email, role, created_at`,
    [name.trim(), req.user.id]
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: sanitizeUser(result.rows[0]) },
  });
});

/**
 * POST /api/auth/logout
 * JWTs are stateless, so logout is handled client-side by discarding
 * the token. This endpoint exists so the frontend has a clear,
 * documented action to call when a user logs out.
 */
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = {
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getProfile,
  updateProfile,
  logout,
};
