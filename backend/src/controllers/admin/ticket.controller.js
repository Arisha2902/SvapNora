'use strict';

const Ticket = require('../../models/Ticket');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');
const auditService = require('../../services/auditService');

/** GET /admin/tickets */
async function listTickets(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = {};

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ subject: re }, { description: re }];
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.customer) filter.customer = req.query.customer;
  if (req.query.project) filter.project = req.query.project;

  const [total, items] = await Promise.all([
    Ticket.countDocuments(filter),
    Ticket.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name email companyName')
      .populate('project', 'title slug')
      .populate('replies.author', 'name role')
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit) },
    message: 'Tickets fetched',
  });
}

/** GET /admin/tickets/:id */
async function getTicket(req, res) {
  const ticket = await Ticket.findById(req.params.id)
    .populate('customer', 'name email companyName')
    .populate('project', 'title slug')
    .populate('replies.author', 'name role')
    .lean();
  if (!ticket) throw ApiError.notFound('Ticket not found');
  return res.status(200).json({ success: true, data: ticket, message: 'Ticket fetched' });
}

/** POST /admin/tickets/:id/reply */
async function replyToTicket(req, res) {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  ticket.replies.push({
    author: req.user._id,
    role: req.user.role,
    body: req.body.body,
    at: new Date(),
  });
  if (ticket.status === 'open') ticket.status = 'in-progress';
  await ticket.save();

  auditService.record({
    req,
    action: 'update',
    entity: 'ticket',
    entityId: ticket._id,
    summary: `Replied to ticket "${ticket.subject}"`,
  });

  const populated = await Ticket.findById(ticket._id)
    .populate('customer', 'name email companyName')
    .populate('project', 'title slug')
    .populate('replies.author', 'name role')
    .lean();

  return res.status(201).json({ success: true, data: populated, message: 'Reply added' });
}

/** PATCH /admin/tickets/:id/status */
async function setTicketStatus(req, res) {
  const ticket = await Ticket.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true },
  );
  if (!ticket) throw ApiError.notFound('Ticket not found');

  auditService.record({
    req,
    action: 'status-change',
    entity: 'ticket',
    entityId: ticket._id,
    summary: `Ticket "${ticket.subject}" → ${ticket.status}`,
  });

  return res.status(200).json({
    success: true,
    data: { id: ticket._id, status: ticket.status },
    message: `Ticket marked as ${ticket.status}`,
  });
}

module.exports = wrapHandlers({ listTickets, getTicket, replyToTicket, setTicketStatus });
