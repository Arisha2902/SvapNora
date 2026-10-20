'use strict';

const Project = require('../../models/Project');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');

/** Only the fields a visitor is allowed to see - no internal ids or staffing. */
function toPublic(doc) {
  return {
    id: doc._id,
    title: doc.title,
    slug: doc.slug,
    category: doc.category,
    shortDescription: doc.shortDescription,
    fullDescription: doc.fullDescription,
    tags: doc.tags,
    status: doc.status,
    visualLabels: doc.visualLabels || {},
    metrics: doc.metrics || [],
    problem: doc.problem,
    approach: doc.approach,
    features: doc.features || [],
    results: doc.results || [],
    gallery: doc.gallery || [],
    isFeatured: doc.isFeatured,
    progress: doc.progress,
    startDate: doc.startDate,
    dueDate: doc.dueDate,
    timeline: (doc.timeline || []).map((t) => ({ title: t.title, date: t.date, done: t.done })),
    client: doc.customer && doc.customer.companyName ? doc.customer.companyName : null,
    teamSize: (doc.assignedEmployees && doc.assignedEmployees.length) || 0,
    createdAt: doc.createdAt,
  };
}

/** GET /api/v1/projects — published projects only, with search/filter/pagination. */
async function listProjects(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = { isPublished: true };

  if (req.query.category) filter.category = req.query.category;
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.tag) filter.tags = { $in: [new RegExp(`^${escapeRegex(req.query.tag)}$`, 'i')] };
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: re }, { shortDescription: re }, { tags: re }];
  }

  const [total, docs] = await Promise.all([
    Project.countDocuments(filter),
    Project.find(filter)
      .sort({ isFeatured: -1, order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'companyName')
      .select('-__v')
      .lean(),
  ]);

  const items = docs.map((d) => toPublic(d));

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit) },
    message: 'Projects fetched successfully',
  });
}

/** GET /api/v1/projects/:slug — single published project. */
async function getProjectBySlug(req, res) {
  const doc = await Project.findOne({ slug: req.params.slug, isPublished: true })
    .populate('customer', 'companyName')
    .select('-__v')
    .lean();

  if (!doc) throw ApiError.notFound('Project not found');

  return res.status(200).json({
    success: true,
    data: toPublic(doc),
    message: 'Project fetched successfully',
  });
}

module.exports = wrapHandlers({ listProjects, getProjectBySlug });
