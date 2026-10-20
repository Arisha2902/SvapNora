'use strict';

const bcrypt = require('bcryptjs');

const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const emailService = require('../../services/emailService');
const auditService = require('../../services/auditService');
const { env } = require('../../config/env');

/** GET /admin/profile */
async function getProfile(req, res) {
  return res.status(200).json({
    success: true,
    data: { user: req.user.publicProfile() },
    message: 'Profile fetched',
  });
}

/** PATCH /admin/profile */
async function updateProfile(req, res) {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.unauthorized('Session is invalid or has expired, please sign in again');

  const allowed = ['name', 'phone', 'avatar'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) user[key] = req.body[key];
  }

  await user.save();
  auditService.record({
    req,
    action: 'update',
    entity: 'admin-profile',
    entityId: user._id,
    summary: 'Admin updated own profile',
    meta: Object.keys(req.body),
  });

  return res.status(200).json({
    success: true,
    data: { user: user.publicProfile() },
    message: 'Profile updated',
  });
}

/** POST /admin/profile/change-password */
async function changePassword(req, res) {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Session is invalid or has expired, please sign in again');

  const ok = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!ok)
    throw ApiError.badRequest('Your current password is incorrect', {
      code: 'WRONG_CURRENT_PASSWORD',
    });

  await user.hashPassword(req.body.newPassword);
  user.mustChangePassword = false;
  user.clearFailedLogins();
  await user.save();

  await emailService.sendPasswordChanged(user);
  auditService.record({
    req,
    action: 'password-reset',
    entity: 'admin-profile',
    entityId: user._id,
    summary: 'Admin changed own password',
  });

  return res.status(200).json({
    success: true,
    data: { mustChangePassword: false },
    message: 'Password updated successfully',
  });
}

/** GET /admin/settings — lightweight platform info for the admin UI. */
async function getSettings(_req, res) {
  return res.status(200).json({
    success: true,
    data: {
      company: { name: 'KINETIC', location: 'Prayagraj, India', inbox: env.COMPANY_INBOX },
      clientUrl: env.CLIENT_URL,
      environment: env.NODE_ENV,
      mailConfigured: Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
      uploads: {
        maxFileSizeMb: 5,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
      },
      auth: { lockAfterAttempts: 5, lockMinutes: 15, sessionDays: Number(env.JWT_COOKIE_DAYS) },
    },
    message: 'Settings fetched',
  });
}

module.exports = wrapHandlers({ getProfile, updateProfile, changePassword, getSettings });
