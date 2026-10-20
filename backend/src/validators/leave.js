'use strict';

const { z } = require('zod');
const { objectId, listQuery, isoDate } = require('./common');
const { TYPES, STATUSES } = require('../models/LeaveRequest');

const createLeaveSchema = z
  .object({
    type: z.enum(TYPES).optional().default('casual'),
    fromDate: isoDate,
    toDate: isoDate,
    reason: z
      .string({ required_error: 'Reason is required' })
      .trim()
      .min(5, 'Reason must be at least 5 characters')
      .max(2000),
  })
  .refine((data) => data.toDate >= data.fromDate, {
    message: 'End date must be on or after the start date',
    path: ['toDate'],
  });

const reviewLeaveSchema = z.object({
  reviewNote: z.string().trim().max(1000).optional().default(''),
});

const listLeaveQuerySchema = listQuery.extend({
  status: z.enum(STATUSES).optional(),
  type: z.enum(TYPES).optional(),
  employee: objectId.optional(),
});

const idParamsSchema = z.object({ id: objectId });

module.exports = { createLeaveSchema, reviewLeaveSchema, listLeaveQuerySchema, idParamsSchema };
