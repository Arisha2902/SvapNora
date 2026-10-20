'use strict';

const mongoose = require('mongoose');

const SENDER_ROLES = ['admin', 'employee', 'customer'];

const messageSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderRole: { type: String, enum: SENDER_ROLES, required: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    readBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { timestamps: true },
);

messageSchema.index({ project: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
module.exports.SENDER_ROLES = SENDER_ROLES;
