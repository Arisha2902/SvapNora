'use strict';

const router = require('express').Router();

const projectCtrl = require('../controllers/public/project.controller');
const inquiryCtrl = require('../controllers/public/inquiry.controller');
const validate = require('../middleware/validate');
const { inquiryLimiter } = require('../middleware/rateLimiter');
const projectValidators = require('../validators/project');
const inquiryValidators = require('../validators/inquiry');

// --- Public website: no login, published data only ---
router.get(
  '/projects',
  validate({ query: projectValidators.listProjectsQuerySchema }),
  projectCtrl.listProjects,
);
router.get(
  '/projects/:slug',
  validate({ params: projectValidators.slugParamsSchema }),
  projectCtrl.getProjectBySlug,
);

router.post(
  '/inquiries',
  inquiryLimiter,
  validate({ body: inquiryValidators.createInquirySchema }),
  inquiryCtrl.createInquiry,
);

module.exports = router;
