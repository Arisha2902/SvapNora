'use strict';

const { z } = require('zod');
const { objectId, listQuery } = require('./common');
const { STATUSES, PRIORITIES } = require('../models/Ticket');

const opt = (max, label) => z.string().trim().max(max, `${label} is too long`).optional();

const createTicketSchema = z.object({
  subject: z
    .string({ required_error: 'Subject is required' })
    .trim()
    .min(3, 'Subject is too short')
    .max(200),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000),
  project: objectId.optional(),
  priority: z.enum(PRIORITIES).optional().default('medium'),
});

const updateTicketSchema = z.object({
  subject: z.string().trim().min(3, 'Subject is too short').max(200).optional(),
  description: opt(5000, 'Description'),
  project: objectId.optional(),
  priority: z.enum(PRIORITIES).optional(),
});

const replySchema = z.object({
  body: z
    .string({ required_error: 'Reply is required' })
    .trim()
    .min(1, 'Reply cannot be empty')
    .max(5000, 'Reply is too long'),
});

const statusSchema = z.object({
  status: z.enum(STATUSES, { required_error: 'Status is required' }),
});
const prioritySchema = z.object({
  priority: z.enum(PRIORITIES, { required_error: 'Priority is required' }),
});

const listTicketsQuerySchema = listQuery.extend({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  customer: objectId.optional(),
  project: objectId.optional(),
});

const idParamsSchema = z.object({ id: objectId });

module.exports = {
  createTicketSchema,
  updateTicketSchema,
  replySchema,
  statusSchema,
  prioritySchema,
  listTicketsQuerySchema,
  idParamsSchema,
};
