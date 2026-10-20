'use strict';

const router = require('express').Router();

const asyncHandler = require('../utils/asyncHandler');
const authRoutes = require('./auth.routes');
const publicRoutes = require('./public.routes');
const adminRoutes = require('./admin.routes');
const employeeRoutes = require('./employee.routes');
const customerRoutes = require('./customer.routes');
const { env } = require('../config/env');

const startedAt = Date.now();

/** GET /api/v1/health */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const mongoose = require('mongoose');
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        service: 'kinetic-backend',
        env: env.NODE_ENV,
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        time: new Date().toISOString(),
      },
      message: 'KINETIC API is healthy',
    });
  }),
);

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/employee', employeeRoutes);
router.use('/customer', customerRoutes);
router.use('/', publicRoutes);

module.exports = router;
