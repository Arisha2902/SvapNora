'use strict';

/**
 * KINETIC demo seed — `npm run seed`
 *
 * Wipes every collection and rebuilds a complete, realistic dataset so all
 * three portals have data on first run:
 *   - 1 admin (from .env), 3 employees, 2 customers (passwords printed below)
 *   - Project Apex (featured) + the six projects shown on the public site
 *   - linked tasks, tickets, leave requests, announcements, invoices,
 *     project messages, inquiries and audit entries
 */

const mongoose = require('mongoose');
const { env } = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { toSlug } = require('../utils/slug');

const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Inquiry = require('../models/Inquiry');
const Ticket = require('../models/Ticket');
const LeaveRequest = require('../models/LeaveRequest');
const Announcement = require('../models/Announcement');
const Invoice = require('../models/Invoice');
const Message = require('../models/Message');
const AuditLog = require('../models/AuditLog');

const day = 24 * 60 * 60 * 1000;
const ago = (n) => new Date(Date.now() - n * day);
const ahead = (n) => new Date(Date.now() + n * day);

function line(char = '─') {
  return char.repeat(64);
}

function heading(text) {
  console.log(`\n${line('=')}\n ${text}\n${line('=')}`);
}

const SEED_PASSWORDS = {
  employees: ['Ravi@Employee2026', 'Sana@Employee2026', 'Imran@Employee2026'],
  customers: ['Priya@Customer2026', 'Vikram@Customer2026'],
};

const EMPLOYEES = [
  {
    name: 'Ravi Shankar Tiwari',
    email: 'ravi.tiwari@kinetic.local',
    phone: '+91 90000 10001',
    department: 'Engineering',
    designation: 'Senior Full-Stack Engineer',
    joinDate: ago(760),
  },
  {
    name: 'Sana Qureshi',
    email: 'sana.qureshi@kinetic.local',
    phone: '+91 90000 10002',
    department: 'Design',
    designation: 'Product Designer',
    joinDate: ago(540),
  },
  {
    name: 'Imran Ansari',
    email: 'imran.ansari@kinetic.local',
    phone: '+91 90000 10003',
    department: 'Infrastructure',
    designation: 'DevOps Engineer',
    joinDate: ago(330),
  },
];

const CUSTOMERS = [
  {
    name: 'Priya Agrawal',
    email: 'priya@sunriseRetail.in',
    phone: '+91 98111 20001',
    companyName: 'Sunrise Retail Pvt Ltd',
  },
  {
    name: 'Vikram Singh',
    email: 'vikram@trinetlogistics.in',
    phone: '+91 98111 20002',
    companyName: 'Trinet Logistics',
  },
];

