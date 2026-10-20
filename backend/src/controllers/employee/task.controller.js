'use strict';

const Task = require('../../models/Task');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');

/** Ownership filter — an employee can only ever touch their own tasks. */
function ownFilter(req, extra = {}) {
  return { assignedTo: req.user._id, ...extra };
}

/** GET /employee/tasks */
async function listTasks(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = ownFilter(req);

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: re }, { description: re }];
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.project) filter.project = req.query.project;

  const [total, items] = await Promise.all([
    Task.countDocuments(filter),
    Task.find(filter)
      .sort({ status: 1, dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('project', 'title slug')
      .populate('comments.user', 'name role')
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit) },
    message: 'Tasks fetched',
  });
}

/** GET /employee/tasks/:id — only if it is theirs. */
async function getTask(req, res) {
  const task = await Task.findOne(ownFilter(req, { _id: req.params.id }))
    .populate('project', 'title slug category')
    .populate('assignedTo', 'name email employeeId')
    .populate('comments.user', 'name role')
    .lean();
  if (!task) throw ApiError.notFound('Task not found');

  return res.status(200).json({ success: true, data: task, message: 'Task fetched' });
}

/** PATCH /employee/tasks/:id/status — status only, never reassignment. */
async function updateStatus(req, res) {
  const task = await Task.findOne(ownFilter(req, { _id: req.params.id }));
  if (!task) throw ApiError.notFound('Task not found');

  task.status = req.body.status;
  await task.save();

  return res.status(200).json({
    success: true,
    data: { id: task._id, status: task.status },
    message: `Task marked as ${task.status}`,
  });
}

/** POST /employee/tasks/:id/comments */
async function addComment(req, res) {
  const task = await Task.findOne(ownFilter(req, { _id: req.params.id }));
  if (!task) throw ApiError.notFound('Task not found');

  task.comments.push({ user: req.user._id, text: req.body.text, at: new Date() });
  await task.save();

  const populated = await Task.findById(task._id)
    .populate('project', 'title slug')
    .populate('assignedTo', 'name email employeeId')
    .populate('comments.user', 'name role')
    .lean();

  return res.status(201).json({ success: true, data: populated, message: 'Comment added' });
}

module.exports = wrapHandlers({ listTasks, getTask, updateStatus, addComment });
