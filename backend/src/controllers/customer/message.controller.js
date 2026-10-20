'use strict';

const Project = require('../../models/Project');
const Message = require('../../models/Message');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta } = require('../../utils/pagination');

/** A customer may only use projects that belong to them. */
async function assertMyProject(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, customer: userId }).select('_id title');
  if (!project) throw ApiError.notFound('Project not found');
  return project;
}

/** GET /customer/projects/:id/messages */
async function listMessages(req, res) {
  await assertMyProject(req.params.id, req.user._id);
  const { page, limit, skip } = getPagination({ ...req.query, limit: req.query.limit || 50 });

  const [total, docs] = await Promise.all([
    Message.countDocuments({ project: req.params.id }),
    Message.find({ project: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name role employeeId companyName')
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: { items: docs.reverse(), meta: buildMeta(total, page, limit) },
    message: 'Messages fetched',
  });
}

/** POST /customer/projects/:id/messages */
async function sendMessage(req, res) {
  await assertMyProject(req.params.id, req.user._id);

  const message = await Message.create({
    project: req.params.id,
    sender: req.user._id,
    senderRole: req.user.role,
    body: req.body.body,
  });

  const populated = await Message.findById(message._id)
    .populate('sender', 'name role employeeId companyName')
    .lean();

  return res.status(201).json({ success: true, data: populated, message: 'Message sent' });
}

module.exports = wrapHandlers({ listMessages, sendMessage });
