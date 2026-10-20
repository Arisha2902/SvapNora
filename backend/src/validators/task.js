'use strict';

const { z } = require('zod');
const { objectId, listQuery, optionalText, isoDate } = require('./common');
const { STATUSES, PRIORITIES } = require('../models/Task');

/** Same optional string without a default — used in UPDATE schemas so that a
 *  missing key really means "leave it alone" instead of overwriting with ''. */
const opt = (max, label) => z.string().trim().max(max, `${label} is too long`).optional();

const createTaskSchema = z.object({
  title: z.string().trim().min(3, 'Title is too short').max(200),
  description: optionalText(4000, 'Description'),
  project: objectId,
  assignedTo: objectId,
  status: z.enum(STATUSES).optional().default('todo'),
  priority: z.enum(PRIORITIES).optional().default('medium'),
  dueDate: isoDate.optional(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(3, 'Title is too short').max(200).optional(),
  description: opt(4000, 'Description'),
  project: objectId.optional(),
  assignedTo: objectId.optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: isoDate.optional(),
});

const listTasksQuerySchema = listQuery.extend({
  project: objectId.optional(),
  assignedTo: objectId.optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
});

const commentSchema = z.object({
  text: z
    .string({ required_error: 'Comment text is required' })
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(2000),
});

const statusOnlySchema = z.object({
  status: z.enum(STATUSES, { required_error: 'Status is required' }),
});

const idParamsSchema = z.object({ id: objectId });

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  commentSchema,
  statusOnlySchema,
  idParamsSchema,
};