const PROJECTS = [
  {
    key: 'apex',
    title: 'Project Apex',
    category: 'Custom Software',
    isFeatured: true,
    order: 1,
    status: 'in-progress',
    progress: 72,
    shortDescription:
      'Unified operations command centre consolidating CRM, dispatch, billing and support into one deterministic workflow bus.',
    fullDescription:
      'Project Apex replaces a patchwork of spreadsheets and disconnected tools with a single operations command centre. Every lead, ticket and invoice moves through a deterministic state machine, so an order can never skip a step or land in two places at once. The platform runs behind role-scoped portals for admin, employee and customer, each with independent sessions and permissions.',
    tags: ['Node.js', 'MongoDB', 'React', 'Redis', 'Docker'],
    visualLabels: {
      caption: '16:10 APEX // COMMAND CENTRE',
      tagline: 'DETERMINISTIC WORKFLOW BUS',
      statusLine: 'BUILD RC-3 · ALL CHECKS GREEN',
      footLeft: 'SLA: 99.98%',
      footRight: 'P95: 142MS',
    },
    metrics: [
      { value: '99.98%', label: 'Uptime SLA' },
      { value: '142ms', label: 'P95 API latency' },
      { value: '6', label: 'Systems replaced' },
      { value: '4.2K', label: 'Daily operations' },
    ],
    problem:
      'Sales, delivery and finance teams each ran their own tool. A single customer order was reconciled by hand three times a day, and disagreements between systems were resolved in a group chat.',
    approach:
      'We modelled the whole business as one ordered pipeline with explicit state transitions, then exposed a read-optimised projection to each portal. Nothing is written twice; every mutation is idempotent and carries an audit entry.',
    features: [
      'Role-scoped admin, employee and customer portals with independent sessions',
      'Idempotent workflow engine with replayable event history',
      'Audit trail on every create, update and delete',
      'Live SLA and latency telemetry per workflow',
      'Batch billing runs with per-customer invoice previews',
    ],
    results: [
      'Order reconciliation time cut from 3 hours to 9 minutes per day',
      'Zero double-booked dispatches across the first 90 days',
      'Support first-response down to 11 minutes on average',
    ],
    timeline: [
      { title: 'Discovery and process mapping', date: ago(120), done: true },
      { title: 'Workflow engine and audit layer', date: ago(84), done: true },
      { title: 'Portal build-out (admin / employee / customer)', date: ago(40), done: true },
      { title: 'Billing and reporting modules', date: ahead(14), done: false },
      { title: 'Production cutover', date: ahead(45), done: false },
    ],
    startDate: ago(130),
    dueDate: ahead(60),
  },
  {
    key: 'leadstream',
    title: 'LeadStream ERP Router',
    category: 'CRM',
    order: 2,
    status: 'completed',
    progress: 100,
    shortDescription:
      'Zero-drop transactional event queue automating partner allocation and dispatching high-volume retail leads with SLA failovers.',
    fullDescription:
      'LeadStream accepts leads from web, phone and partner webhooks, normalises them once, and routes them to the right partner inside a contractual SLA window. Every delivery is retried with backoff and the whole queue is replayable, so no lead is ever silently dropped.',
    tags: ['Node.js', 'Redis', 'CRM Webhook'],
    visualLabels: {
      caption: '16:10 LEADSTREAM TELEMETRY',
      tagline: 'ROUTER // BUS',
      statusLine: 'PRODUCTION · ONLINE',
      footLeft: 'THROUGHPUT: 4.8K REQ/S',
      footRight: 'FAILOVER: 0.00S',
    },
    metrics: [
      { value: '4.8K/s', label: 'Peak throughput' },
      { value: '0.00s', label: 'Failover window' },
      { value: '99.99%', label: 'Delivery SLA' },
      { value: '0', label: 'Dropped leads' },
    ],
    problem:
      'Partners were emailed spreadsheets. Leads arrived late, duplicates were assigned twice, and no one could prove which partner received what and when.',
    approach:
      'A durable Redis-backed queue with per-partner SLA budgets, deterministic dedupe keys, and a signed delivery receipt written back to the ERP.',
    features: [
      'Omni-channel intake with deterministic dedupe',
      'Per-partner SLA budgets and automatic failover',
      'Bidirectional ERP handshake with signed receipts',
      'Full queue replay for compliance review',
    ],
    results: [
      '4.8K requests per second sustained during festival campaigns',
      'Zero dropped leads across 14 months of production',
      'Partner allocation time down from 6 minutes to under 200ms',
    ],
    timeline: [
      { title: 'Queue architecture and dedupe design', date: ago(300), done: true },
      { title: 'Partner adapters and ERP handshake', date: ago(270), done: true },
      { title: 'Load testing at 5K req/s', date: ago(255), done: true },
      { title: 'Production launch', date: ago(240), done: true },
    ],
    startDate: ago(310),
    dueDate: ago(240),
  },
  {
    key: 'corefabric',
    title: 'CoreFabric Ledger Console',
    category: 'Custom Software',
    order: 3,
    status: 'in-progress',
    progress: 88,
    shortDescription:
      'Institutional asset tracking and internal compliance console with strict deterministic reconciliation and regulatory export routines.',
    fullDescription:
      'CoreFabric keeps an append-only ledger of every asset movement and reconciles it against the depository feed each night. Regulators get a single signed export instead of a folder of screenshots.',
    tags: ['Go', 'React', 'gRPC'],
    visualLabels: {
      caption: '16:10 COREFABRIC CODE MATRIX',
      tagline: 'APPEND-ONLY LEDGER',
      statusLine: 'ACTIVE CORE · SYNC AUDIT PASS',
      footLeft: 'GO-ENGINE V1.22',
      footRight: 'SYNC AUDIT: PASS',
    },
    metrics: [
      { value: 'V1.22', label: 'Go engine build' },
      { value: '100%', label: 'Reconciliation match' },
      { value: '<3min', label: 'Nightly close' },
      { value: '7yr', label: 'Retention window' },
    ],
    problem:
      'Month-end reconciliation was a manual comparison of two exports. Differences were found late, and each audit cycle cost two weeks of analyst time.',
    approach:
      'An append-only ledger with a nightly deterministic diff against the depository feed. Discrepancies are raised as tickets the moment they appear, not at month end.',
    features: [
      'Append-only, tamper-evident ledger entries',
      'Nightly deterministic reconciliation with the depository feed',
      'Regulator-ready signed export in a single click',
      'Row-level access control and full read audit',
    ],
    results: [
      'Reconciliation now closes in under 3 minutes',
      '100% match rate across 9 consecutive nightly runs',
      'Audit preparation reduced from 2 weeks to 2 days',
    ],
    timeline: [
      { title: 'Ledger schema and immutability guarantees', date: ago(150), done: true },
      { title: 'Reconciliation engine', date: ago(95), done: true },
      { title: 'Console UI and export routines', date: ago(35), done: true },
      { title: 'External audit sign-off', date: ahead(21), done: false },
    ],
    startDate: ago(160),
    dueDate: ahead(30),
  },
  {
    key: 'horizon',
    title: 'Horizon Digital Storefront',
    category: 'Web Applications',
    order: 4,
    status: 'completed',
    progress: 100,
    shortDescription:
      'Headless omni-channel commerce engine with edge-cached SKU resolution and sub-100ms global checkout rendering.',
    fullDescription:
      'Horizon serves the catalogue from the edge and resolves SKU, stock and price at request time, so a sale started in Prayagraj renders instantly in Singapore. Checkout holds up under flash-sale load without queueing buyers.',
    tags: ['Next.js', 'Edge API', 'Stripe'],
    visualLabels: {
      caption: '16:10 STOREFRONT PREVIEW',
      tagline: 'HEADLESS COMMERCE',
      statusLine: 'SCALE ACTIVE',
      footLeft: 'EDGE POP: PRAYAGRAJ/001',
      footRight: 'CONVERT +34%',
    },
    metrics: [
      { value: '100/100', label: 'Core Web Vitals' },
      { value: '94ms', label: 'Checkout render' },
      { value: '+34%', label: 'Conversion lift' },
      { value: '12×', label: 'Flash-sale headroom' },
    ],
    problem:
      'The legacy storefront took 4.1 seconds to render on mobile data and collapsed under flash-sale traffic, losing an estimated third of mobile checkouts.',
    approach:
      'Static catalogue shells at the edge, a thin read API for live stock and price, and a checkout path that never blocks on the origin.',
    features: [
      'Edge-cached catalogue with stale-while-revalidate',
      'Sub-100ms checkout render on 3G',
      'Flash-sale traffic shaping with 12x headroom',
      'Unified inventory across store and web channels',
    ],
    results: [
      '100/100 Core Web Vitals on both mobile and desktop',
      'Conversion up 34% in the first quarter after launch',
      'Zero checkout failures during the Diwali flash sale',
    ],
    timeline: [
      { title: 'Edge architecture and cache strategy', date: ago(420), done: true },
      { title: 'Checkout rebuild', date: ago(395), done: true },
      { title: 'Migration of 18K SKUs', date: ago(380), done: true },
      { title: 'Go-live and load validation', date: ago(370), done: true },
    ],
    startDate: ago(430),
    dueDate: ago(370),
  },
  {
    key: 'omnisync',
    title: 'Omnisync Multi-Cloud Gateway',
    category: 'Integrations',
    order: 5,
    status: 'in-progress',
    progress: 64,
    shortDescription:
      'Cross-tenant synchronisation proxy reconciling hybrid legacy mainframes with distributed cloud object storage tiers over zero-loss streaming pipelines.',
    fullDescription:
      'Omnisync sits between on-premise ERP instances and cloud analytics endpoints, streaming records with exactly-once semantics so finance and data teams finally read the same numbers.',
    tags: ['Kafka', 'Python', 'AWS Gateway'],
    visualLabels: {
      caption: '16:10 OMNISYNC NODE GRAPH',
      tagline: 'CROSS-TIER SYNC PROXY',
      statusLine: 'ENTERPRISE LIVE',
      footLeft: 'BUFFER: ZERO LOSS',
      footRight: 'TLS 1.3 PINNED',
    },
    metrics: [
      { value: '0', label: 'Records lost' },
      { value: '11', label: 'Connected systems' },
      { value: '2.1M', label: 'Records per hour' },
      { value: 'TLS 1.3', label: 'Pinned transport' },
    ],
    problem:
      'Two ERPs and three cloud warehouses disagreed on revenue. Nightly CSV drops were the only integration, and reconciliation was an open item every month.',
    approach:
      'A streaming proxy with schema registry, exactly-once offsets and a dead-letter path, deployed alongside the mainframe without touching it.',
    features: [
      'Exactly-once delivery across Kafka topics',
      'Schema registry with backward-compatible evolution',
      'Dead-letter routing with operator replay',
      'Certificate-pinned TLS 1.3 transport',
    ],
    results: [
      'Zero record loss across 11 connected systems',
      'Finance close moved from day 6 to day 2',
      'Data freshness improved from 24 hours to 40 seconds',
    ],
    timeline: [
      { title: 'Schema inventory and mapping', date: ago(95), done: true },
      { title: 'Streaming proxy and offsets', date: ago(60), done: true },
      { title: 'Warehouse connectors', date: ahead(10), done: false },
      { title: 'Retire nightly CSV drops', date: ahead(40), done: false },
    ],
    startDate: ago(100),
    dueDate: ahead(50),
  },
 
  {
    key: 'pulsedesk',
    title: 'PulseDesk CRM',
    category: 'CRM ',
    order: 7,
    status: 'in-progress',
    progress: 45,
    shortDescription:
      'Agentic triage assistant parsing inbound customer inquiries, matching historical resolution vectors and synthesising first-line responses.',
    fullDescription:
      'PulseDesk reads every inbound ticket, classifies intent and urgency, matches it against resolved history, and drafts a reply for a human to approve. Agents stay in control; the routine 40% is simply pre-filled.',
    tags: ['FastAPI', 'Vector Search', 'React'],
    visualLabels: {
      caption: '16:10 PULSEDESK DASHBOARD',
      tagline: 'AUTO-TRIAGE QUEUE',
      statusLine: 'SLA VERIFIED',
      footLeft: 'QUEUE: AUTO-DISPATCH',
      footRight: 'RESOLUTION -52%',
    },
    metrics: [
      { value: '-52%', label: 'Resolution time' },
      { value: '71%', label: 'Auto-classified' },
      { value: '18s', label: 'Median triage' },
      { value: '4.7/5', label: 'Reply quality score' },
    ],
    problem:
      'Support agents spent the first 12 minutes of every ticket reading it, checking history and deciding who should own it. Repeat questions were answered from memory.',
    approach:
      'Embed the resolved-ticket corpus, retrieve the closest historical resolutions, and draft a reply that a human approves or edits before it is sent.',
    features: [
      'Intent and urgency classification on intake',
      'Vector retrieval over the resolved-ticket corpus',
      'Draft replies held for human approval',
      'Auto-dispatch to the right tier with an SLA clock',
    ],
    results: [
      'Median resolution time down 52%',
      '71% of tickets classified without a human touch',
      'Draft reply quality rated 4.7 out of 5 by agents',
    ],
    timeline: [
      { title: 'Corpus preparation and embedding', date: ago(55), done: true },
      { title: 'Retrieval and classification service', date: ago(25), done: true },
      { title: 'Agent approval console', date: ahead(20), done: false },
      { title: 'Pilot with the support team', date: ahead(55), done: false },
    ],
    startDate: ago(60),
    dueDate: ahead(70),
  },
];

