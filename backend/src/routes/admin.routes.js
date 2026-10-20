'use strict';

const router = require('express').Router();
const { z } = require('zod');

const {
  authenticate,
  requireRole,
  blockIfMustChangePassword,
} = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { handleUpload } = require('../middleware/upload');

const dashboard = require('../controllers/admin/dashboard.controller');
const employee = require('../controllers/admin/employee.controller');
const customer = require('../controllers/admin/customer.controller');
const project = require('../controllers/admin/project.controller');
const task = require('../controllers/admin/task.controller');
const inquiry = require('../controllers/admin/inquiry.controller');
const ticket = require('../controllers/admin/ticket.controller');
const leave = require('../controllers/admin/leave.controller');
const announcement = require('../controllers/admin/announcement.controller');
const invoice = require('../controllers/admin/invoice.controller');
const audit = require('../controllers/admin/audit.controller');
const settings = require('../controllers/admin/settings.controller');

const userV = require('../validators/user');
const projectV = require('../validators/project');
const taskV = require('../validators/task');
const inquiryV = require('../validators/inquiry');
const ticketV = require('../validators/ticket');
const leaveV = require('../validators/leave');
const announcementV = require('../validators/announcement');
const invoiceV = require('../validators/invoice');
const authV = require('../validators/auth');
const { listQuery } = require('../validators/common');

// ============================================================================
// Wall: every /api/v1/admin/* request must come from a signed-in admin.
// The cookie read here is `kinetic_admin` and the JWT must be signed with
// JWT_SECRET_ADMIN, so an employee or customer session can never pass.
// ============================================================================
router.use(authenticate('admin'));
router.use(requireRole('admin'));
router.use(blockIfMustChangePassword('/admin/profile', '/admin/settings', '/auth/admin/logout'));

// --- Dashboard ---
router.get('/stats', dashboard.getStats);
router.get('/charts', dashboard.getCharts);

// --- Admin own profile / settings ---
router.get('/profile', settings.getProfile);
router.patch(
  '/profile',
  validate({ body: userV.updateAdminProfileSchema }),
  settings.updateProfile,
);
router.post(
  '/profile/change-password',
  validate({ body: authV.changePasswordSchema }),
  settings.changePassword,
);
router.get('/settings', settings.getSettings);

// --- Employees (admin creates these accounts; nobody self-registers) ---
router.get('/employees', validate({ query: userV.listUsersQuerySchema }), employee.listEmployees);
router.post('/employees', validate({ body: userV.createEmployeeSchema }), employee.createEmployee);
router.get('/employees/:id', validate({ params: userV.idParamsSchema }), employee.getEmployee);
router.patch(
  '/employees/:id',
  validate({ params: userV.idParamsSchema, body: userV.updateEmployeeSchema }),
  employee.updateEmployee,
);
router.patch(
  '/employees/:id/status',
  validate({ params: userV.idParamsSchema, body: userV.statusSchema }),
  employee.setEmployeeStatus,
);
router.post(
  '/employees/:id/reset-password',
  validate({ params: userV.idParamsSchema, body: userV.adminResetPasswordSchema }),
  employee.resetEmployeePassword,
);
router.delete(
  '/employees/:id',
  validate({ params: userV.idParamsSchema }),
  employee.deleteEmployee,
);

// --- Customers ---
router.get('/customers', validate({ query: userV.listUsersQuerySchema }), customer.listCustomers);
router.post('/customers', validate({ body: userV.createCustomerSchema }), customer.createCustomer);
router.get('/customers/:id', validate({ params: userV.idParamsSchema }), customer.getCustomer);
router.patch(
  '/customers/:id',
  validate({ params: userV.idParamsSchema, body: userV.updateCustomerSchema }),
  customer.updateCustomer,
);
router.patch(
  '/customers/:id/status',
  validate({ params: userV.idParamsSchema, body: userV.statusSchema }),
  customer.setCustomerStatus,
);
router.post(
  '/customers/:id/reset-password',
  validate({ params: userV.idParamsSchema, body: userV.adminResetPasswordSchema }),
  customer.resetCustomerPassword,
);
router.delete(
  '/customers/:id',
  validate({ params: userV.idParamsSchema }),
  customer.deleteCustomer,
);

// --- Projects ---
router.get(
  '/projects',
  validate({ query: projectV.listProjectsAdminQuerySchema }),
  project.listProjects,
);
router.post('/projects', validate({ body: projectV.createProjectSchema }), project.createProject);
router.get('/projects/:id', validate({ params: projectV.idParamsSchema }), project.getProject);
router.patch(
  '/projects/:id',
  validate({ params: projectV.idParamsSchema, body: projectV.updateProjectSchema }),
  project.updateProject,
);
router.delete(
  '/projects/:id',
  validate({ params: projectV.idParamsSchema }),
  project.deleteProject,
);
router.patch(
  '/projects/:id/publish',
  validate({ params: projectV.idParamsSchema, body: projectV.publishSchema }),
  project.setPublish,
);
router.patch(
  '/projects/:id/feature',
  validate({ params: projectV.idParamsSchema, body: projectV.featureSchema }),
  project.setFeatured,
);
router.patch(
  '/projects/:id/order',
  validate({ params: projectV.idParamsSchema, body: projectV.orderSchema }),
  project.setOrder,
);
router.patch(
  '/projects/:id/progress',
  validate({ params: projectV.idParamsSchema, body: projectV.progressSchema }),
  project.setProgress,
);
router.patch(
  '/projects/:id/assign',
  validate({ params: projectV.idParamsSchema, body: projectV.assignSchema }),
  project.assignProject,
);
router.post(
  '/projects/:id/gallery',
  validate({ params: projectV.idParamsSchema }),
  handleUpload,
  project.uploadGalleryImage,
);
router.delete(
  '/projects/:id/gallery',
  validate({ params: projectV.idParamsSchema }),
  project.removeGalleryImage,
);

