'use strict';

const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(1),
  BODY_LIMIT: z.string().default('1mb'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_SECRET_ADMIN: z.string().min(32, 'JWT_SECRET_ADMIN must be at least 32 characters'),
  JWT_SECRET_EMPLOYEE: z.string().min(32, 'JWT_SECRET_EMPLOYEE must be at least 32 characters'),
  JWT_SECRET_CUSTOMER: z.string().min(32, 'JWT_SECRET_CUSTOMER must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_COOKIE_DAYS: z.coerce.number().int().min(1).max(30).default(7),

  CLIENT_URL: z.string().url().default('http://localhost:5173'),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  MAIL_FROM: z.string().default('KINETIC <no-reply@kinetic.local>'),
  COMPANY_INBOX: z.string().email().default('hello@kinetic.local'),

  ADMIN_NAME: z.string().min(1).default('KINETIC Founder'),
  ADMIN_EMAIL: z.string().email().default('admin@kinetic.local'),
  ADMIN_PASSWORD: z.string().min(8).default('ChangeMe#Admin2026'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n[env] Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const env = parsed.data;

env.IS_PROD = env.NODE_ENV === 'production';
env.IS_DEV = env.NODE_ENV === 'development';

/** Secrets are grouped per portal so one portal can never mint a token for another. */
const JWT_SECRETS = {
  admin: env.JWT_SECRET_ADMIN,
  employee: env.JWT_SECRET_EMPLOYEE,
  customer: env.JWT_SECRET_CUSTOMER,
};

/** One httpOnly cookie per portal - they never share a name. */
const COOKIE_NAMES = {
  admin: 'kinetic_admin',
  employee: 'kinetic_employee',
  customer: 'kinetic_customer',
};

const ROLES = ['admin', 'employee', 'customer'];

module.exports = { env, JWT_SECRETS, COOKIE_NAMES, ROLES };