async function clearDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Inquiry.deleteMany({}),
    Ticket.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Announcement.deleteMany({}),
    Invoice.deleteMany({}),
    Message.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
}

async function createUsers() {
  const admin = await User.create({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    passwordHash: env.ADMIN_PASSWORD,
    role: 'admin',
    isActive: true,
    mustChangePassword: false,
  });

  const employees = [];
  for (let i = 0; i < EMPLOYEES.length; i += 1) {
    const base = EMPLOYEES[i];
    // eslint-disable-next-line no-await-in-loop
    const doc = await User.create({
      ...base,
      passwordHash: SEED_PASSWORDS.employees[i],
      role: 'employee',
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: ago(2),
    });
    employees.push(doc);
  }

  const customers = [];
  for (let i = 0; i < CUSTOMERS.length; i += 1) {
    const base = CUSTOMERS[i];
    // eslint-disable-next-line no-await-in-loop
    const doc = await User.create({
      ...base,
      passwordHash: SEED_PASSWORDS.customers[i],
      role: 'customer',
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: ago(1),
    });
    customers.push(doc);
  }

  return { admin, employees, customers };
}

async function createProjects(admin, employees, customers) {
  const byKey = {};
  const assignees = [
    [employees[0], employees[2]],
    [employees[0]],
    [employees[0], employees[1]],
    [employees[2]],
    [employees[2], employees[0]],
    [employees[2], employees[1]],
    [employees[1], employees[0]],
  ];
  const customerFor = [
    customers[0],
    customers[0],
    customers[1],
    customers[1],
    customers[0],
    customers[1],
    customers[0],
  ];

  for (let i = 0; i < PROJECTS.length; i += 1) {
    const p = PROJECTS[i];
    const payload = {
      title: p.title,
      slug: toSlug(p.title),
      category: p.category,
      shortDescription: p.shortDescription,
      fullDescription: p.fullDescription,
      tags: p.tags,
      status: p.status,
      visualLabels: p.visualLabels,
      metrics: p.metrics,
      problem: p.problem,
      approach: p.approach,
      features: p.features,
      results: p.results,
      gallery: p.gallery || [],
      isFeatured: Boolean(p.isFeatured),
      isPublished: true,
      order: p.order,
      customer: customerFor[i] ? customerFor[i]._id : null,
      assignedEmployees: assignees[i].map((u) => u._id),
      progress: p.progress,
      startDate: p.startDate,
      dueDate: p.dueDate,
      timeline: p.timeline,
    };
    // eslint-disable-next-line no-await-in-loop
    const doc = await Project.create(payload);
    byKey[p.key] = doc;
  }

  await AuditLog.create({
    actor: admin._id,
    actorName: admin.name,
    actorRole: 'admin',
    action: 'create',
    entity: 'project',
    entityId: '',
    summary: `Seeded ${PROJECTS.length} projects including featured Project Apex`,
    ip: '127.0.0.1',
    timestamp: ago(0),
  });

  return byKey;
}

