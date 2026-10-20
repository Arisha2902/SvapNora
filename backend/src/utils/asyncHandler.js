'use strict';

/**
 * Wraps an async route handler so rejected promises reach the Express error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Wraps every exported route handler of a controller in one go.
 * Controllers export plain async functions and call this at the bottom:
 *   module.exports = wrapHandlers({ login, me, logout });
 */
function wrapHandlers(handlers) {
  const wrapped = {};
  for (const key of Object.keys(handlers)) {
    const value = handlers[key];
    wrapped[key] = typeof value === 'function' ? asyncHandler(value) : value;
  }
  return wrapped;
}

module.exports = asyncHandler;
module.exports.wrapHandlers = wrapHandlers;
