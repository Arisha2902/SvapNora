'use strict';

const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const emailService = require('../../services/emailService');

const ALLOWED = ['name', 'phone', 'avatar', 'companyName'];

/** GET /customer/profile */
async function getProfile(req, res) {
  return res.status(200).json({
    success: true,
    data: { user: req.user.publicProfile() },
    message: 'Profile fetched',
  });
}

/** PATCH /customer/profile */
async function updateProfile(req, res) {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.unauthorized('Session is invalid or has expired, please sign in again');

  for (const key of ALLOWED) {
    if (req.body[key] !== undefined) user[key] = req.body[key];
  }
  await user.save();

  return res.status(200).json({
    success: true,
    data: { user: user.publicProfile() },
    message: 'Profile updated',
  });
}

/** POST /customer/profile/change-password */
async function changePassword(req, res) {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Session is invalid or has expired, please sign in again');

  const ok = await user.comparePassword(req.body.currentPassword);
  if (!ok)
    throw ApiError.badRequest('Your current password is incorrect', {
      code: 'WRONG_CURRENT_PASSWORD',
    });

  await user.hashPassword(req.body.newPassword);
  user.mustChangePassword = false;
  user.clearFailedLogins();
  await user.save();

  await emailService.sendPasswordChanged(user);

  return res.status(200).json({
    success: true,
    data: { mustChangePassword: false },
    message: 'Password updated successfully',
  });
}

module.exports = wrapHandlers({ getProfile, updateProfile, changePassword });
