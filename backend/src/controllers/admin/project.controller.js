'use strict';

const path = require('path');
const fs = require('fs');

const Project = require('../../models/Project');
const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');
const { toSlug, randomSuffix } = require('../../utils/slug');
const { UPLOAD_DIR } = require('../../middleware/upload');
const auditService = require('../../services/auditService');

async function uniqueSlug(base, excludeId = null) {
  let candidate = toSlug(base);
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Project.exists({ slug: candidate, _id: { $ne: excludeId } })) {
    candidate = `${toSlug(base)}-${i === 1 ? randomSuffix() : `${randomSuffix()}-${i}`}`;
    i += 1;
    if (i > 20) return `${toSlug(base)}-${Date.now().toString(36)}`;
  }
  return candidate;
}

async function assertPeople({ customer, assignedEmployees }) {
  if (customer) {
    const exists = await User.exists({ _id: customer, role: 'customer' });
    if (!exists)
      throw ApiError.badRequest('Selected customer does not exist', { code: 'CUSTOMER_NOT_FOUND' });
  }
  if (assignedEmployees && assignedEmployees.length) {
    const count = await User.countDocuments({ _id: { $in: assignedEmployees }, role: 'employee' });
    if (count !== assignedEmployees.length) {
      throw ApiError.badRequest('One or more assigned employees do not exist', {
        code: 'EMPLOYEE_NOT_FOUND',
      });
    }
  }
}

/** GET /admin/projects — every project including drafts. */
async function listProjects(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = {};

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: re }, { slug: re }, { tags: re }];
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.published) filter.isPublished = req.query.published === 'true';
  if (req.query.featured) filter.isFeatured = req.query.featured === 'true';
  if (req.query.customer) filter.customer = req.query.customer;
  if (req.query.employee) filter.assignedEmployees = req.query.employee;

  const [total, items] = await Promise.all([
    Project.countDocuments(filter),
    Project.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name companyName email')
      .populate('assignedEmployees', 'name email employeeId designation')
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit) },
    message: 'Projects fetched',
  });
}

/** GET /admin/projects/:id */
async function getProject(req, res) {
  const doc = await Project.findById(req.params.id)
    .populate('customer', 'name companyName email')
    .populate('assignedEmployees', 'name email employeeId designation')
    .lean();
  if (!doc) throw ApiError.notFound('Project not found');
  return res.status(200).json({ success: true, data: doc, message: 'Project fetched' });
}

/** POST /admin/projects */
async function createProject(req, res) {
  const body = { ...req.body };
  body.slug = await uniqueSlug(body.title);
  await assertPeople(body);

  const project = await Project.create(body);
  auditService.record({
    req,
    action: 'create',
    entity: 'project',
    entityId: project._id,
    summary: `Created project "${project.title}" (${project.slug})`,
  });

  return res.status(201).json({ success: true, data: project, message: 'Project created' });
}

/** PATCH /admin/projects/:id */
async function updateProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Project not found');

  const body = { ...req.body };
  if (body.slug) body.slug = await uniqueSlug(body.slug, project._id);
  await assertPeople(body);

  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) project[key] = value;
  }

  await project.save();
  auditService.record({
    req,
    action: 'update',
    entity: 'project',
    entityId: project._id,
    summary: `Updated project "${project.title}"`,
    meta: Object.keys(body),
  });

  return res.status(200).json({ success: true, data: project, message: 'Project updated' });
}

/** DELETE /admin/projects/:id */
async function deleteProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Project not found');

  await project.deleteOne();
  auditService.record({
    req,
    action: 'delete',
    entity: 'project',
    entityId: project._id,
    summary: `Deleted project "${project.title}"`,
  });

  return res.status(200).json({
    success: true,
    data: { id: req.params.id },
    message: 'Project deleted',
  });
}

/** PATCH /admin/projects/:id/publish */
async function setPublish(req, res) {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { isPublished: req.body.isPublished },
    { new: true, runValidators: true },
  );
  if (!project) throw ApiError.notFound('Project not found');

  auditService.record({
    req,
    action: 'status-change',
    entity: 'project',
    entityId: project._id,
    summary: `${project.isPublished ? 'Published' : 'Unpublished'} project "${project.title}"`,
  });

  return res.status(200).json({
    success: true,
    data: { id: project._id, isPublished: project.isPublished },
    message: project.isPublished ? 'Project published' : 'Project unpublished',
  });
}

