'use strict';

const slugify = require('slugify');

/**
 * Builds a URL friendly slug, optionally suffixed with a short random chunk.
 */
function toSlug(value, { suffix = '' } = {}) {
  const base = slugify(String(value || ''), {
    lower: true,
    strict: true,
    trim: true,
  });
  const tail = suffix ? `-${suffix}` : '';
  return `${base || 'item'}${tail}`.slice(0, 120);
}

function randomSuffix(length = 6) {
  return (
    Math.random()
      .toString(36)
      .replace(/[^a-z0-9]/g, '')
      .slice(0, length) || Date.now().toString(36)
  );
}

module.exports = { toSlug, randomSuffix };
