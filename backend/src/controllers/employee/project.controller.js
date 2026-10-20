'use strict';

const Project = require('../../models/Project');
const Task = require('../../models/Task');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');

/** GET /employee/projects — only projects the logged-in employee is assigned to. */
async function listMyProjects(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = { assignedEmployees: req.user._id };

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: re }, { tags: re }];
  }
  if (req.query.status) filter.status = req.query.status;

  const [total, items] = await Promise.all([
    Project.countDocuments(filter),
    Project.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-gallery -__v')
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit) },
    message: 'Projects fetched',
  });
}

/** GET /employee/projects/:id — assigned projects only. */
async function getMyProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, assignedEmployees: req.user._id })
    .select('-gallery -__v')
    .lean();
  if (!project) throw ApiError.notFound('Project not found');

  const tasks = await Task.find({ project: project._id, assignedTo: req.user._id })
    .sort({ dueDate: 1 })
    .select('title status priority dueDate')
    .lean();

  const teamCount = await Project.aggregate([
    { $match: { _id: project._id } },
    { $project: { n: { $size: '$assignedEmployees' } } },
  ]);

  return res.status(200).json({
    success: true,
    data: { ...project, myTasks: tasks, teamSize: teamCount.length ? teamCount[0].n : 0 },
    message: 'Project fetched',
  });
}

module.exports = wrapHandlers({ listMyProjects, getMyProject });
