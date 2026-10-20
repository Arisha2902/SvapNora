'use strict';

const { z } = require('zod');
const { objectId, listQuery, isoDate, optionalText } = require('./common');
const { STATUSES } = require('../models/Invoice');

const createInvoiceSchema = z.object({
  customer: objectId,
  project: objectId.optional(),
  amount: z.coerce
    .number({ required_error: 'Amount is required' })
    .min(0, 'Amount cannot be negative')
    .max(1000000000),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3 letter code')
    .optional()
    .default('INR'),
  dueDate: isoDate,
  status: z.enum(STATUSES).optional().default('pending'),
  fileUrl: optionalText(500, 'File URL'),
  notes: optionalText(2000, 'Notes'),
});

const updateInvoiceSchema = z.object({
  amount: z.coerce.number().min(0, 'Amount cannot be negative').max(1000000000).optional(),
  dueDate: isoDate.optional(),
  status: z.enum(STATUSES).optional(),
  project: objectId.optional(),
  fileUrl: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
  currency: z.string().trim().length(3).optional(),
});

const invoiceStatusSchema = z.object({
  status: z.enum(STATUSES, { required_error: 'Status is required' }),
});

const listInvoicesQuerySchema = listQuery.extend({
  status: z.enum(STATUSES).optional(),
  customer: objectId.optional(),
  project: objectId.optional(),
});

const idParamsSchema = z.object({ id: objectId });

module.exports = {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceStatusSchema,
  listInvoicesQuerySchema,
  idParamsSchema,
};
