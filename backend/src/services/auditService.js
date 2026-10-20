'use strict';

const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

function clientIp(req) {
  return (
    (req.headers && (req.headers['x-forwarded-for'] || '').split(',')[0].trim()) ||
    req.ip ||
    '' ||
    (req.socket && req.socket.remoteAddress) ||
    ''
  );
}

/**
 * Persists an audit entry. Fire-and-forget: an audit failure never breaks a request.
 */
async function record({ req, actor, action, entity, entityId, summary, meta }) {
  try {
    const user = actor || (req && req.user) || null;
    await AuditLog.create({
      actor: user ? user._id : null,
      actorName: user ? user.name : 'system',
      actorRole: user ? user.role : 'system',
      action,
      entity,
      entityId: entityId ? String(entityId) : '',
      summary: summary || '',
      ip: clientIp(req || {}),
      meta: meta === undefined ? null : meta,
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error(`Audit write failed (${entity}/${action}): ${err.message}`);
  }
}

module.exports = { record, clientIp };
