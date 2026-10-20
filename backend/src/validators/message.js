'use strict';

const { z } = require('zod');
const { objectId } = require('./common');

const sendMessageSchema = z.object({
  body: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message is too long'),
});

const projectParamsSchema = z.object({ id: objectId });

const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

module.exports = { sendMessageSchema, projectParamsSchema, listMessagesQuerySchema };
