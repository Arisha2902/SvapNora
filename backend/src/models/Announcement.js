'use strict';

const mongoose = require('mongoose');

const AUDIENCES = ['all', 'employees', 'customers'];

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 10000 },
    audience: { type: String, enum: AUDIENCES, default: 'all', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

announcementSchema.index({ audience: 1, createdAt: -1 });
announcementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
module.exports.AUDIENCES = AUDIENCES;
