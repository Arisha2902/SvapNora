'use strict';

const Project = require('../../models/Project');
const Task = require('../../models/Task');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');

/** GET /customer/projects — own projects only, with progress and timeline. */
async function listMyProjects(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = { customer: req.user._id };

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
      .select('-customer -__v')
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      items: items.map((p) => ({
        ...p,
        teamSize: (p.assignedEmployees && p.assignedEmployees.length) || 0,
        assignedEmployees: undefined,
      })),
      meta: buildMeta(total, page, limit),
    },
    message: 'Projects fetched',
  });
}

/** GET /customer/projects/:id — own project only, with a summary of open tasks. */
async function getMyProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, customer: req.user._id })
    .select('-customer -assignedEmployees -__v')
    .lean();
  if (!project) throw ApiError.notFound('Project not found');

  const [totalTasks, doneTasks] = await Promise.all([
    Task.countDocuments({ project: project._id }),
    Task.countDocuments({ project: project._id, status: 'done' }),
  ]);

  return res.status(200).json({
    success: true,
    data: { ...project, taskSummary: { total: totalTasks, done: doneTasks } },
    message: 'Project fetched',
  });
}

module.exports = wrapHandlers({ listMyProjects, getMyProject });
