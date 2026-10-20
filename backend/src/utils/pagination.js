'use strict';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Reads `page`, `limit` and `q` from the query string in a safe way.
 */
function getPagination(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const rawLimit = parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 100) : '';
  return { page, limit, skip: (page - 1) * limit, limitMax: MAX_LIMIT, search };
}

function buildMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

/** Escape user input before it is embedded in a RegExp. */
function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { getPagination, buildMeta, escapeRegex, DEFAULT_LIMIT, MAX_LIMIT };
