'use strict';

const Project = require('../../models/Project');
const Ticket = require('../../models/Ticket');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');

function ownFilter(req, extra = {}) {
  return { customer: req.user._id, ...extra };
}

/** GET /customer/tickets */
async function listTickets(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = ownFilter(req);

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ subject: re }, { description: re }];
  }
  if (req.query.status) filter.status = req.query.status;

  const [total, items] = await Promise.all([
    Ticket.countDocuments(filter),
    Ticket.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
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

/** POST /customer/tickets — project must belong to this customer. */
async function createTicket(req, res) {
  const { subject, description, priority, project } = req.body;

  if (project) {
    const owns = await Project.exists({ _id: project, customer: req.user._id });
    if (!owns)
      throw ApiError.badRequest('Selected project does not exist', { code: 'PROJECT_NOT_FOUND' });
  }

  const ticket = await Ticket.create({
    customer: req.user._id,
    project: project || null,
    subject,
    description,
    priority,
  });

  const populated = await Ticket.findById(ticket._id)
    .populate('project', 'title slug')
    .populate('replies.author', 'name role')
    .lean();

  return res.status(201).json({ success: true, data: populated, message: 'Ticket created' });
}

/** GET /customer/tickets/:id — own only. */
async function getTicket(req, res) {
  const ticket = await Ticket.findOne(ownFilter(req, { _id: req.params.id }))
    .populate('project', 'title slug')
    .populate('replies.author', 'name role')
    .lean();
  if (!ticket) throw ApiError.notFound('Ticket not found');

  return res.status(200).json({ success: true, data: ticket, message: 'Ticket fetched' });
}

/** POST /customer/tickets/:id/reply */
async function replyToTicket(req, res) {
  const ticket = await Ticket.findOne(ownFilter(req, { _id: req.params.id }));
  if (!ticket) throw ApiError.notFound('Ticket not found');

  ticket.replies.push({
    author: req.user._id,
    role: req.user.role,
    body: req.body.body,
    at: new Date(),
  });
  if (ticket.status === 'resolved') ticket.status = 'open';
  await ticket.save();

  const populated = await Ticket.findById(ticket._id)
    .populate('project', 'title slug')
    .populate('replies.author', 'name role')
    .lean();

  return res.status(201).json({ success: true, data: populated, message: 'Reply added' });
}

module.exports = wrapHandlers({ listTickets, createTicket, getTicket, replyToTicket });
