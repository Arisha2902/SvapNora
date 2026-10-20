'use strict';

const { z } = require('zod');
const { objectId, listQuery, isoDate } = require('./common');
const { CATEGORIES, STATUSES } = require('../models/Project');

const metricSchema = z.object({
  value: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(80),
});

const timelineItemSchema = z.object({
  title: z.string().trim().min(2).max(160),
  date: isoDate.optional().nullable(),
  done: z.coerce.boolean().optional().default(false),
});

const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(20);
const linesSchema = z.array(z.string().trim().min(1).max(400)).max(50);

const visualLabelsSchema = z.record(z.string().max(200)).optional();

const createProjectSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title is too short')
    .max(160),
  category: z.enum(CATEGORIES, { required_error: 'Category is required' }),
  shortDescription: z
    .string({ required_error: 'Short description is required' })
    .trim()
    .min(20, 'Short description must be at least 20 characters')
    .max(400),
  fullDescription: z.string().trim().max(20000).optional().default(''),
  tags: tagsSchema.optional().default([]),
  status: z.enum(STATUSES).optional().default('planning'),
  visualLabels: visualLabelsSchema,
  metrics: z.array(metricSchema).max(12).optional().default([]),
  problem: z.string().trim().max(8000).optional().default(''),
  approach: z.string().trim().max(8000).optional().default(''),
  features: linesSchema.optional().default([]),
  results: linesSchema.optional().default([]),
  gallery: z.array(z.string().trim().max(500)).max(30).optional().default([]),
  isFeatured: z.coerce.boolean().optional().default(false),
  isPublished: z.coerce.boolean().optional().default(false),
  order: z.coerce.number().int().min(0).max(99999).optional().default(0),
  customer: objectId.nullable().optional(),
  assignedEmployees: z.array(objectId).max(50).optional().default([]),
  progress: z.coerce.number().min(0).max(100).optional().default(0),
  startDate: isoDate.nullable().optional(),
  dueDate: isoDate.nullable().optional(),
  timeline: z.array(timelineItemSchema).max(60).optional().default([]),
});

const updateProjectSchema = createProjectSchema.partial().extend({
  slug: z
    .string()
    .trim()
    .min(3, 'Slug is too short')
    .max(180)
    .regex(/^[a-z0-9-]+$/, 'Slug may contain lowercase letters, numbers and dashes only')
    .optional(),
});

const listProjectsAdminQuerySchema = listQuery.extend({
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  published: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  customer: objectId.optional(),
  employee: objectId.optional(),
});

const assignSchema = z
  .object({
    customer: objectId.nullable().optional(),
    assignedEmployees: z.array(objectId).max(50).optional(),
  })
  .refine((d) => d.customer !== undefined || d.assignedEmployees !== undefined, {
    message: 'Provide customer and/or assignedEmployees',
  });

const publishSchema = z.object({
  isPublished: z.coerce.boolean({ required_error: 'isPublished is required' }),
});
const featureSchema = z.object({
  isFeatured: z.coerce.boolean({ required_error: 'isFeatured is required' }),
});
const orderSchema = z.object({ order: z.coerce.number().int().min(0).max(99999) });
const progressSchema = z.object({ progress: z.coerce.number().min(0).max(100) });

const slugParamsSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Project slug is required')
    .max(180, 'Project slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Project slug is invalid'),
});

const idParamsSchema = z.object({ id: objectId });

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  listProjectsAdminQuerySchema,
  assignSchema,
  publishSchema,
  featureSchema,
  orderSchema,
  progressSchema,
  slugParamsSchema,
  idParamsSchema,
};
