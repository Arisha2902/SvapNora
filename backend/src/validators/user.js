'use strict';

const { z } = require('zod');
const { objectId, password, email, name, listQuery, isoDate } = require('./common');

/** Optional string with NO default — so an omitted key in an UPDATE means
 *  "leave this field unchanged" instead of overwriting it with ''. */
const opt = (max, label) => z.string().trim().max(max, `${label} is too long`).optional();
const defaulted = (max, label) =>
  z.string().trim().max(max, `${label} is too long`).optional().default('');
const phone = z.string().trim().max(20, 'Phone number is too long');
const phoneOpt = phone.optional();
const phoneDefault = phone.optional().default('');

/** Admin creates an employee — password optional (a temporary one is generated + emailed). */
const createEmployeeSchema = z.object({
  name,
  email,
  password: password.optional(),
  phone: phoneDefault,
  department: defaulted(80, 'Department'),
  designation: defaulted(120, 'Designation'),
  joinDate: isoDate.optional(),
  isActive: z.coerce.boolean().optional(),
});

const updateEmployeeSchema = z.object({
  name: name.optional(),
  email: email.optional(),
  phone: phoneOpt,
  department: opt(80, 'Department'),
  designation: opt(120, 'Designation'),
  joinDate: isoDate.optional(),
  isActive: z.coerce.boolean().optional(),
  mustChangePassword: z.coerce.boolean().optional(),
});

const createCustomerSchema = z.object({
  name,
  email,
  password: password.optional(),
  phone: phoneDefault,
  companyName: z.string().trim().min(2, 'Company name is too short').max(160).optional(),
  isActive: z.coerce.boolean().optional(),
});

const updateCustomerSchema = z.object({
  name: name.optional(),
  email: email.optional(),
  phone: phoneOpt,
  companyName: z.string().trim().min(2, 'Company name is too short').max(160).optional(),
  isActive: z.coerce.boolean().optional(),
  mustChangePassword: z.coerce.boolean().optional(),
});

const adminResetPasswordSchema = z.object({
  newPassword: password.optional(),
  mustChangePassword: z.coerce.boolean().optional(),
});

const statusSchema = z.object({
  isActive: z.coerce.boolean({ required_error: 'isActive is required' }),
});

const updateAdminProfileSchema = z.object({
  name: name.optional(),
  phone: phoneOpt,
  avatar: z.string().trim().max(500).optional(),
});

/** Employees may only edit their own contact details — never role, department or ids. */
const updateEmployeeProfileSchema = z.object({
  name: name.optional(),
  phone: phoneOpt,
  avatar: z.string().trim().max(500).optional(),
});

const updateCustomerProfileSchema = z.object({
  name: name.optional(),
  phone: phoneOpt,
  avatar: z.string().trim().max(500).optional(),
  companyName: z.string().trim().min(2, 'Company name is too short').max(160).optional(),
});

const listUsersQuerySchema = listQuery.extend({
  role: z.enum(['admin', 'employee', 'customer']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  department: z.string().trim().max(80).optional(),
});

const idParamsSchema = z.object({ id: objectId });

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  createCustomerSchema,
  updateCustomerSchema,
  adminResetPasswordSchema,
  statusSchema,
  updateAdminProfileSchema,
  updateEmployeeProfileSchema,
  updateCustomerProfileSchema,
  listUsersQuerySchema,
  idParamsSchema,
};
