'use strict';

const crypto = require('crypto');

const User = require('../../models/User');
const Project = require('../../models/Project');
const Invoice = require('../../models/Invoice');
const Ticket = require('../../models/Ticket');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');
const emailService = require('../../services/emailService');
const auditService = require('../../services/auditService');

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const ALL = LETTERS + DIGITS;

function generateTempPassword(length = 12) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (const b of bytes) out += ALL[b % ALL.length];
  out = LETTERS[bytes[0] % LETTERS.length] + DIGITS[bytes[1] % DIGITS.length] + out.slice(2);
  return out;
}

/** GET /admin/customers */
async function listCustomers(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = { role: 'customer' };

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: re }, { email: re }, { companyName: re }];
  }
  if (req.query.isActive) filter.isActive = req.query.isActive === 'true';

  const [total, items] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit) },
    message: 'Customers fetched',
  });
}

/** GET /admin/customers/:id */
async function getCustomer(req, res) {
  const user = await User.findOne({ _id: req.params.id, role: 'customer' }).lean();
  if (!user) throw ApiError.notFound('Customer not found');

  const [projectCount, openTickets, invoiceAgg] = await Promise.all([
    Project.countDocuments({ customer: user._id }),
    Ticket.countDocuments({ customer: user._id, status: { $ne: 'resolved' } }),
    Invoice.aggregate([
      { $match: { customer: user._id } },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  return res.status(200).json({
    success: true,
    data: { ...user, projectCount, openTickets, invoices: invoiceAgg },
    message: 'Customer fetched',
  });
}

/** POST /admin/customers — admin can also create accounts directly. */
async function createCustomer(req, res) {
  const { name, email, password, phone, companyName, isActive } = req.body;

  const existing = await User.findOne({ email }).select('_id');
  if (existing)
    throw ApiError.conflict('An account with this email already exists', { code: 'EMAIL_TAKEN' });

  const tempPassword = password || generateTempPassword();
  const user = new User({
    name,
    email,
    phone,
    companyName,
    role: 'customer',
    isActive: isActive === undefined ? true : isActive,
    mustChangePassword: Boolean(password),
  });
  await user.hashPassword(tempPassword);
  await user.save();

  const mail = await emailService.sendTemporaryPassword(user, tempPassword);
  auditService.record({
    req,
    action: 'create',
    entity: 'customer',
    entityId: user._id,
    summary: `Created customer ${email}`,
  });

  return res.status(201).json({
    success: true,
    data: {
      user,
      temporaryPassword: password
        ? undefined
        : mail.sent && !mail.simulated
          ? undefined
          : tempPassword,
      mailDelivered: Boolean(mail.sent) && !mail.simulated,
    },
    message: 'Customer created',
  });
}

/** PATCH /admin/customers/:id */
async function updateCustomer(req, res) {
  const user = await User.findOne({ _id: req.params.id, role: 'customer' });
  if (!user) throw ApiError.notFound('Customer not found');

  const allowed = ['name', 'email', 'phone', 'companyName', 'isActive', 'mustChangePassword'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) user[key] = req.body[key];
  }

  await user.save();
  auditService.record({
    req,
    action: 'update',
    entity: 'customer',
    entityId: user._id,
    summary: `Updated customer ${user.email}`,
    meta: Object.keys(req.body),
  });

  return res.status(200).json({ success: true, data: user, message: 'Customer updated' });
}

/** PATCH /admin/customers/:id/status */
async function setCustomerStatus(req, res) {
  const { isActive } = req.body;
  const user = await User.findOne({ _id: req.params.id, role: 'customer' });
  if (!user) throw ApiError.notFound('Customer not found');

  user.isActive = isActive;
  if (isActive) user.clearFailedLogins();
  await user.save();

  auditService.record({
    req,
    action: 'status-change',
    entity: 'customer',
    entityId: user._id,
    summary: `${isActive ? 'Activated' : 'Deactivated'} customer ${user.email}`,
  });

  return res.status(200).json({
    success: true,
    data: { id: user._id, isActive: user.isActive },
    message: `Customer ${isActive ? 'activated' : 'deactivated'}`,
  });
}

/** POST /admin/customers/:id/reset-password */
async function resetCustomerPassword(req, res) {
  const user = await User.findOne({ _id: req.params.id, role: 'customer' }).select('+passwordHash');
  if (!user) throw ApiError.notFound('Customer not found');

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
    entity: 'customer',
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
    message: 'Password reset. The customer must change it at first sign-in.',
  });
}

/** DELETE /admin/customers/:id — deactivate (records are kept for invoices). */
async function deleteCustomer(req, res) {
  const user = await User.findOne({ _id: req.params.id, role: 'customer' });
  if (!user) throw ApiError.notFound('Customer not found');

  user.isActive = false;
  await user.save();

  auditService.record({
    req,
    action: 'delete',
    entity: 'customer',
    entityId: user._id,
    summary: `Deactivated customer ${user.email}`,
  });

  return res.status(200).json({
    success: true,
    data: { id: user._id, isActive: false },
    message: 'Customer deactivated',
  });
}

module.exports = wrapHandlers({
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  setCustomerStatus,
  resetCustomerPassword,
  deleteCustomer,
});
