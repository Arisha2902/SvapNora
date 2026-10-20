'use strict';

const mongoose = require('mongoose');

const STATUSES = ['open', 'in-progress', 'resolved'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const ticketSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: STATUSES, default: 'open', index: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium', index: true },
    replies: {
      type: [
        {
          author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          role: { type: String, enum: ['admin', 'employee', 'customer'], required: true },
          body: { type: String, required: true, trim: true, maxlength: 5000 },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
module.exports.STATUSES = STATUSES;
module.exports.PRIORITIES = PRIORITIES;