async function createTasks(projects, employees) {
  const [ravi, sana, imran] = employees;
  const rows = [
    // Project Apex
    {
      p: 'apex',
      t: 'Harden workflow state machine transitions',
      d: 'Cover every illegal transition with an explicit 409 and a logged audit entry.',
      u: ravi,
      s: 'in-progress',
      pr: 'high',
      due: ahead(4),
    },
    {
      p: 'apex',
      t: 'Design the billing run preview screen',
      d: 'Show per-customer totals, credit notes and the delta against the previous run before anything is committed.',
      u: sana,
      s: 'review',
      pr: 'medium',
      due: ahead(7),
    },
    {
      p: 'apex',
      t: 'Redis failover drill for the event bus',
      d: 'Simulate a primary loss during peak load and record the recovery window.',
      u: imran,
      s: 'todo',
      pr: 'urgent',
      due: ahead(2),
    },
    {
      p: 'apex',
      t: 'Backfill audit entries for migrated records',
      d: 'One-off script; must be idempotent and replay-safe.',
      u: ravi,
      s: 'done',
      pr: 'medium',
      due: ago(6),
    },
    {
      p: 'apex',
      t: 'Customer portal timeline component',
      d: 'Milestone timeline with done states and an overdue highlight.',
      u: sana,
      s: 'in-progress',
      pr: 'medium',
      due: ahead(10),
    },

    // LeadStream
    {
      p: 'leadstream',
      t: 'Partner SLA budget dashboard',
      d: 'Per-partner delivery windows with a burn-down of the remaining budget.',
      u: ravi,
      s: 'done',
      pr: 'low',
      due: ago(20),
    },
    {
      p: 'leadstream',
      t: 'Replay tooling for dropped batches',
      d: 'Operator command to re-run a batch with the original dedupe keys.',
      u: imran,
      s: 'done',
      pr: 'medium',
      due: ago(18),
    },

    // CoreFabric
    {
      p: 'corefabric',
      t: 'Signed regulator export bundle',
      d: 'Generate a single signed archive covering a full financial year.',
      u: ravi,
      s: 'in-progress',
      pr: 'high',
      due: ahead(9),
    },
    {
      p: 'corefabric',
      t: 'Nightly diff alerting to the ops channel',
      d: 'Post the reconciliation summary with any unmatched rows attached.',
      u: imran,
      s: 'todo',
      pr: 'medium',
      due: ahead(5),
    },
    {
      p: 'corefabric',
      t: 'Console accessibility pass',
      d: 'Keyboard navigation and contrast for the ledger table and filters.',
      u: sana,
      s: 'todo',
      pr: 'low',
      due: ahead(14),
    },

    // Horizon
    {
      p: 'horizon',
      t: 'Document the edge cache purge runbook',
      d: 'When to purge, when to wait for revalidation, and how to verify.',
      u: imran,
      s: 'done',
      pr: 'low',
      due: ago(60),
    },
    {
      p: 'horizon',
      t: 'Post-launch Core Web Vitals audit',
      d: 'Field data for the 4 weeks after go-live, split by device.',
      u: ravi,
      s: 'done',
      pr: 'medium',
      due: ago(55),
    },

    // Omnisync
    {
      p: 'omnisync',
      t: 'Dead-letter replay console',
      d: 'Let an operator inspect, edit and re-publish a failed record safely.',
      u: imran,
      s: 'in-progress',
      pr: 'high',
      due: ahead(6),
    },
    {
      p: 'omnisync',
      t: 'Schema registry compatibility checks',
      d: 'Reject any producer change that would break a downstream consumer.',
      u: ravi,
      s: 'todo',
      pr: 'medium',
      due: ahead(12),
    },

    // Transit
    {
      p: 'transit',
      t: 'Sensor coverage heat map',
      d: 'Spatial view of node health across the corridor with gap highlighting.',
      u: sana,
      s: 'review',
      pr: 'medium',
      due: ahead(3),
    },
    {
      p: 'transit',
      t: 'MQTT mesh reconnect tuning',
      d: 'Tune keep-alive and backoff so a node rejoins within 3 seconds.',
      u: imran,
      s: 'in-progress',
      pr: 'high',
      due: ahead(8),
    },

    // PulseDesk
    {
      p: 'pulsedesk',
      t: 'Evaluation set for classification accuracy',
      d: '500 labelled tickets covering the top 20 intents.',
      u: ravi,
      s: 'in-progress',
      pr: 'high',
      due: ahead(11),
    },
    {
      p: 'pulsedesk',
      t: 'Agent approval console layout',
      d: 'Side-by-side draft and history, with an explicit approve/edit split.',
      u: sana,
      s: 'todo',
      pr: 'medium',
      due: ahead(16),
    },
  ];

  const created = [];
  for (const r of rows) {
    // eslint-disable-next-line no-await-in-loop
    created.push(
      await Task.create({
        title: r.t,
        description: r.d,
        project: projects[r.p]._id,
        assignedTo: r.u._id,
        status: r.s,
        priority: r.pr,
        dueDate: r.due,
        comments:
          r.s === 'done'
            ? [{ user: r.u._id, text: 'Shipped and verified in staging.', at: ago(3) }]
            : [{ user: r.u._id, text: 'Picking this up today.', at: ago(1) }],
      }),
    );
  }
  return created;
}

