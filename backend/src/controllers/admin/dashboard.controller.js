'use strict';

const User = require('../../models/User');
const Project = require('../../models/Project');
const Inquiry = require('../../models/Inquiry');
const Ticket = require('../../models/Ticket');
const LeaveRequest = require('../../models/LeaveRequest');
const Invoice = require('../../models/Invoice');
const Task = require('../../models/Task');
const AuditLog = require('../../models/AuditLog');
const { wrapHandlers } = require('../../utils/asyncHandler');

function startOfBucketDaysAgo(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

/** GET /admin/stats — headline numbers for the admin dashboard. */
async function getStats(_req, res) {
  const since30d = startOfBucketDaysAgo(30);

  const [
    employees,
    activeEmployees,
    customers,
    projectsTotal,
    projectsPublished,
    projectsActive,
    projectsCompleted,
    inquiriesTotal,
    inquiriesNew,
    ticketsOpen,
    ticketsInProgress,
    leavesPending,
    tasksOpen,
    pendingInvoices,
    overdueInvoices,
    paidRevenueAgg,
    recentInquiries,
    recentActivity,
  ] = await Promise.all([
    User.countDocuments({ role: 'employee' }),
    User.countDocuments({ role: 'employee', isActive: true }),
    User.countDocuments({ role: 'customer' }),
    Project.countDocuments({}),
    Project.countDocuments({ isPublished: true }),
    Project.countDocuments({ status: { $in: ['planning', 'in-progress', 'review'] } }),
    Project.countDocuments({ status: 'completed' }),
    Inquiry.countDocuments({}),
    Inquiry.countDocuments({ status: 'new' }),
    Ticket.countDocuments({ status: 'open' }),
    Ticket.countDocuments({ status: 'in-progress' }),
    LeaveRequest.countDocuments({ status: 'pending' }),
    Task.countDocuments({ status: { $in: ['todo', 'in-progress', 'review'] } }),
    Invoice.countDocuments({ status: 'pending' }),
    Invoice.countDocuments({ status: 'overdue' }),
    Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Inquiry.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email type status createdAt')
      .lean(),
    AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(6)
      .select('actorName action entity summary timestamp')
      .lean(),
  ]);

  const revenue = paidRevenueAgg.length ? paidRevenueAgg[0].total : 0;

  return res.status(200).json({
    success: true,
    data: {
      employees: { total: employees, active: activeEmployees },
      customers: { total: customers },
      projects: {
        total: projectsTotal,
        published: projectsPublished,
        active: projectsActive,
        completed: projectsCompleted,
      },
      inquiries: {
        total: inquiriesTotal,
        new: inquiriesNew,
        last30Days: await Inquiry.countDocuments({ createdAt: { $gte: since30d } }),
      },
      tickets: {
        open: ticketsOpen,
        inProgress: ticketsInProgress,
        resolved: await Ticket.countDocuments({ status: 'resolved' }),
      },
      leaves: { pending: leavesPending },
      tasks: { open: tasksOpen },
      invoices: { pending: pendingInvoices, overdue: overdueInvoices, revenue },
      recentInquiries,
      recentActivity,
    },
    message: 'Dashboard stats fetched',
  });
}

/** GET /admin/charts — data sets for the dashboard charts. */
async function getCharts(_req, res) {
  const from = startOfBucketDaysAgo(55);

  const [inquiryDocs, projectsByStatus, tasksByStatus, ticketsByStatus, monthlyRevenue] =
    await Promise.all([
      Inquiry.find({ createdAt: { $gte: from } })
        .select('createdAt')
        .lean(),
      Project.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
      Ticket.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
      Invoice.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: startOfBucketDaysAgo(364) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, month: '$_id', total: 1, count: 1 } },
      ]),
    ]);

  // 8 weekly buckets, oldest first, built in JS so no server-side date quirks.
  const buckets = [];
  for (let i = 7; i >= 0; i -= 1) {
    const end = startOfBucketDaysAgo(i * 7);
    const start = startOfBucketDaysAgo(i * 7 + 7);
    buckets.push({
      weekStart: start.toISOString().slice(0, 10),
      weekEnd: end.toISOString().slice(0, 10),
      label: end.toISOString().slice(5, 10),
      count: inquiryDocs.filter((d) => d.createdAt >= start && d.createdAt < end).length,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      inquiriesPerWeek: buckets,
      projectsByStatus,
      tasksByStatus,
      ticketsByStatus,
      monthlyRevenue,
    },
    message: 'Chart data fetched',
  });
}

module.exports = wrapHandlers({ getStats, getCharts });
