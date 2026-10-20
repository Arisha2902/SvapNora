'use strict';

const Inquiry = require('../../models/Inquiry');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');
const auditService = require('../../services/auditService');

/** GET /admin/inquiries */
async function listInquiries(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = {};

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: re }, { email: re }, { message: re }, { serviceInterest: re }];
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

  const [total, items] = await Promise.all([
    Inquiry.countDocuments(filter),
    Inquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit) },
    message: 'Inquiries fetched',
  });
}

/** GET /admin/inquiries/:id */
async function getInquiry(req, res) {
  const inquiry = await Inquiry.findById(req.params.id).lean();
  if (!inquiry) throw ApiError.notFound('Inquiry not found');
  return res.status(200).json({ success: true, data: inquiry, message: 'Inquiry fetched' });
}

/** PATCH /admin/inquiries/:id/status */
async function setInquiryStatus(req, res) {
  const inquiry = await Inquiry.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true },
  );
  if (!inquiry) throw ApiError.notFound('Inquiry not found');

  auditService.record({
    req,
    action: 'status-change',
    entity: 'inquiry',
    entityId: inquiry._id,
    summary: `Inquiry from ${inquiry.email} → ${inquiry.status}`,
  });

  return res.status(200).json({
    success: true,
    data: { id: inquiry._id, status: inquiry.status },
    message: `Inquiry marked as ${inquiry.status}`,
  });
}

/** PATCH /admin/inquiries/:id/notes */
async function updateInquiryNotes(req, res) {
  const inquiry = await Inquiry.findByIdAndUpdate(
    req.params.id,
    { notes: req.body.notes },
    { new: true, runValidators: true },
  );
  if (!inquiry) throw ApiError.notFound('Inquiry not found');

  auditService.record({
    req,
    action: 'update',
    entity: 'inquiry',
    entityId: inquiry._id,
    summary: `Updated notes on inquiry from ${inquiry.email}`,
  });

  return res.status(200).json({ success: true, data: inquiry, message: 'Notes saved' });
}

/** DELETE /admin/inquiries/:id */
async function deleteInquiry(req, res) {
  const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
  if (!inquiry) throw ApiError.notFound('Inquiry not found');

  auditService.record({
    req,
    action: 'delete',
    entity: 'inquiry',
    entityId: inquiry._id,
    summary: `Deleted inquiry from ${inquiry.email}`,
  });

  return res
    .status(200)
    .json({ success: true, data: { id: req.params.id }, message: 'Inquiry deleted' });
}

module.exports = wrapHandlers({
  listInquiries,
  getInquiry,
  setInquiryStatus,
  updateInquiryNotes,
  deleteInquiry,
});
