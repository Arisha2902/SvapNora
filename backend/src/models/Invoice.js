'use strict';

const mongoose = require('mongoose');

const STATUSES = ['pending', 'paid', 'overdue'];

const invoiceSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    number: { type: String, required: true, unique: true, uppercase: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true },
    dueDate: { type: Date, required: true, index: true },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    fileUrl: { type: String, default: '' },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

invoiceSchema.index({ status: 1, createdAt: -1 });
invoiceSchema.index({ createdAt: -1 });

invoiceSchema.pre('validate', async function assignNumber(next) {
  try {
    if (this.number) return next();
    const year = new Date().getFullYear();
    const prefix = `KIN-INV-${year}-`;
    const last = await this.constructor
      .findOne({ number: new RegExp(`^${prefix}`) })
      .sort({ number: -1 })
      .select('number')
      .lean();
    let seq = 1;
    if (last && last.number) {
      const parsed = Number(String(last.number).replace(prefix, ''));
      if (Number.isFinite(parsed)) seq = parsed + 1;
    }
    this.number = `${prefix}${String(seq).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
module.exports.STATUSES = STATUSES;
