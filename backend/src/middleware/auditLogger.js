'use strict';

const auditService = require('../services/auditService');

const MUTATING = ['POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_ACTION = { POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete' };

function guessEntity(req) {
  const base = (req.baseUrl || '').replace(/^\/api\/v1/, '');
  const parts = `${base}${req.path}`.split('/').filter(Boolean);
  const idx = parts.indexOf('admin');
  const tail = idx >= 0 ? parts.slice(idx + 1) : parts;
  return (tail[0] || 'resource').replace(/s$/, '').toLowerCase();
}

/**
 * Writes every successful admin mutation into the AuditLog collection.
 * Controllers can attach `req.audit = { action, entity, entityId, summary }`
 * for a precise entry, or set `req.skipAudit = true` to opt out.
 */
function auditLogger() {
  return (req, res, next) => {
    if (!MUTATING.includes(req.method) || req.skipAudit) return next();

    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      try {
        const ok = res.statusCode < 400 && payload && payload.success !== false;
        const isAdmin = req.user && req.user.role === 'admin';
        if (ok && isAdmin && !req.skipAudit) {
          const custom = req.audit || {};
          auditService.record({
            req,
            action: custom.action || METHOD_ACTION[req.method] || 'update',
            entity: custom.entity || guessEntity(req),
            entityId: custom.entityId || (req.params && req.params.id) || '',
            summary: custom.summary || `${req.method} ${req.baseUrl}${req.path}`,
            meta: custom.meta || null,
          });
        }
      } catch (_err) {
        // auditing must never break a response
      }
      return originalJson(payload);
    };
    next();
  };
}

module.exports = auditLogger;
