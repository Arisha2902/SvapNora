'use strict';

const crypto = require('crypto');

const User = require('../../models/User');
const Project = require('../../models/Project');
const Task = require('../../models/Task');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');
const emailService = require('../../services/emailService');
const auditService = require('../../services/auditService');

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const ALL = LETTERS + DIGITS;

/** Temporary password that always satisfies the password policy (letter + digit). */
function generateTempPassword(length = 12) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (const b of bytes) out += ALL[b % ALL.length];
  out = LETTERS[bytes[0] % LETTERS.length] + DIGITS[bytes[1] % DIGITS.length] + out.slice(2);
  return out;
}

/** GET /admin/employees */
async function listEmployees(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = { role: 'employee' };

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { name: re },
      { email: re },
      { employeeId: re },
      { department: re },
      { designation: re },
    ];
  }
  if (req.query.department) filter.department = req.query.department;
  if (req.query.isActive) filter.isActive = req.query.isActive === 'true';

  const [total, items] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit) },
    message: 'Employees fetched',
  });
}

/** GET /admin/employees/:id */
async function getEmployee(req, res) {
  const user = await User.findOne({ _id: req.params.id, role: 'employee' }).lean();
  if (!user) throw ApiError.notFound('Employee not found');

  const [projectCount, taskCounts] = await Promise.all([
    Project.countDocuments({ assignedEmployees: user._id }),
    Task.aggregate([
      { $match: { assignedTo: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  return res.status(200).json({
    success: true,
    data: { ...user, projectCount, taskCounts },
    message: 'Employee fetched',
  });
}

/** POST /admin/employees — employees never self-register; only an admin creates them. */
async function createEmployee(req, res) {
  const { name, email, password, phone, department, designation, joinDate, isActive } = req.body;

  const existing = await User.findOne({ email }).select('_id');
  if (existing)
    throw ApiError.conflict('An account with this email already exists', { code: 'EMAIL_TAKEN' });

  const tempPassword = password || generateTempPassword();
  const user = new User({
    name,
    email,
    phone,
    department,
    designation,
    joinDate: joinDate || new Date(),
    role: 'employee',
    isActive: isActive === undefined ? true : isActive,
    mustChangePassword: true,
  });
  await user.hashPassword(tempPassword);
  await user.save();

  const mail = await emailService.sendTemporaryPassword(user, tempPassword);
  auditService.record({
    req,
    action: 'create',
    entity: 'employee',
    entityId: user._id,
    summary: `Created employee ${user.employeeId || ''} ${email}`.trim(),
  });

  return res.status(201).json({
    success: true,
    data: {
      user,
      temporaryPassword: mail.sent && !mail.simulated ? undefined : tempPassword,
      mailDelivered: Boolean(mail.sent) && !mail.simulated,
      note:
        mail.sent && !mail.simulated
          ? 'A temporary password was emailed to the employee.'
          : 'SMTP is not configured, so the temporary password is returned here. Share it securely.',
    },
    message: 'Employee created',
  });
}

/** PATCH /admin/employees/:id */
async function updateEmployee(req, res) {
  const user = await User.findOne({ _id: req.params.id, role: 'employee' });
  if (!user) throw ApiError.notFound('Employee not found');

  const allowed = [
    'name',
    'email',
    'phone',
    'department',
    'designation',
    'joinDate',
    'isActive',
    'mustChangePassword',
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) user[key] = req.body[key];
  }

  await user.save();
  auditService.record({
    req,
    action: 'update',
    entity: 'employee',
    entityId: user._id,
    summary: `Updated employee ${user.employeeId || user.email}`,
    meta: Object.keys(req.body),
  });

  return res.status(200).json({ success: true, data: user, message: 'Employee updated' });
}

/** PATCH /admin/employees/:id/status */
async function setEmployeeStatus(req, res) {
  const { isActive } = req.body;
  const user = await User.findOne({ _id: req.params.id, role: 'employee' });
  if (!user) throw ApiError.notFound('Employee not found');

  user.isActive = isActive;
  if (isActive) user.clearFailedLogins();
  await user.save();

  auditService.record({
    req,
    action: 'status-change',
    entity: 'employee',
    entityId: user._id,
    summary: `${isActive ? 'Activated' : 'Deactivated'} employee ${user.email}`,
  });

  return res.status(200).json({
    success: true,
    data: { id: user._id, isActive: user.isActive },
    message: `Employee ${isActive ? 'activated' : 'deactivated'}`,
  });
}

/** POST /admin/employees/:id/reset-password — new temporary password + forced change. */
async function resetEmployeePassword(req, res) {
  const user = await User.findOne({ _id: req.params.id, role: 'employee' }).select('+passwordHash');
  if (!user) throw ApiError.notFound('Employee not found');

  const tempPassword = (req.body && req.body.newPassword) || generateTempPassword();
  await user.hashPassword(tempPassword);
  user.mustChangePassword = true;
  user.clearFailedLogins();
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  const mail = await emailService.sendTemporaryPassword(user, tempPassword);
  auditService.record({
    req,
    action: 'password-reset',
    entity: 'employee',
    entityId: user._id,
    summary: `Reset password for ${user.email}`,
  });

  return res.status(200).json({
    success: true,
    data: {
      id: user._id,
      temporaryPassword: mail.sent && !mail.simulated ? undefined : tempPassword,
      mailDelivered: Boolean(mail.sent) && !mail.simulated,
      mustChangePassword: true,
    },
    message: 'Password reset. The employee must change it at first sign-in.',
  });
}

/** DELETE /admin/employees/:id — soft delete: deactivate and unlink from work. */
async function deleteEmployee(req, res) {
  const user = await User.findOne({ _id: req.params.id, role: 'employee' });
  if (!user) throw ApiError.notFound('Employee not found');

  if (user.email === req.user.email) {
    throw ApiError.badRequest('You cannot delete your own employee record from here');
  }

  user.isActive = false;
  await user.save();

  await Promise.all([
    Project.updateMany({ assignedEmployees: user._id }, { $pull: { assignedEmployees: user._id } }),
    Task.updateMany({ assignedTo: user._id }, { $set: { status: 'todo' } }).catch(() => {}),
  ]);

  auditService.record({
    req,
    action: 'delete',
    entity: 'employee',
    entityId: user._id,
    summary: `Deactivated and unlinked employee ${user.email}`,
  });

  return res.status(200).json({
    success: true,
    data: { id: user._id, isActive: false },
    message: 'Employee removed from active duty',
  });
}

module.exports = wrapHandlers({
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  setEmployeeStatus,
  resetEmployeePassword,
  deleteEmployee,
});
