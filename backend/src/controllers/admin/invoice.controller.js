'use strict';

const Invoice = require('../../models/Invoice');
const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');
const auditService = require('../../services/auditService');

/** GET /admin/invoices */
async function listInvoices(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = {};

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ number: re }, { notes: re }];
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.customer) filter.customer = req.query.customer;
  if (req.query.project) filter.project = req.query.project;

  const [total, items, totals] = await Promise.all([
    Invoice.countDocuments(filter),
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name email companyName')
      .populate('project', 'title slug')
      .lean(),
    Invoice.aggregate([
      ...(Object.keys(filter).length ? [{ $match: filter }] : []),
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', total: 1, count: 1 } },
    ]),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit), totals },
    message: 'Invoices fetched',
  });
}

/** GET /admin/invoices/:id */
async function getInvoice(req, res) {
  const doc = await Invoice.findById(req.params.id)
    .populate('customer', 'name email companyName phone')
    .populate('project', 'title slug')
    .lean();
  if (!doc) throw ApiError.notFound('Invoice not found');
  return res.status(200).json({ success: true, data: doc, message: 'Invoice fetched' });
}

/** POST /admin/invoices */
async function createInvoice(req, res) {
  const customerOk = await User.exists({ _id: req.body.customer, role: 'customer' });
  if (!customerOk)
    throw ApiError.badRequest('Customer does not exist', { code: 'CUSTOMER_NOT_FOUND' });

  const invoice = await Invoice.create(req.body);
  auditService.record({
    req,
    action: 'create',
    entity: 'invoice',
    entityId: invoice._id,
    summary: `Created invoice ${invoice.number} (${invoice.amount} ${invoice.currency})`,
  });

  const populated = await Invoice.findById(invoice._id)
    .populate('customer', 'name email companyName')
    .populate('project', 'title slug')
    .lean();

  return res.status(201).json({ success: true, data: populated, message: 'Invoice created' });
}

/** PATCH /admin/invoices/:id */
async function updateInvoice(req, res) {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw ApiError.notFound('Invoice not found');

  if (req.body.customer) {
    const customerOk = await User.exists({ _id: req.body.customer, role: 'customer' });
    if (!customerOk)
      throw ApiError.badRequest('Customer does not exist', { code: 'CUSTOMER_NOT_FOUND' });
  }

  for (const [key, value] of Object.entries(req.body)) {
    if (value !== undefined) invoice[key] = value;
  }
  await invoice.save();

  auditService.record({
    req,
    action: 'update',
    entity: 'invoice',
    entityId: invoice._id,
    summary: `Updated invoice ${invoice.number}`,
    meta: Object.keys(req.body),
  });

  const populated = await Invoice.findById(invoice._id)
    .populate('customer', 'name email companyName')
    .populate('project', 'title slug')
    .lean();

  return res.status(200).json({ success: true, data: populated, message: 'Invoice updated' });
}

/** PATCH /admin/invoices/:id/status */
async function setInvoiceStatus(req, res) {
  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true },
  );
  if (!invoice) throw ApiError.notFound('Invoice not found');

  auditService.record({
    req,
    action: 'status-change',
    entity: 'invoice',
    entityId: invoice._id,
    summary: `Invoice ${invoice.number} → ${invoice.status}`,
  });

  return res.status(200).json({
    success: true,
    data: { id: invoice._id, number: invoice.number, status: invoice.status },
    message: `Invoice marked as ${invoice.status}`,
  });
}

/** DELETE /admin/invoices/:id */
async function deleteInvoice(req, res) {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);
  if (!invoice) throw ApiError.notFound('Invoice not found');

  auditService.record({
    req,
    action: 'delete',
    entity: 'invoice',
    entityId: invoice._id,
    summary: `Deleted invoice ${invoice.number}`,
  });

  return res
    .status(200)
    .json({ success: true, data: { id: req.params.id }, message: 'Invoice deleted' });
}

module.exports = wrapHandlers({
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  setInvoiceStatus,
  deleteInvoice,
});
