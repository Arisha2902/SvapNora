'use strict';

const jwt = require('jsonwebtoken');
const { env, JWT_SECRETS, COOKIE_NAMES } = require('../config/env');

const COOKIE_MAX_AGE = Number(env.JWT_COOKIE_DAYS) * 24 * 60 * 60 * 1000;

function secretFor(role) {
  const secret = JWT_SECRETS[role];
  if (!secret) throw new Error(`No JWT secret configured for role "${role}"`);
  return secret;
}

/**
 * Signs a token that can only ever be verified with the secret of its own portal.
 */
function signToken(user, role) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: role || user.role,
      em: user.email,
    },
    secretFor(role || user.role),
    { expiresIn: env.JWT_EXPIRES_IN },
  );
}

function verifyToken(token, role) {
  return jwt.verify(token, secretFor(role));
}

/** httpOnly, sameSite=lax, secure in production - one cookie name per portal. */
function cookieOptions(role) {
  return {
    httpOnly: true,
    secure: env.IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    // The cookie is scoped to its portal path prefix as an extra isolation layer.
    name: COOKIE_NAMES[role],
  };
}

function setAuthCookie(res, role, token) {
  const { name, ...options } = cookieOptions(role);
  res.cookie(name, token, options);
}

function clearAuthCookie(res, role) {
  const { name, ...options } = cookieOptions(role);
  res.clearCookie(name, { ...options, maxAge: undefined });
}

module.exports = {
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  cookieOptions,
  COOKIE_MAX_AGE,
};