// --- Tasks ---
router.get('/tasks', validate({ query: taskV.listTasksQuerySchema }), task.listTasks);
router.post('/tasks', validate({ body: taskV.createTaskSchema }), task.createTask);
router.get('/tasks/:id', validate({ params: taskV.idParamsSchema }), task.getTask);
router.patch(
  '/tasks/:id',
  validate({ params: taskV.idParamsSchema, body: taskV.updateTaskSchema }),
  task.updateTask,
);
router.delete('/tasks/:id', validate({ params: taskV.idParamsSchema }), task.deleteTask);

// --- Inquiries (public form submissions) ---
router.get(
  '/inquiries',
  validate({ query: inquiryV.listInquiriesQuerySchema }),
  inquiry.listInquiries,
);
router.get('/inquiries/:id', validate({ params: inquiryV.idParamsSchema }), inquiry.getInquiry);
router.patch(
  '/inquiries/:id/status',
  validate({ params: inquiryV.idParamsSchema, body: inquiryV.inquiryStatusSchema }),
  inquiry.setInquiryStatus,
);
router.patch(
  '/inquiries/:id/notes',
  validate({ params: inquiryV.idParamsSchema, body: inquiryV.inquiryNotesSchema }),
  inquiry.updateInquiryNotes,
);
router.delete(
  '/inquiries/:id',
  validate({ params: inquiryV.idParamsSchema }),
  inquiry.deleteInquiry,
);

// --- Tickets ---
router.get('/tickets', validate({ query: ticketV.listTicketsQuerySchema }), ticket.listTickets);
router.get('/tickets/:id', validate({ params: ticketV.idParamsSchema }), ticket.getTicket);
router.post(
  '/tickets/:id/reply',
  validate({ params: ticketV.idParamsSchema, body: ticketV.replySchema }),
  ticket.replyToTicket,
);
router.patch(
  '/tickets/:id/status',
  validate({ params: ticketV.idParamsSchema, body: ticketV.statusSchema }),
  ticket.setTicketStatus,
);

// --- Leave requests ---
router.get(
  '/leave-requests',
  validate({ query: leaveV.listLeaveQuerySchema }),
  leave.listLeaveRequests,
);
router.patch(
  '/leave-requests/:id/approve',
  validate({ params: leaveV.idParamsSchema, body: leaveV.reviewLeaveSchema }),
  leave.approveLeave,
);
router.patch(
  '/leave-requests/:id/reject',
  validate({ params: leaveV.idParamsSchema, body: leaveV.reviewLeaveSchema }),
  leave.rejectLeave,
);

// --- Announcements ---
router.get(
  '/announcements',
  validate({ query: announcementV.listAnnouncementsQuerySchema }),
  announcement.listAnnouncements,
);
router.post(
  '/announcements',
  validate({ body: announcementV.createAnnouncementSchema }),
  announcement.createAnnouncement,
);
router.get(
  '/announcements/:id',
  validate({ params: announcementV.idParamsSchema }),
  announcement.getAnnouncement,
);
router.patch(
  '/announcements/:id',
  validate({ params: announcementV.idParamsSchema, body: announcementV.updateAnnouncementSchema }),
  announcement.updateAnnouncement,
);
router.delete(
  '/announcements/:id',
  validate({ params: announcementV.idParamsSchema }),
  announcement.deleteAnnouncement,
);

// --- Invoices ---
router.get(
  '/invoices',
  validate({ query: invoiceV.listInvoicesQuerySchema }),
  invoice.listInvoices,
);
router.post('/invoices', validate({ body: invoiceV.createInvoiceSchema }), invoice.createInvoice);
router.get('/invoices/:id', validate({ params: invoiceV.idParamsSchema }), invoice.getInvoice);
router.patch(
  '/invoices/:id',
  validate({ params: invoiceV.idParamsSchema, body: invoiceV.updateInvoiceSchema }),
  invoice.updateInvoice,
);
router.patch(
  '/invoices/:id/status',
  validate({ params: invoiceV.idParamsSchema, body: invoiceV.invoiceStatusSchema }),
  invoice.setInvoiceStatus,
);
router.delete(
  '/invoices/:id',
  validate({ params: invoiceV.idParamsSchema }),
  invoice.deleteInvoice,
);

// --- Audit trail ---
const auditQuerySchema = listQuery.extend({
  action: z
    .enum([
      'create',
      'update',
      'delete',
      'login',
      'logout',
      'password-reset',
      'status-change',
      'export',
    ])
    .optional(),
  entity: z.string().trim().max(60).optional(),
  actor: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id')
    .optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
router.get('/audit-logs', validate({ query: auditQuerySchema }), audit.listAuditLogs);

module.exports = router;