async function createTickets(projects, customers, admin) {
  const [priya, vikram] = customers;
  const rows = [
    {
      c: priya,
      p: 'apex',
      s: 'Invoice PDF shows the old GSTIN on page 2',
      d: 'The header is correct but the footer still carries the previous GSTIN. This is on invoice KIN-INV exports only.',
      st: 'open',
      pr: 'high',
      replies: [
        {
          author: admin._id,
          role: 'admin',
          body: 'Reproduced. The template footer is cached separately — fixing in this sprint.',
          at: ago(1),
        },
      ],
    },
    {
      c: priya,
      p: 'horizon',
      s: 'Stock count is stale on the mobile category page',
      d: 'Desktop shows live stock, mobile appears to hold the cached value for about a minute.',
      st: 'in-progress',
      pr: 'medium',
      replies: [
        {
          author: admin._id,
          role: 'admin',
          body: 'Confirmed the edge TTL is longer on the mobile variant. Lowering it to 15 seconds.',
          at: ago(2),
        },
        {
          author: priya._id,
          role: 'customer',
          body: 'Thanks — 15 seconds works for us.',
          at: ago(2),
        },
      ],
    },
    {
      c: vikram,
      p: 'omnisync',
      s: 'Request: add a second warehouse endpoint for the Chennai region',
      d: 'We are standing up a Chennai facility next month and would like it added to the sync topology.',
      st: 'open',
      pr: 'low',
      replies: [],
    },
    {
      c: vikram,
      p: 'corefabric',
      s: 'Export fails for a date range longer than 12 months',
      d: 'Anything over a year returns a 504 at the gateway. Smaller ranges complete fine.',
      st: 'resolved',
      pr: 'urgent',
      replies: [
        {
          author: admin._id,
          role: 'admin',
          body: 'The export ran as a single query. Chunked it into monthly batches with a merged bundle.',
          at: ago(5),
        },
        {
          author: vikram._id,
          role: 'customer',
          body: 'Confirmed working — 18-month range returned in 40 seconds.',
          at: ago(4),
        },
      ],
    },
    {
      c: priya,
      p: 'apex',
      s: 'Bulk import: CSV with a trailing space in email is rejected',
      d: 'The error message does not say which row failed. Two of our partner files hit this.',
      st: 'open',
      pr: 'medium',
      replies: [],
    },
  ];

  const created = [];
  for (const r of rows) {
    // eslint-disable-next-line no-await-in-loop
    created.push(
      await Ticket.create({
        customer: r.c._id,
        project: projects[r.p]._id,
        subject: r.s,
        description: r.d,
        status: r.st,
        priority: r.pr,
        replies: r.replies,
      }),
    );
  }
  return created;
}

