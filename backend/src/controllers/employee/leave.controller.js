'use strict';

const LeaveRequest = require('../../models/LeaveRequest');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');

/** GET /employee/leaves — own requests only. */
async function listLeaves(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = { employee: req.user._id };

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ reason: re }, { type: re }];
  }
  if (req.query.status) filter.status = req.query.status;

  const [total, items] = await Promise.all([
    LeaveRequest.countDocuments(filter),
    LeaveRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewedBy', 'name role')
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit) },
    message: 'Leave requests fetched',
  });
}

/** POST /employee/leaves */
async function createLeave(req, res) {
  const leave = await LeaveRequest.create({
    employee: req.user._id,
    type: req.body.type,
    fromDate: req.body.fromDate,
    toDate: req.body.toDate,
    reason: req.body.reason,
  });

  const populated = await LeaveRequest.findById(leave._id)
    .populate('reviewedBy', 'name role')
    .lean();
  return res
    .status(201)
    .json({ success: true, data: populated, message: 'Leave request submitted' });
}

/** GET /employee/leaves/:id — own only. */
async function getLeave(req, res) {
  const leave = await LeaveRequest.findOne({ _id: req.params.id, employee: req.user._id })
    .populate('reviewedBy', 'name role')
    .lean();
  if (!leave) throw ApiError.notFound('Leave request not found');
  return res.status(200).json({ success: true, data: leave, message: 'Leave request fetched' });
}

/** PATCH /employee/leaves/:id/cancel — only while it is still pending. */
async function cancelLeave(req, res) {
  const leave = await LeaveRequest.findOne({ _id: req.params.id, employee: req.user._id });
  if (!leave) throw ApiError.notFound('Leave request not found');
  if (leave.status !== 'pending') {
    throw ApiError.badRequest(
      `Only pending requests can be cancelled (this one is ${leave.status})`,
    );
  }

  leave.status = 'cancelled';
  await leave.save();

  return res.status(200).json({
    success: true,
    data: { id: leave._id, status: leave.status },
    message: 'Leave request cancelled',
  });
}

module.exports = wrapHandlers({ listLeaves, createLeave, getLeave, cancelLeave });
