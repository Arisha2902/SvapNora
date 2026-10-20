'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { wrapHandlers } = require('../utils/asyncHandler');
const { signToken, setAuthCookie, clearAuthCookie } = require('../services/tokenService');
const emailService = require('../services/emailService');
const auditService = require('../services/auditService');
const { COOKIE_NAMES } = require('../config/env');
const logger = require('../utils/logger');

/** Used to equalise response time when an account does not exist. */
const DUMMY_HASH = bcrypt.hashSync('kinetic-timing-equalizer-2026', 10);

const GENERIC = 'Invalid credentials';
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

function issueSession(res, user, role) {
  const token = signToken(user, role);
  setAuthCookie(res, role, token);
  return token;
}

/**
 * One login implementation for all three portals.
 * The role is compared against the stored user first, so an employee account used
 * on the admin endpoint fails exactly like a wrong password would.
 */
async function loginFor(req, res, role) {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || user.role !== role) {
    await bcrypt.compare(password, DUMMY_HASH).catch(() => false);
    throw ApiError.unauthorized(GENERIC);
  }

  if (user.isLocked) {
    throw ApiError.forbidden(
      `Account locked after ${MAX_FAILED} failed attempts. Try again in ${LOCK_MINUTES} minutes.`,
      { code: 'ACCOUNT_LOCKED' },
    );
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    const lockedNow = user.registerFailedLogin(MAX_FAILED, LOCK_MINUTES);
    await user
      .save()
      .catch((err) => logger.error(`Failed login counter not saved: ${err.message}`));
    if (lockedNow) {
      throw ApiError.forbidden(
        `Account locked after ${MAX_FAILED} failed attempts. Try again in ${LOCK_MINUTES} minutes.`,
        { code: 'ACCOUNT_LOCKED' },
      );
    }
    throw ApiError.unauthorized(GENERIC);
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact the KINETIC team.', {
      code: 'ACCOUNT_DISABLED',
    });
  }

  user.clearFailedLogins();
  user.lastLoginAt = new Date();
  await user.save();

  issueSession(res, user, role);
  auditService.record({
    req,
    actor: user,
    action: 'login',
    entity: 'auth',
    entityId: user._id,
    summary: `${role} signed in`,
  });

  return res.status(200).json({
    success: true,
    data: { user: user.publicProfile(), mustChangePassword: user.mustChangePassword },
    message: 'Signed in successfully',
  });
}

const adminLogin = (req, res) => loginFor(req, res, 'admin');
const employeeLogin = (req, res) => loginFor(req, res, 'employee');
const customerLogin = (req, res) => loginFor(req, res, 'customer');

async function logout(req, res) {
  const role = req.role || req.params.role;
  if (role && COOKIE_NAMES[role]) clearAuthCookie(res, role);
  if (req.user) {
    auditService.record({
      req,
      actor: req.user,
      action: 'logout',
      entity: 'auth',
      entityId: req.user._id,
      summary: `${req.user.role} signed out`,
    });
  }
  return res.status(200).json({ success: true, data: null, message: 'Signed out successfully' });
}

async function me(req, res) {
  return res.status(200).json({
    success: true,
    data: { user: req.user.publicProfile(), mustChangePassword: req.user.mustChangePassword },
    message: 'Session is valid',
  });
}

/** Customers self-register. Employees never can — only an admin creates them. */
async function registerCustomer(req, res) {
  const { name, email, password, phone, companyName } = req.body;

  const existing = await User.findOne({ email }).select('_id');
  if (existing) {
    throw ApiError.conflict('An account with this email already exists', { code: 'EMAIL_TAKEN' });
  }

  const user = new User({
    name,
    email,
    phone,
    companyName,
    role: 'customer',
    isActive: true,
    mustChangePassword: false,
  });
  await user.hashPassword(password);
  await user.save();

  issueSession(res, user, 'customer');
  auditService.record({
    req,
    actor: user,
    action: 'create',
    entity: 'customer',
    entityId: user._id,
    summary: `Self-registration: ${email}`,
  });

  return res.status(201).json({
    success: true,
    data: { user: user.publicProfile(), mustChangePassword: false },
    message: 'Account created successfully',
  });
}

/** Never reveals whether the address exists. */
async function forgotPassword(req, res) {
  const { role } = req.params;
  const { email } = req.body;
  const message =
    'If an account exists for that email, a password reset link has been sent. The link is valid for 30 minutes.';

  try {
    const user = await User.findOne({ email, role, isActive: true });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordTokenHash = sha256(rawToken);
      user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      await emailService.sendPasswordReset(user, rawToken, role);
    }
  } catch (err) {
    logger.error(`Forgot-password failed: ${err.message}`);
  }

  return res.status(200).json({ success: true, data: null, message });
}

async function resetPassword(req, res) {
  const { role } = req.params;
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    role,
    resetPasswordTokenHash: sha256(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordTokenHash +resetPasswordExpires +passwordHash');

  if (!user) {
    throw ApiError.badRequest(
      'This reset link is invalid or has expired. Please request a new one.',
      {
        code: 'RESET_TOKEN_INVALID',
      },
    );
  }

  await user.hashPassword(password);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  user.mustChangePassword = false;
  user.clearFailedLogins();
  await user.save();

  await emailService.sendPasswordChanged(user);
  auditService.record({
    req,
    actor: user,
    action: 'password-reset',
    entity: 'auth',
    entityId: user._id,
    summary: `${role} password reset`,
  });

  clearAuthCookie(res, role);

  return res.status(200).json({
    success: true,
    data: null,
    message: 'Password has been reset. You can sign in now.',
  });
}

async function changePassword(req, res) {
  const role = req.role;
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Session is invalid or has expired, please sign in again');

  const ok = await user.comparePassword(currentPassword);
  if (!ok)
    throw ApiError.badRequest('Your current password is incorrect', {
      code: 'WRONG_CURRENT_PASSWORD',
    });

  await user.hashPassword(newPassword);
  user.mustChangePassword = false;
  user.clearFailedLogins();
  await user.save();

  await emailService.sendPasswordChanged(user);
  auditService.record({
    req,
    actor: user,
    action: 'password-reset',
    entity: 'auth',
    entityId: user._id,
    summary: `${role} changed password`,
  });

  return res.status(200).json({
    success: true,
    data: { mustChangePassword: false },
    message: 'Password updated successfully',
  });
}

module.exports = wrapHandlers({
  adminLogin,
  employeeLogin,
  customerLogin,
  logout,
  me,
  registerCustomer,
  forgotPassword,
  resetPassword,
  changePassword,
});
