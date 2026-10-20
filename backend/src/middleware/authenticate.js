'use strict';

const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const { COOKIE_NAMES } = require('../config/env');
const { verifyToken, clearAuthCookie } = require('../services/tokenService');

/**
 * authenticate('employee') only ever reads the `kinetic_employee` cookie and only
 * accepts tokens signed with JWT_SECRET_EMPLOYEE. A token minted for one portal is
 * useless in another portal.
 */
function authenticate(role) {
  if (!COOKIE_NAMES[role]) throw new Error(`Unknown role "${role}" passed to authenticate()`);

  return asyncHandler(async (req, _res, next) => {
    const cookieName = COOKIE_NAMES[role];
    const token = req.cookies && req.cookies[cookieName];

    if (!token) {
      throw ApiError.unauthorized('Authentication required');
    }

    let payload;
    try {
      payload = verifyToken(token, role);
    } catch (_err) {
      clearAuthCookie(_res, role);
      throw ApiError.unauthorized('Session is invalid or has expired, please sign in again');
    }

    if (!payload || payload.role !== role) {
      clearAuthCookie(_res, role);
      throw ApiError.unauthorized('Session is invalid or has expired, please sign in again');
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      clearAuthCookie(_res, role);
      throw ApiError.unauthorized('Session is invalid or has expired, please sign in again');
    }
    if (!user.isActive) {
      clearAuthCookie(_res, role);
      throw ApiError.forbidden('This account has been deactivated. Contact the KINETIC team.');
    }
    if (user.isLocked) {
      throw ApiError.forbidden(
        'Account temporarily locked after too many failed sign-in attempts. Try again in 15 minutes.',
      );
    }

    req.user = user;
    req.role = role;
    next();
  });
}

/** Double-checks the role even though authenticate() already scoped the cookie. */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}

/**
 * Blocks every portal route while the user still has a temporary password,
 * except the endpoints needed to resolve it.
 */
function blockIfMustChangePassword(...allowedPaths) {
  return (req, _res, next) => {
    if (!req.user || !req.user.mustChangePassword) return next();
    const path = (req.baseUrl + req.path).replace(/\/+$/, '') || '/';
    if (allowedPaths.some((p) => path === p || path.startsWith(`${p}/`))) return next();
    return next(
      ApiError.forbidden('You must change your temporary password before continuing', {
        code: 'PASSWORD_CHANGE_REQUIRED',
      }),
    );
  };
}

module.exports = { authenticate, requireRole, blockIfMustChangePassword };
