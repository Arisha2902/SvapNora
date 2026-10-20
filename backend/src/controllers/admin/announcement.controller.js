'use strict';

const Announcement = require('../../models/Announcement');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');
const auditService = require('../../services/auditService');

/** GET /admin/announcements */
async function listAnnouncements(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = {};

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: re }, { body: re }];
  }
  if (req.query.audience) filter.audience = req.query.audience;
  if (req.query.published) filter.isPublished = req.query.published === 'true';

  const [total, items] = await Promise.all([
    Announcement.countDocuments(filter),
    Announcement.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name role')
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit) },
    message: 'Announcements fetched',
  });
}

/** GET /admin/announcements/:id */
async function getAnnouncement(req, res) {
  const doc = await Announcement.findById(req.params.id).populate('createdBy', 'name role').lean();
  if (!doc) throw ApiError.notFound('Announcement not found');
  return res.status(200).json({ success: true, data: doc, message: 'Announcement fetched' });
}

/** POST /admin/announcements */
async function createAnnouncement(req, res) {
  const doc = await Announcement.create({ ...req.body, createdBy: req.user._id });
  auditService.record({
    req,
    action: 'create',
    entity: 'announcement',
    entityId: doc._id,
    summary: `Published announcement "${doc.title}" to ${doc.audience}`,
  });

  const populated = await Announcement.findById(doc._id).populate('createdBy', 'name role').lean();
  return res.status(201).json({ success: true, data: populated, message: 'Announcement created' });
}

/** PATCH /admin/announcements/:id */
async function updateAnnouncement(req, res) {
  const doc = await Announcement.findById(req.params.id);
  if (!doc) throw ApiError.notFound('Announcement not found');

  for (const [key, value] of Object.entries(req.body)) {
    if (value !== undefined) doc[key] = value;
  }
  await doc.save();

  auditService.record({
    req,
    action: 'update',
    entity: 'announcement',
    entityId: doc._id,
    summary: `Updated announcement "${doc.title}"`,
    meta: Object.keys(req.body),
  });

  const populated = await Announcement.findById(doc._id).populate('createdBy', 'name role').lean();
  return res.status(200).json({ success: true, data: populated, message: 'Announcement updated' });
}

/** DELETE /admin/announcements/:id */
async function deleteAnnouncement(req, res) {
  const doc = await Announcement.findByIdAndDelete(req.params.id);
  if (!doc) throw ApiError.notFound('Announcement not found');

  auditService.record({
    req,
    action: 'delete',
    entity: 'announcement',
    entityId: doc._id,
    summary: `Deleted announcement "${doc.title}"`,
  });

  return res
    .status(200)
    .json({ success: true, data: { id: req.params.id }, message: 'Announcement deleted' });
}

module.exports = wrapHandlers({
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
});
