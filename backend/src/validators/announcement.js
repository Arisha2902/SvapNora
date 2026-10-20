'use strict';

const { z } = require('zod');
const { objectId, listQuery } = require('./common');
const { AUDIENCES } = require('../models/Announcement');

const createAnnouncementSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title is too short')
    .max(200),
  body: z
    .string({ required_error: 'Body is required' })
    .trim()
    .min(10, 'Body must be at least 10 characters')
    .max(10000),
  audience: z.enum(AUDIENCES).optional().default('all'),
  isPublished: z.coerce.boolean().optional(),
});

const updateAnnouncementSchema = z.object({
  title: z.string().trim().min(3, 'Title is too short').max(200).optional(),
  body: z.string().trim().min(10, 'Body must be at least 10 characters').max(10000).optional(),
  audience: z.enum(AUDIENCES).optional(),
  isPublished: z.coerce.boolean().optional(),
});

const listAnnouncementsQuerySchema = listQuery.extend({
  audience: z.enum(AUDIENCES).optional(),
  published: z.enum(['true', 'false']).optional(),
});

const idParamsSchema = z.object({ id: objectId });

module.exports = {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  listAnnouncementsQuerySchema,
  idParamsSchema,
};
