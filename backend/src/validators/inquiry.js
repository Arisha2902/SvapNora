'use strict';

const { z } = require('zod');
const { name, email, phone, optionalText, objectId } = require('./common');

const createInquirySchema = z.object({
  name,
  email,
  phone,
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(5000),
  type: z.enum(['contact', 'briefing']).optional().default('contact'),
  serviceInterest: optionalText(160, 'Service interest'),
  /** Honeypot - humans never fill this. Checked (and ignored) in the controller. */
  website: z.string().max(500).optional().default(''),
});

const listInquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(100).optional(),
  status: z.enum(['new', 'contacted', 'closed']).optional(),
  type: z.enum(['contact', 'briefing']).optional(),
});

const inquiryStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed'], { required_error: 'Status is required' }),
});

const inquiryNotesSchema = z.object({
  notes: z.string().trim().max(4000).optional().default(''),
});

const idParamsSchema = z.object({ id: objectId });

module.exports = {
  createInquirySchema,
  listInquiriesQuerySchema,
  inquiryStatusSchema,
  inquiryNotesSchema,
  idParamsSchema,
};
