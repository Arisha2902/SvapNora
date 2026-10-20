'use strict';

const Inquiry = require('../../models/Inquiry');
const { wrapHandlers } = require('../../utils/asyncHandler');
const emailService = require('../../services/emailService');
const { clientIp } = require('../../services/auditService');
const logger = require('../../utils/logger');

/**
 * POST /api/v1/inquiries — contact form / project briefing.
 *
 * - Honeypot field `website`: bots fill it, humans never do. We answer 201 either way
 *   and simply drop the record, so the bot learns nothing.
 * - Email delivery is fire-and-forget: a mail failure is logged and the request
 *   still succeeds, because the lead must never be lost to an SMTP problem.
 */
async function createInquiry(req, res) {
  const { name, email, phone, message, type, serviceInterest, website } = req.body;

  if (website && String(website).trim().length > 0) {
    logger.warn(`Inquiry honeypot tripped from ${clientIp(req)}`);
    return res.status(201).json({
      success: true,
      data: null,
      message: 'Thanks! Your message has been sent.',
    });
  }

  const inquiry = await Inquiry.create({
    name,
    email,
    phone,
    message,
    type,
    serviceInterest,
    ipAddress: clientIp(req),
  });

  Promise.all([
    emailService.sendInquiryNotification(inquiry),
    emailService.sendInquiryAutoReply(inquiry),
  ]).catch((err) => logger.error(`Inquiry mail pipeline failed: ${err.message}`));

  return res.status(201).json({
    success: true,
    data: {
      id: inquiry._id,
      type: inquiry.type,
      status: inquiry.status,
      createdAt: inquiry.createdAt,
    },
    message: 'Thanks! Your message has been sent. We will reply within one business day.',
  });
}

module.exports = wrapHandlers({ createInquiry });
