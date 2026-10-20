'use strict';

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorName: { type: String, default: '' },
    actorRole: {
      type: String,
      enum: ['admin', 'employee', 'customer', 'system'],
      default: 'admin',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'create',
        'update',
        'delete',
        'login',
        'logout',
        'password-reset',
        'status-change',
        'export',
      ],
      index: true,
    },
    entity: { type: String, required: true, trim: true, lowercase: true, index: true },
    entityId: { type: String, default: '', index: true },
    summary: { type: String, default: '', maxlength: 500 },
    ip: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } },
);

auditLogSchema.index({ entity: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