async function createLeaves(employees, admin) {
  const [ravi, sana, imran] = employees;
  const rows = [
    {
      u: sana,
      t: 'casual',
      from: ahead(6),
      to: ahead(7),
      r: 'Family function out of station.',
      st: 'pending',
    },
    {
      u: imran,
      t: 'sick',
      from: ago(12),
      to: ago(11),
      r: 'Viral fever, doctor advised rest.',
      st: 'approved',
      note: 'Approved — rest well.',
    },
    {
      u: ravi,
      t: 'earned',
      from: ahead(24),
      to: ahead(29),
      r: 'Annual break, handing over Apex work to Imran.',
      st: 'pending',
    },
    {
      u: sana,
      t: 'casual',
      from: ago(40),
      to: ago(40),
      r: 'Personal work at the bank.',
      st: 'rejected',
      note: 'Clashed with the Apex design review — please pick another date.',
    },
    {
      u: imran,
      t: 'emergency',
      from: ago(3),
      to: ago(2),
      r: 'Medical emergency at home.',
      st: 'approved',
      note: 'Approved immediately. Coverage arranged.',
    },
    {
      u: ravi,
      t: 'casual',
      from: ahead(2),
      to: ahead(2),
      r: 'Half day for a document appointment.',
      st: 'cancelled',
    },
  ];

  const created = [];
  for (const r of rows) {
    // eslint-disable-next-line no-await-in-loop
    created.push(
      await LeaveRequest.create({
        employee: r.u._id,
        type: r.t,
        fromDate: r.from,
        toDate: r.to,
        reason: r.r,
        status: r.st,
        reviewedBy: r.st === 'pending' || r.st === 'cancelled' ? null : admin._id,
        reviewNote: r.note || '',
      }),
    );
  }
  return created;
}

async function createAnnouncements(admin) {
  const rows = [
    {
      title: 'Apex release candidate 3 is live in staging',
      body: 'RC-3 is now available in staging. The billing run preview and the customer timeline are both in this build. Please log anything you find before Friday so we can cut the release.',
      audience: 'employees',
    },
    {
      title: 'Scheduled maintenance: Saturday 11:00 PM – 1:00 AM IST',
      body: 'The platform will be read-only for two hours while we run the database index rebuild. Portals will show a maintenance notice; no data will be lost.',
      audience: 'all',
    },
    {
      title: 'New invoice history is available in your portal',
      body: 'You can now open every invoice from your customer portal, download the PDF and see the payment status without emailing us. Overdue invoices are highlighted on your dashboard.',
      audience: 'customers',
    },
    {
      title: 'Support hours extended to 8 PM IST',
      body: 'Starting this week the support desk is staffed until 8 PM IST on weekdays. Urgent tickets raised after hours still page the on-call engineer.',
      audience: 'all',
    },
    {
      title: 'Security refresh: rotate your password this month',
      body: 'Please change your portal password before the end of the month. Use a password manager, and never reuse your work password anywhere else.',
      audience: 'employees',
    },
  ];

  const created = [];
  for (const r of rows) {
    // eslint-disable-next-line no-await-in-loop
    created.push(
      await Announcement.create({
        title: r.title,
        body: r.body,
        audience: r.audience,
        createdBy: admin._id,
        isPublished: true,
      }),
    );
  }
  return created;
}

async function createInvoices(projects, customers) {
  const [priya, vikram] = customers;
  const rows = [
    {
      c: priya,
      p: 'apex',
      amount: 480000,
      due: ago(9),
      st: 'paid',
      notes: 'Milestone 3 — workflow engine and audit layer.',
    },
    {
      c: priya,
      p: 'apex',
      amount: 360000,
      due: ahead(8),
      st: 'pending',
      notes: 'Milestone 4 — billing and reporting modules.',
    },
    {
      c: priya,
      p: 'horizon',
      amount: 225000,
      due: ago(45),
      st: 'paid',
      notes: 'Final handover and runbook delivery.',
    },
    {
      c: vikram,
      p: 'omnisync',
      amount: 540000,
      due: ago(6),
      st: 'overdue',
      notes: 'Phase 2 — warehouse connectors. Reminder sent.',
    },
    {
      c: vikram,
      p: 'corefabric',
      amount: 310000,
      due: ahead(15),
      st: 'pending',
      notes: 'Reconciliation engine milestone.',
    },
    {
      c: vikram,
      p: 'transit',
      amount: 175000,
      due: ago(28),
      st: 'paid',
      notes: 'Full corridor rollout.',
    },
  ];

  const created = [];
  for (const r of rows) {
    // eslint-disable-next-line no-await-in-loop
    created.push(
      await Invoice.create({
        customer: r.c._id,
        project: projects[r.p]._id,
        amount: r.amount,
        currency: 'INR',
        dueDate: r.due,
        status: r.st,
        notes: r.notes,
        fileUrl: '',
      }),
    );
  }
  return created;
}

