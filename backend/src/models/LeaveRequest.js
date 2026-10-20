'use strict';

const mongoose = require('mongoose');

const TYPES = ['casual', 'sick', 'earned', 'unpaid', 'emergency'];
const STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

const leaveRequestSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: TYPES, default: 'casual' },
    fromDate: { type: Date, required: true, index: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

leaveRequestSchema.index({ status: 1, createdAt: -1 });
leaveRequestSchema.index({ employee: 1, status: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
module.exports.TYPES = TYPES;
module.exports.STATUSES = STATUSES;
