'use strict';

const LeaveRequest = require('../../models/LeaveRequest');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');
const auditService = require('../../services/auditService');

/** GET /admin/leave-requests */
async function listLeaveRequests(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = {};

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ reason: re }, { type: re }];
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.employee) filter.employee = req.query.employee;

  const [total, items] = await Promise.all([
    LeaveRequest.countDocuments(filter),
    LeaveRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employee', 'name email employeeId department designation')
      .populate('reviewedBy', 'name role')
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit) },
    message: 'Leave requests fetched',
  });
}

/** PATCH /admin/leave-requests/:id/approve */
async function approveLeave(req, res) {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw ApiError.notFound('Leave request not found');
  if (leave.status !== 'pending') {
    throw ApiError.badRequest(
      `Only pending requests can be approved (this one is ${leave.status})`,
    );
  }

  leave.status = 'approved';
  leave.reviewedBy = req.user._id;
  leave.reviewNote = (req.body && req.body.reviewNote) || '';
  await leave.save();

  auditService.record({
    req,
    action: 'status-change',
    entity: 'leave',
    entityId: leave._id,
    summary: `Approved leave for employee ${leave.employee}`,
  });

  const populated = await LeaveRequest.findById(leave._id)
    .populate('employee', 'name email employeeId department')
    .populate('reviewedBy', 'name role')
    .lean();

  return res.status(200).json({ success: true, data: populated, message: 'Leave approved' });
}

/** PATCH /admin/leave-requests/:id/reject */
async function rejectLeave(req, res) {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw ApiError.notFound('Leave request not found');
  if (leave.status !== 'pending') {
    throw ApiError.badRequest(
      `Only pending requests can be rejected (this one is ${leave.status})`,
    );
  }

  leave.status = 'rejected';
  leave.reviewedBy = req.user._id;
  leave.reviewNote = (req.body && req.body.reviewNote) || '';
  await leave.save();

  auditService.record({
    req,
    action: 'status-change',
    entity: 'leave',
    entityId: leave._id,
    summary: `Rejected leave for employee ${leave.employee}`,
  });

  const populated = await LeaveRequest.findById(leave._id)
    .populate('employee', 'name email employeeId department')
    .populate('reviewedBy', 'name role')
    .lean();

  return res.status(200).json({ success: true, data: populated, message: 'Leave rejected' });
}

module.exports = wrapHandlers({ listLeaveRequests, approveLeave, rejectLeave });