async function createMessages(projects, employees, customers, admin) {
  const [ravi, sana, imran] = employees;
  const [priya, vikram] = customers;
  const rows = [
    {
      p: 'apex',
      u: admin,
      r: 'admin',
      b: 'Kickoff notes are in the project doc. First checkpoint is the workflow engine review.',
    },
    {
      p: 'apex',
      u: ravi,
      r: 'employee',
      b: 'State machine is done for lead, dispatch and invoice. Billing transitions land this week.',
    },
    {
      p: 'apex',
      u: priya,
      r: 'customer',
      b: 'Please make sure the invoice preview shows credit notes too — finance asked for that.',
    },
    {
      p: 'apex',
      u: sana,
      r: 'employee',
      b: 'Timeline component is in review. Feedback welcome before Thursday.',
    },
    {
      p: 'omnisync',
      u: imran,
      r: 'employee',
      b: 'Dead-letter console is up in staging. Replaying a record now takes two clicks.',
    },
    {
      p: 'omnisync',
      u: vikram,
      r: 'customer',
      b: 'Good. Can we also get a daily count of dead-letter records in the summary email?',
    },
    {
      p: 'corefabric',
      u: ravi,
      r: 'employee',
      b: 'Signed export bundle works for a full financial year. Next up: chunked range exports.',
    },
    {
      p: 'transit',
      u: imran,
      r: 'employee',
      b: 'Reconnect tuning cut node rejoin to 2.4 seconds on the pilot stretch.',
    },
    {
      p: 'pulsedesk',
      u: sana,
      r: 'employee',
      b: 'Approval console layout is ready for review — draft on the left, history on the right.',
    },
    {
      p: 'horizon',
      u: priya,
      r: 'customer',
      b: 'Mobile stock cache is better now, still see a short delay during peak hours.',
    },
  ];

  const created = [];
  for (const r of rows) {
    // eslint-disable-next-line no-await-in-loop
    created.push(
      await Message.create({
        project: projects[r.p]._id,
        sender: r.u._id,
        senderRole: r.r,
        body: r.b,
        readBy: [admin._id],
      }),
    );
  }
  return created;
}

async function createInquiries() {
  const rows = [
    {
      name: 'Amit Verma',
      email: 'amit@vertexfoods.in',
      phone: '+91 97000 30001',
      type: 'contact',
      si: 'CRM ',
      st: 'new',
      d: ago(1),
      m: 'We run 14 outlets and our lead follow-up is still on WhatsApp. Can you automate the intake and follow-up?',
    },
    {
      name: 'Neha Kapoor',
      email: 'neha@brightpathacademy.in',
      phone: '+91 97000 30002',
      type: 'briefing',
      si: 'Web Applications',
      st: 'contacted',
      d: ago(3),
      m: 'Looking for a parent portal with fee payment, attendance and exam results. Roughly 2,400 students.',
    },
    {
      name: 'Sameer Khan',
      email: 'sameer@khanmotors.in',
      phone: '',
      type: 'contact',
      si: 'Integrations',
      st: 'new',
      d: ago(5),
      m: 'Our ERP and the service CRM do not talk to each other. Need a nightly sync at minimum.',
    },
    {
      name: 'Divya Reddy',
      email: 'divya@aurorahospitals.in',
      phone: '+91 97000 30004',
      type: 'briefing',
      si: 'Custom Software',
      st: 'contacted',
      d: ago(8),
      m: 'Patient scheduling and a doctor rota tool. Compliance requirements are strict, happy to discuss.',
    },
    {
      name: 'Harshit Jain',
      email: 'harshit@jainsteel.in',
      phone: '+91 97000 30005',
      type: 'contact',
      si: 'CRM ',
      st: 'closed',
      d: ago(12),
      m: 'Quotation follow-ups slip through the cracks. Want an automated reminder engine.',
    },
    {
      name: 'Ritu Saxena',
      email: 'ritu@maplehomes.in',
      phone: '+91 97000 30006',
      type: 'contact',
      si: 'Web Applications',
      st: 'new',
      d: ago(16),
      m: 'Need a listings site with lead capture and a callback queue. Budget is modest.',
    },
    {
      name: 'Ajay Pratap',
      email: 'ajay@prayagrajlogistics.in',
      phone: '+91 97000 30007',
      type: 'briefing',
      si: 'Integrations',
      st: 'contacted',
      d: ago(20),
      m: 'Fleet tracking data needs to land in our accounting system in real time.',
    },
    {
      name: 'Farah Sheikh',
      email: 'farah@nookcafes.in',
      phone: '',
      type: 'contact',
      si: 'CRM',
      st: 'new',
      d: ago(24),
      m: 'Loyalty programme and automated WhatsApp campaigns for 6 cafes.',
    },
    {
      name: 'Manoj Gupta',
      email: 'manoj@guptatextiles.in',
      phone: '+91 97000 30009',
      type: 'contact',
      si: 'Custom Software',
      st: 'closed',
      d: ago(31),
      m: 'Inventory and order management for a wholesale textile business.',
    },
    {
      name: 'Kavya Nair',
      email: 'kavya@edgeworks.in',
      phone: '+91 97000 30010',
      type: 'briefing',
      si: 'Web Applications',
      st: 'new',
      d: ago(38),
      m: 'Marketplace build for local artisans, with vendor onboarding and payouts.',
    },
  ];

  const created = [];
  for (const r of rows) {
    // eslint-disable-next-line no-await-in-loop
    created.push(
      await Inquiry.create({
        name: r.name,
        email: r.email,
        phone: r.phone,
        message: r.m,
        type: r.type,
        serviceInterest: r.si,
        status: r.st,
        ipAddress: '127.0.0.1',
        notes: r.st === 'closed' ? 'Converted to a paid engagement.' : '',
        createdAt: r.d,
        updatedAt: r.d,
      }),
    );
  }
  return created;
}

