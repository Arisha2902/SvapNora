'use strict';

const { z } = require('zod');
const { password, email, name, phone } = require('./common');

const loginSchema = z.object({
  email,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(72),
});

const registerCustomerSchema = z.object({
  name,
  email,
  password,
  phone,
  companyName: z
    .string()
    .trim()
    .min(2, 'Company name is too short')
    .max(160, 'Company name is too long'),
});

const forgotPasswordSchema = z.object({ email });

const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string({ required_error: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const resetParamsSchema = z.object({
  token: z.string().min(10, 'Reset token is invalid').max(200, 'Reset token is invalid'),
});

const roleParamsSchema = z.object({
  role: z.enum(['employee', 'customer'], {
    errorMap: () => ({
      message: 'Password reset is available for employee and customer accounts only',
    }),
  }),
});

const resetRouteParamsSchema = z.object({
  role: z.enum(['employee', 'customer'], {
    errorMap: () => ({
      message: 'Password reset is available for employee and customer accounts only',
    }),
  }),
  token: z.string().min(10, 'Reset token is invalid').max(200, 'Reset token is invalid'),
});

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required'),
    newPassword: password,
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.confirmPassword || data.confirmPassword === data.newPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

module.exports = {
  loginSchema,
  registerCustomerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resetParamsSchema,
  roleParamsSchema,
  resetRouteParamsSchema,
  changePasswordSchema,
};
