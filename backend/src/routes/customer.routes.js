'use strict';

const router = require('express').Router();

const {
  authenticate,
  requireRole,
  blockIfMustChangePassword,
} = require('../middleware/authenticate');
const validate = require('../middleware/validate');

const dashboard = require('../controllers/customer/dashboard.controller');
const profile = require('../controllers/customer/profile.controller');
const project = require('../controllers/customer/project.controller');
const ticket = require('../controllers/customer/ticket.controller');
const invoice = require('../controllers/customer/invoice.controller');
const announcement = require('../controllers/customer/announcement.controller');
const message = require('../controllers/customer/message.controller');

const authV = require('../validators/auth');
const userV = require('../validators/user');
const projectV = require('../validators/project');
const ticketV = require('../validators/ticket');
const invoiceV = require('../validators/invoice');
const announcementV = require('../validators/announcement');
const messageV = require('../validators/message');

// ============================================================================
// Customer portal — reads `kinetic_customer`, needs JWT_SECRET_CUSTOMER.
// ============================================================================
router.use(authenticate('customer'));
router.use(requireRole('customer'));
router.use(blockIfMustChangePassword('/customer/profile', '/auth/customer/logout'));

// --- Dashboard ---
router.get('/stats', dashboard.getStats);

// --- Profile ---
router.get('/profile', profile.getProfile);
router.patch(
  '/profile',
  validate({ body: userV.updateCustomerProfileSchema }),
  profile.updateProfile,
);
router.post(
  '/profile/change-password',
  validate({ body: authV.changePasswordSchema }),
  profile.changePassword,
);

// --- My projects (progress + timeline, own only) ---
router.get(
  '/projects',
  validate({ query: projectV.listProjectsQuerySchema }),
  project.listMyProjects,
);
router.get(
  '/projects/:id',
  validate({ params: messageV.projectParamsSchema }),
  project.getMyProject,
);
router.get(
  '/projects/:id/messages',
  validate({ params: messageV.projectParamsSchema, query: messageV.listMessagesQuerySchema }),
  message.listMessages,
);
router.post(
  '/projects/:id/messages',
  validate({ params: messageV.projectParamsSchema, body: messageV.sendMessageSchema }),
  message.sendMessage,
);

// --- Support tickets ---
router.get('/tickets', validate({ query: ticketV.listTicketsQuerySchema }), ticket.listTickets);
router.post('/tickets', validate({ body: ticketV.createTicketSchema }), ticket.createTicket);
router.get('/tickets/:id', validate({ params: ticketV.idParamsSchema }), ticket.getTicket);
router.post(
  '/tickets/:id/reply',
  validate({ params: ticketV.idParamsSchema, body: ticketV.replySchema }),
  ticket.replyToTicket,
);

// --- Invoices (own only) ---
router.get(
  '/invoices',
  validate({ query: invoiceV.listInvoicesQuerySchema }),
  invoice.listInvoices,
);
router.get('/invoices/:id', validate({ params: invoiceV.idParamsSchema }), invoice.getInvoice);

// --- Announcements for customers ---
router.get(
  '/announcements',
  validate({ query: announcementV.listAnnouncementsQuerySchema }),
  announcement.listAnnouncements,
);
router.get(
  '/announcements/:id',
  validate({ params: announcementV.idParamsSchema }),
  announcement.getAnnouncement,
);

module.exports = router;