/** PATCH /admin/projects/:id/feature */
async function setFeatured(req, res) {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { isFeatured: req.body.isFeatured },
    { new: true, runValidators: true },
  );
  if (!project) throw ApiError.notFound('Project not found');

  auditService.record({
    req,
    action: 'update',
    entity: 'project',
    entityId: project._id,
    summary: `${project.isFeatured ? 'Featured' : 'Unfeatured'} project "${project.title}"`,
  });

  return res.status(200).json({
    success: true,
    data: { id: project._id, isFeatured: project.isFeatured },
    message: project.isFeatured ? 'Project featured' : 'Project unfeatured',
  });
}

/** PATCH /admin/projects/:id/order */
async function setOrder(req, res) {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { order: req.body.order },
    { new: true, runValidators: true },
  );
  if (!project) throw ApiError.notFound('Project not found');

  auditService.record({
    req,
    action: 'update',
    entity: 'project',
    entityId: project._id,
    summary: `Set order ${project.order} for "${project.title}"`,
  });

  return res.status(200).json({
    success: true,
    data: { id: project._id, order: project.order },
    message: 'Order updated',
  });
}

/** PATCH /admin/projects/:id/progress */
async function setProgress(req, res) {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { progress: req.body.progress },
    { new: true, runValidators: true },
  );
  if (!project) throw ApiError.notFound('Project not found');
  return res.status(200).json({
    success: true,
    data: { id: project._id, progress: project.progress },
    message: 'Progress updated',
  });
}

/** PATCH /admin/projects/:id/assign — customer + team. */
async function assignProject(req, res) {
  const body = req.body;
  await assertPeople(body);

  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Project not found');

  if (body.customer !== undefined) project.customer = body.customer;
  if (body.assignedEmployees !== undefined) project.assignedEmployees = body.assignedEmployees;
  await project.save();

  auditService.record({
    req,
    action: 'update',
    entity: 'project',
    entityId: project._id,
    summary: `Reassigned project "${project.title}" (${project.assignedEmployees.length} employees)`,
  });

  const populated = await Project.findById(project._id)
    .populate('customer', 'name companyName email')
    .populate('assignedEmployees', 'name email employeeId')
    .lean();

  return res
    .status(200)
    .json({ success: true, data: populated, message: 'Project assignment updated' });
}

/** POST /admin/projects/:id/gallery — multipart upload (field: `image`, max 5 MB). */
async function uploadGalleryImage(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) {
    if (req.file) fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
    throw ApiError.notFound('Project not found');
  }
  if (!req.file) throw ApiError.badRequest('No image received (field name must be "image")');

  const url = `/uploads/${req.file.filename}`;
  project.gallery = [...(project.gallery || []), url];
  await project.save();

  auditService.record({
    req,
    action: 'create',
    entity: 'project',
    entityId: project._id,
    summary: `Added image to "${project.title}" gallery`,
    meta: { url, size: req.file.size },
  });

  return res.status(201).json({
    success: true,
    data: { url, gallery: project.gallery, size: req.file.size, mimeType: req.file.mimetype },
    message: 'Image uploaded',
  });
}

/** DELETE /admin/projects/:id/gallery?url=/uploads/x.jpg */
async function removeGalleryImage(req, res) {
  const url = req.query.url;
  if (!url) throw ApiError.badRequest('Provide the image url to remove');

  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Project not found');
  if (!(project.gallery || []).includes(url))
    throw ApiError.notFound('Image not found in this project gallery');

  project.gallery = project.gallery.filter((u) => u !== url);
  await project.save();

  const filename = path.basename(url);
  const target = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(target)) {
    fs.unlink(target, (err) => {
      if (err) return;
    });
  }

  auditService.record({
    req,
    action: 'delete',
    entity: 'project',
    entityId: project._id,
    summary: `Removed image from "${project.title}" gallery`,
    meta: { url },
  });

  return res.status(200).json({
    success: true,
    data: { gallery: project.gallery },
    message: 'Image removed',
  });
}

module.exports = wrapHandlers({
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  setPublish,
  setFeatured,
  setOrder,
  setProgress,
  assignProject,
  uploadGalleryImage,
  removeGalleryImage,
});
