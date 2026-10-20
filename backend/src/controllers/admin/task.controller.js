'use strict';

const Task = require('../../models/Task');
const Project = require('../../models/Project');
const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');
const auditService = require('../../services/auditService');

/** GET /admin/tasks */
async function listTasks(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = {};

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: re }, { description: re }];
  }
  if (req.query.project) filter.project = req.query.project;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;

  const [total, items] = await Promise.all([
    Task.countDocuments(filter),
    Task.find(filter)
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('project', 'title slug')
      .populate('assignedTo', 'name email employeeId')
      .populate('comments.user', 'name role')
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit) },
    message: 'Tasks fetched',
  });
}

/** GET /admin/tasks/:id */
async function getTask(req, res) {
  const task = await Task.findById(req.params.id)
    .populate('project', 'title slug')
    .populate('assignedTo', 'name email employeeId')
    .populate('comments.user', 'name role')
    .lean();
  if (!task) throw ApiError.notFound('Task not found');
  return res.status(200).json({ success: true, data: task, message: 'Task fetched' });
}

/** POST /admin/tasks */
async function createTask(req, res) {
  const { project, assignedTo } = req.body;

  const [projectOk, employeeOk] = await Promise.all([
    Project.exists({ _id: project }),
    User.exists({ _id: assignedTo, role: 'employee', isActive: true }),
  ]);
  if (!projectOk)
    throw ApiError.badRequest('Project does not exist', { code: 'PROJECT_NOT_FOUND' });
  if (!employeeOk)
    throw ApiError.badRequest('Assigned employee does not exist', { code: 'EMPLOYEE_NOT_FOUND' });

  const task = await Task.create(req.body);
  auditService.record({
    req,
    action: 'create',
    entity: 'task',
    entityId: task._id,
    summary: `Created task "${task.title}"`,
  });

  const populated = await Task.findById(task._id)
    .populate('project', 'title slug')
    .populate('assignedTo', 'name email employeeId')
    .lean();

  return res.status(201).json({ success: true, data: populated, message: 'Task created' });
}

/** PATCH /admin/tasks/:id */
async function updateTask(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) throw ApiError.notFound('Task not found');

  if (req.body.assignedTo) {
    const employeeOk = await User.exists({ _id: req.body.assignedTo, role: 'employee' });
    if (!employeeOk)
      throw ApiError.badRequest('Assigned employee does not exist', { code: 'EMPLOYEE_NOT_FOUND' });
  }
  if (req.body.project) {
    const projectOk = await Project.exists({ _id: req.body.project });
    if (!projectOk)
      throw ApiError.badRequest('Project does not exist', { code: 'PROJECT_NOT_FOUND' });
  }

  for (const [key, value] of Object.entries(req.body)) {
    if (value !== undefined) task[key] = value;
  }
  await task.save();

  auditService.record({
    req,
    action: 'update',
    entity: 'task',
    entityId: task._id,
    summary: `Updated task "${task.title}"`,
    meta: Object.keys(req.body),
  });

  const populated = await Task.findById(task._id)
    .populate('project', 'title slug')
    .populate('assignedTo', 'name email employeeId')
    .lean();

  return res.status(200).json({ success: true, data: populated, message: 'Task updated' });
}

/** DELETE /admin/tasks/:id */
async function deleteTask(req, res) {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw ApiError.notFound('Task not found');

  auditService.record({
    req,
    action: 'delete',
    entity: 'task',
    entityId: task._id,
    summary: `Deleted task "${task.title}"`,
  });

  return res
    .status(200)
    .json({ success: true, data: { id: req.params.id }, message: 'Task deleted' });
}

module.exports = wrapHandlers({ listTasks, getTask, createTask, updateTask, deleteTask });
