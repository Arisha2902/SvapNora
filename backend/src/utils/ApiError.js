'use strict';

/**
 * Operational error - safe to show to the client.
 * Anything thrown that is NOT an ApiError is treated as a bug by the error handler.
 */
class ApiError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = options.code || null;
    this.errors = options.errors || null;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', options) {
    return new ApiError(400, message, options);
  }

  static unauthorized(message = 'Authentication required', options) {
    return new ApiError(401, message, options);
  }

  static forbidden(message = 'You do not have permission to perform this action', options) {
    return new ApiError(403, message, options);
  }

  static notFound(message = 'Resource not found', options) {
    return new ApiError(404, message, options);
  }

  static conflict(message = 'Resource already exists', options) {
    return new ApiError(409, message, options);
  }

  static payloadTooLarge(message = 'Payload too large', options) {
    return new ApiError(413, message, options);
  }

  static tooMany(message = 'Too many requests, please try again later', options) {
    return new ApiError(429, message, options);
  }
}

module.exports = ApiError;
