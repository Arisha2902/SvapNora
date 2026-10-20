'use strict';

const router = require('express').Router();

const {
  authenticate,
  requireRole,
  blockIfMustChangePassword,
} = require('../middleware/authenticate');
const validate = require('../middleware/validate');

const dashboard = require('../controllers/employee/dashboard.controller');
const profile = require('../controllers/employee/profile.controller');
const project = require('../controllers/employee/project.controller');
const task = require('../controllers/employee/task.controller');
const leave = require('../controllers/employee/leave.controller');
const announcement = require('../controllers/employee/announcement.controller');
const message = require('../controllers/employee/message.controller');

const authV = require('../validators/auth');
const userV = require('../validators/user');
const projectV = require('../validators/project');
const taskV = require('../validators/task');
const leaveV = require('../validators/leave');
const announcementV = require('../validators/announcement');
const messageV = require('../validators/message');

// ============================================================================
// Employee portal — reads `kinetic_employee`, needs JWT_SECRET_EMPLOYEE.
// ============================================================================
router.use(authenticate('employee'));
router.use(requireRole('employee'));
router.use(blockIfMustChangePassword('/employee/profile', '/auth/employee/logout'));

// --- Dashboard ---
router.get('/stats', dashboard.getStats);

// --- Profile ---
router.get('/profile', profile.getProfile);
router.patch(
  '/profile',
  validate({ body: userV.updateEmployeeProfileSchema }),
  profile.updateProfile,
);
router.post(
  '/profile/change-password',
  validate({ body: authV.changePasswordSchema }),
  profile.changePassword,
);

// --- My projects (only where I am assigned) ---
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

// --- My tasks (only mine, status + comments) ---
router.get('/tasks', validate({ query: taskV.listTasksQuerySchema }), task.listTasks);
router.get('/tasks/:id', validate({ params: taskV.idParamsSchema }), task.getTask);
router.patch(
  '/tasks/:id/status',
  validate({ params: taskV.idParamsSchema, body: taskV.statusOnlySchema }),
  task.updateStatus,
);
router.post(
  '/tasks/:id/comments',
  validate({ params: taskV.idParamsSchema, body: taskV.commentSchema }),
  task.addComment,
);

// --- Leave ---
router.get('/leaves', validate({ query: leaveV.listLeaveQuerySchema }), leave.listLeaves);
router.post('/leaves', validate({ body: leaveV.createLeaveSchema }), leave.createLeave);
router.get('/leaves/:id', validate({ params: leaveV.idParamsSchema }), leave.getLeave);
router.patch('/leaves/:id/cancel', validate({ params: leaveV.idParamsSchema }), leave.cancelLeave);

// --- Announcements for employees ---
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
