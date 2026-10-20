'use strict';

const { env } = require('../config/env');
const { getTransport, isMailConfigured } = require('../config/mailer');
const logger = require('../utils/logger');

/**
 * Sends a mail and NEVER throws.
 * If SMTP is not configured the message is printed to the console instead,
 * so development and the seed script keep working without a mail server.
 */
async function sendMail({ to, subject, text, html }) {
  try {
    const info = await getTransport().sendMail({
      from: env.MAIL_FROM,
      to,
      subject,
      text,
      html: html || undefined,
    });
    logger.debug(`Mail sent → ${to} :: ${subject}`);
    return { sent: true, simulated: !isMailConfigured(), messageId: info && info.messageId };
  } catch (err) {
    logger.error(`Mail failed → ${to} :: ${subject} :: ${err.message}`);
    return { sent: false, error: err.message };
  }
}

function wrap(subject, lines) {
  const body = lines.join('\n');
  return {
    subject,
    text: `${body}\n\n— KINETIC, Prayagraj`,
    html: `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#111">
      <h2 style="margin:0 0 12px">KINETIC</h2>
      ${lines.map((l) => `<p style="white-space:pre-line;margin:0 0 10px">${l}</p>`).join('')}
      <p style="color:#666;font-size:12px">KINETIC · Prayagraj, India</p>
    </div>`,
  };
}

const emailService = {
  sendMail,

  async sendTemporaryPassword(user, tempPassword) {
    return sendMail({
      to: user.email,
      ...wrap('Your KINETIC employee account has been created', [
        `Hi ${user.name},`,
        `Your employee account has been created on the KINETIC portal.`,
        `Employee ID: ${user.employeeId || '—'}`,
        `Temporary password: ${tempPassword}`,
        `You will be asked to change this password the first time you sign in.`,
        `Sign in at: ${env.CLIENT_URL}/employee/login`,
      ]),
    });
  },

  async sendPasswordReset(user, rawToken, role) {
    const resetUrl = `${env.CLIENT_URL}/${role}/reset-password/${rawToken}`;
    return sendMail({
      to: user.email,
      ...wrap('Reset your KINETIC password', [
        `Hi ${user.name},`,
        `We received a request to reset your password.`,
        `Open this link to choose a new password (valid for 30 minutes):`,
        resetUrl,
        `If you did not request this, you can safely ignore this email.`,
      ]),
    });
  },

  async sendPasswordChanged(user) {
    return sendMail({
      to: user.email,
      ...wrap('Your KINETIC password was changed', [
        `Hi ${user.name},`,
        `Your password was changed successfully. If this was not you, contact the KINETIC team immediately.`,
      ]),
    });
  },

  async sendInquiryNotification(inquiry) {
    return sendMail({
      to: env.COMPANY_INBOX,
      ...wrap(
        `New ${inquiry.type === 'briefing' ? 'project briefing' : 'contact form'} submission`,
        [
          `Name : ${inquiry.name}`,
          `Email: ${inquiry.email}`,
          `Phone: ${inquiry.phone || '—'}`,
          `Interested in: ${inquiry.serviceInterest || '—'}`,
          ``,
          `Message:`,
          `${inquiry.message}`,
        ],
      ),
    });
  },

  async sendInquiryAutoReply(inquiry) {
    return sendMail({
      to: inquiry.email,
      ...wrap('We received your message', [
        `Hi ${inquiry.name},`,
        `Thanks for reaching out to KINETIC. Your message is with our team and we will reply within one business day.`,
        `Meanwhile you can browse our work: ${env.CLIENT_URL}/projects`,
      ]),
    });
  },
};

module.exports = emailService;
