'use strict';

const router = require('express').Router();

const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authLimiter, strictLimiter } = require('../middleware/rateLimiter');
const v = require('../validators/auth');

// --- Login: three separate endpoints, three separate cookies, three secrets ---
router.post('/admin/login', authLimiter, validate({ body: v.loginSchema }), ctrl.adminLogin);
router.post('/employee/login', authLimiter, validate({ body: v.loginSchema }), ctrl.employeeLogin);
router.post('/customer/login', authLimiter, validate({ body: v.loginSchema }), ctrl.customerLogin);

// --- Self registration: customers only ---
router.post(
  '/customer/register',
  strictLimiter,
  validate({ body: v.registerCustomerSchema }),
  ctrl.registerCustomer,
);

// --- Forgot / reset (employee + customer) ---
router.post(
  '/:role/forgot-password',
  strictLimiter,
  validate({ params: v.roleParamsSchema, body: v.forgotPasswordSchema }),
  ctrl.forgotPassword,
);
router.post(
  '/:role/reset-password/:token',
  strictLimiter,
  validate({ params: v.resetRouteParamsSchema, body: v.resetPasswordSchema }),
  ctrl.resetPassword,
);

// --- Change password: available even while mustChangePassword is set ---
router.post(
  '/admin/change-password',
  authenticate('admin'),
  validate({ body: v.changePasswordSchema }),
  ctrl.changePassword,
);
router.post(
  '/employee/change-password',
  authenticate('employee'),
  validate({ body: v.changePasswordSchema }),
  ctrl.changePassword,
);
router.post(
  '/customer/change-password',
  authenticate('customer'),
  validate({ body: v.changePasswordSchema }),
  ctrl.changePassword,
);

// --- Session ---
router.get('/admin/me', authenticate('admin'), ctrl.me);
router.get('/employee/me', authenticate('employee'), ctrl.me);
router.get('/customer/me', authenticate('customer'), ctrl.me);

router.post('/admin/logout', authenticate('admin'), ctrl.logout);
router.post('/employee/logout', authenticate('employee'), ctrl.logout);
router.post('/customer/logout', authenticate('customer'), ctrl.logout);

module.exports = router;
