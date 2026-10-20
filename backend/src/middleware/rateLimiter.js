'use strict';

const rateLimit = require('express-rate-limit');

function buildHandler(limitName) {
  return (_req, res) => {
    res.status(429).json({
      success: false,
      data: null,
      message: `Too many requests (${limitName}). Please try again later.`,
      code: 'RATE_LIMITED',
    });
  };
}

const options = (name, windowMs, max) => ({
  windowMs,
  max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buildHandler(name),
});

/** Keeps the API usable for everyone. */
const globalLimiter = rateLimit(options('global', 15 * 60 * 1000, 600));

/** Login attempts for any of the three portals. */
const authLimiter = rateLimit(options('login', 15 * 60 * 1000, 30));

/** Registration, password reset and password change. */
const strictLimiter = rateLimit(options('account', 60 * 60 * 1000, 20));

/** Contact / briefing form - intentionally very small. */
const inquiryLimiter = rateLimit(options('inquiries', 60 * 60 * 1000, 8));

module.exports = { globalLimiter, authLimiter, strictLimiter, inquiryLimiter };
