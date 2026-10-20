'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Zod validation for every write route.
 * Usage: router.post('/', validate({ body: createInquirySchema }), handler)
 * Supports `params`, `query` and `body` schemas in a single call.
 */
function validate(schemas = {}) {
  return (req, _res, next) => {
    const issues = [];
    const keys = ['params', 'query', 'body'];

    for (const key of keys) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (result.success) {
        if (key === 'body') {
          req.body = result.data;
        } else if (key === 'params') {
          req.params = result.data;
        } else {
          req.query = result.data;
        }
      } else {
        for (const issue of result.error.issues) {
          issues.push({ in: key, path: issue.path.join('.') || key, message: issue.message });
        }
      }
    }

    if (issues.length) {
      return next(
        ApiError.badRequest('Validation failed', {
          code: 'VALIDATION_ERROR',
          errors: issues,
        }),
      );
    }
    return next();
  };
}

module.exports = validate;
