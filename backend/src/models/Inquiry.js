'use strict';

const mongoose = require('mongoose');

const TYPES = ['contact', 'briefing'];
const STATUSES = ['new', 'contacted', 'closed'];

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '', trim: true },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    type: { type: String, enum: TYPES, default: 'contact' },
    serviceInterest: { type: String, default: '', trim: true },
    status: { type: String, enum: STATUSES, default: 'new', index: true },
    ipAddress: { type: String, default: '' },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
module.exports.TYPES = TYPES;
module.exports.STATUSES = STATUSES;
