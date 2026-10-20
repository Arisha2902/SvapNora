'use strict';

const { env } = require('./env');

const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

let transporter = null;

if (isConfigured) {
  // Lazy require so an unconfigured dev box never loads nodemailer's SMTP stack.
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: Number(env.SMTP_PORT) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

/**
 * Returns a nodemailer-like transport.
 * When SMTP is not configured it prints the mail to the console instead of throwing,
 * so development works without any mail server.
 */
function getTransport() {
  if (transporter) return transporter;

  return {
    name: 'console-transport',
    sendMail(mailOptions) {
      // eslint-disable-next-line no-console
      console.log(
        [
          '',
          '──────────────────────── SMTP (console fallback) ────────────────────────',
          `To      : ${mailOptions.to}`,
          `From    : ${mailOptions.from || env.MAIL_FROM}`,
          `Subject : ${mailOptions.subject}`,
          '--------------------------------------------------------------------------',
          String(mailOptions.text || mailOptions.html || '').trim(),
          '──────────────────────────────────────────────────────────────────────────',
          '',
        ].join('\n'),
      );
      return Promise.resolve({ messageId: `console-${Date.now()}` });
    },
  };
}

function isMailConfigured() {
  return isConfigured;
}

module.exports = { getTransport, isMailConfigured };
