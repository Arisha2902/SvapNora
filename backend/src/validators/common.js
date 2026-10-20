'use strict';

const { z } = require('zod');

/** MongoDB ObjectId */
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id');

/** Shared password policy: 8+ chars, at least one letter and one number. */
const password = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .min(5, 'Enter a valid email')
  .max(160, 'Email is too long')
  .email('Enter a valid email');

const name = z.string().trim().min(2, 'Name is too short').max(120, 'Name is too long');
const phone = z.string().trim().max(20, 'Phone number is too long').optional().default('');
const optionalText = (max, label) =>
  z.string().trim().max(max, `${label} is too long`).optional().default('');

/** Shared list query: page, limit, q — extended by each list endpoint. */
const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(100).optional(),
});

const isoDate = z.coerce.date({ invalid_type_error: 'Date must be a valid date' });

module.exports = { objectId, password, email, name, phone, optionalText, listQuery, isoDate };
