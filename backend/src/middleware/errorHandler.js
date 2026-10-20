'use strict';

const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', { code: 'MONGOOSE_VALIDATION', errors });
  }

  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid value for "${err.path}"`, { code: 'CAST_ERROR' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || { field: 1 })[0];
    return ApiError.conflict(`A record with this ${field} already exists`, {
      code: 'DUPLICATE_KEY',
    });
  }

  if (err.type === 'entity.too.large') {
    return ApiError.payloadTooLarge('Request body is too large');
  }

  if (err.name === 'MulterError') {
    const map = {
      LIMIT_FILE_SIZE: 'File is larger than 5 MB',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
    };
    return ApiError.badRequest(map[err.code] || `Upload error: ${err.message}`, {
      code: 'UPLOAD_ERROR',
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Session is invalid or has expired, please sign in again');
  }

  if (err.type === 'entity.parse.failed') {
    return ApiError.badRequest('Malformed JSON body');
  }

  if (err.message && err.message.includes('not allowed by CORS')) {
    return ApiError.forbidden(err.message);
  }

  if (err.name === 'ZodError') {
    const errors = (err.issues || []).map((i) => ({ path: i.path.join('.'), message: i.message }));
    return ApiError.badRequest('Validation failed', { code: 'VALIDATION_ERROR', errors });
  }

  return new ApiError(500, 'Something went wrong on our side', { isOperational: false });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const normalized = normalizeError(err);
  const status = normalized.statusCode || 500;

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${status} :: ${err.stack || err.message}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} → ${status} :: ${normalized.message}`);
  }

  const payload = {
    success: false,
    data: null,
    message: normalized.message,
    code: normalized.code || undefined,
  };

  if (normalized.errors) payload.errors = normalized.errors;
  if (!env.IS_PROD && status >= 500) payload.stack = err.stack;

  res.status(status).json(payload);
}

module.exports = errorHandler;