async function createAuditEntries(admin, employees, projects) {
  const rows = [
    {
      actor: admin,
      action: 'create',
      entity: 'employee',
      summary: `Created employee account ${employees[0].employeeId}`,
      id: employees[0]._id,
      d: ago(760),
    },
    {
      actor: admin,
      action: 'status-change',
      entity: 'project',
      summary: 'Published "Horizon Digital Storefront"',
      id: projects.horizon._id,
      d: ago(370),
    },
    {
      actor: admin,
      action: 'update',
      entity: 'project',
      summary: 'Marked "LeadStream ERP Router" as completed',
      id: projects.leadstream._id,
      d: ago(240),
    },
    {
      actor: admin,
      action: 'login',
      entity: 'session',
      summary: 'Admin signed in',
      id: '',
      d: ago(1),
    },
    {
      actor: admin,
      action: 'update',
      entity: 'settings',
      summary: 'Updated company contact details',
      id: '',
      d: ago(4),
    },
    {
      actor: admin,
      action: 'export',
      entity: 'invoice',
      summary: 'Exported invoice register for the quarter',
      id: '',
      d: ago(9),
    },
  ];

  const created = [];
  for (const r of rows) {
    // eslint-disable-next-line no-await-in-loop
    created.push(
      await AuditLog.create({
        actor: r.actor._id,
        actorName: r.actor.name,
        actorRole: r.actor.role,
        action: r.action,
        entity: r.entity,
        entityId: r.id ? String(r.id) : '',
        summary: r.summary,
        ip: '127.0.0.1',
        meta: null,
        timestamp: r.d,
      }),
    );
  }
  return created;
}

function printCredentials(admin, employees, customers) {
  heading('SEED COMPLETE — LOGIN CREDENTIALS');

  const rows = [
    ['ADMIN (admin panel)', admin.email, env.ADMIN_PASSWORD],
    ...employees.map((e, i) => [
      `EMPLOYEE ${i + 1} · ${e.employeeId}`,
      e.email,
      SEED_PASSWORDS.employees[i],
    ]),
    ...customers.map((c, i) => [
      `CUSTOMER ${i + 1} · ${c.companyName}`,
      c.email,
      SEED_PASSWORDS.customers[i],
    ]),
  ];

  const w0 = Math.max(...rows.map((r) => r[0].length));
  const w1 = Math.max(...rows.map((r) => r[1].length));

  console.log(`\n  ${'PORTAL'.padEnd(w0)}  ${'EMAIL'.padEnd(w1)}  PASSWORD`);
  console.log(`  ${'-'.repeat(w0)}  ${'-'.repeat(w1)}  ${'-'.repeat(20)}`);
  rows.forEach((r) => {
    console.log(`  ${r[0].padEnd(w0)}  ${r[1].padEnd(w1)}  ${r[2]}`);
  });

  console.log(`
  Login endpoints (one per portal, one cookie per portal):
    POST http://localhost:5000/api/v1/auth/admin/login
    POST http://localhost:5000/api/v1/auth/employee/login
    POST http://localhost:5000/api/v1/auth/customer/login

  Seed data: 7 projects (Project Apex featured), ${'tasks/tickets/leave/invoices/messages/announcements/inquiries'}.`);
}

async function seed() {
  heading('KINETIC SEED');
  await connectDB();

  console.log(' Clearing collections...');
  await clearDatabase();

  console.log(' Creating users...');
  const { admin, employees, customers } = await createUsers();

  console.log(' Creating projects...');
  const projects = await createProjects(admin, employees, customers);

  console.log(' Creating tasks, tickets, leave requests...');
  const tasks = await createTasks(projects, employees);
  const tickets = await createTickets(projects, customers, admin);
  const leaves = await createLeaves(employees, admin);

  console.log(' Creating announcements, invoices, messages...');
  const announcements = await createAnnouncements(admin);
  const invoices = await createInvoices(projects, customers);
  const messages = await createMessages(projects, employees, customers, admin);

  console.log(' Creating inquiries and audit entries...');
  const inquiries = await createInquiries();
  const audits = await createAuditEntries(admin, employees, projects);

  printCredentials(admin, employees, customers);

  console.log(
    `\n  Counts → users: ${1 + employees.length + customers.length}, projects: ${Object.keys(projects).length}, tasks: ${tasks.length}, tickets: ${
      tickets.length
    }, leaves: ${leaves.length}, announcements: ${announcements.length}, invoices: ${invoices.length}, messages: ${messages.length}, inquiries: ${
      inquiries.length
    }, audit: ${audits.length}`,
  );
  console.log(`\n${line('=')}\n`);

  await disconnectDB();
}

seed().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error('\n[seed] Failed:', err && err.stack ? err.stack : err);
  try {
    await mongoose.connection.close();
  } catch (_e) {
    /* ignore */
  }
  process.exit(1);
});
