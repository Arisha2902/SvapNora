'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const { env } = require('./config/env');
const corsMiddleware = require('./config/cors');
const logger = require('./utils/logger');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const auditLogger = require('./middleware/auditLogger');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

// --- Deployment awareness ---
app.set('trust proxy', env.TRUST_PROXY);
app.disable('x-powered-by');

// --- Security first, before anything touches the request ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
);
app.use(corsMiddleware);
app.use(compression());
app.use(
  morgan(env.IS_PROD ? 'combined' : 'dev', {
    skip: (req) => req.originalUrl === '/api/v1/health',
    stream: logger.stream,
  }),
);

// --- Parsers (body size limited) ---
app.use(express.json({ limit: env.BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT }));
app.use(cookieParser());

// --- Hardening ---
app.use(mongoSanitize());
app.use(hpp());
app.use(globalLimiter);

// --- Uploaded images ---
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    maxAge: env.IS_PROD ? '7d' : 0,
    dotfiles: 'deny',
    index: false,
  }),
);

// --- API ---
app.use('/api/v1', auditLogger(), apiRoutes);

// --- 404 + central error handler ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
