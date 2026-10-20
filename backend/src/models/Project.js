'use strict';

const mongoose = require('mongoose');

const CATEGORIES = ['CRM ', 'Custom Software', 'Web Applications', 'Integrations'];
const STATUSES = ['planning', 'in-progress', 'review', 'completed', 'on-hold'];

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },

    category: { type: String, enum: CATEGORIES, required: true, index: true },
    shortDescription: { type: String, required: true, trim: true, maxlength: 400 },
    fullDescription: { type: String, default: '', trim: true },
    tags: { type: [String], default: [] },

    status: { type: String, enum: STATUSES, default: 'planning', index: true },

    // Terminal-card captions, e.g. { caption, tagline, statusLine }
    visualLabels: { type: mongoose.Schema.Types.Mixed, default: {} },

    metrics: {
      type: [{ value: { type: String, required: true }, label: { type: String, required: true } }],
      default: [],
    },

    problem: { type: String, default: '' },
    approach: { type: String, default: '' },
    features: { type: [String], default: [] },
    results: { type: [String], default: [] },
    gallery: { type: [String], default: [] },

    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0, index: true },

    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assignedEmployees: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },

    progress: { type: Number, min: 0, max: 100, default: 0 },

    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    timeline: {
      type: [
        {
          title: { type: String, required: true },
          date: { type: Date, default: null },
          done: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

projectSchema.index({ status: 1, isPublished: 1 });
projectSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES = STATUSES;
