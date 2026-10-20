'use strict';

const Announcement = require('../../models/Announcement');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');

/** Customers see announcements addressed to customers, plus general ones. */
const AUDIENCE_FILTER = { audience: { $in: ['all', 'customers'] }, isPublished: true };

/** GET /customer/announcements */
async function listAnnouncements(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = { ...AUDIENCE_FILTER };

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: re }, { body: re }];
  }

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

/** GET /customer/announcements/:id */
async function getAnnouncement(req, res) {
  const doc = await Announcement.findOne({ _id: req.params.id, ...AUDIENCE_FILTER })
    .populate('createdBy', 'name role')
    .lean();
  if (!doc) throw ApiError.notFound('Announcement not found');
  return res.status(200).json({ success: true, data: doc, message: 'Announcement fetched' });
}

module.exports = wrapHandlers({ listAnnouncements, getAnnouncement });
