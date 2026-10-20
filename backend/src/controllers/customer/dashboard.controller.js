'use strict';

const Project = require('../../models/Project');
const Ticket = require('../../models/Ticket');
const Invoice = require('../../models/Invoice');
const Announcement = require('../../models/Announcement');
const { wrapHandlers } = require('../../utils/asyncHandler');

/** GET /customer/stats */
async function getStats(req, res) {
  const me = req.user._id;

  const [
    activeProjects,
    totalProjects,
    openTickets,
    newTickets,
    pendingInvoices,
    overdueInvoices,
    paidInvoices,
    invoiceTotals,
    latestAnnouncement,
    recentProjects,
  ] = await Promise.all([
    Project.countDocuments({
      customer: me,
      status: { $in: ['planning', 'in-progress', 'review'] },
    }),
    Project.countDocuments({ customer: me }),
    Ticket.countDocuments({ customer: me, status: { $in: ['open', 'in-progress'] } }),
    Ticket.countDocuments({ customer: me, status: 'open' }),
    Invoice.countDocuments({ customer: me, status: 'pending' }),
    Invoice.countDocuments({ customer: me, status: 'overdue' }),
    Invoice.countDocuments({ customer: me, status: 'paid' }),
    Invoice.aggregate([
      { $match: { customer: me } },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', total: 1, count: 1 } },
    ]),
    Announcement.findOne({ audience: { $in: ['all', 'customers'] }, isPublished: true })
      .sort({ createdAt: -1 })
      .select('title body audience createdAt')
      .lean(),
    Project.find({ customer: me })
      .sort({ updatedAt: -1 })
      .limit(4)
      .select('title slug status progress category updatedAt')
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      projects: { active: activeProjects, total: totalProjects, recent: recentProjects },
      tickets: { open: openTickets, waitingOnUs: newTickets },
      invoices: {
        pending: pendingInvoices,
        overdue: overdueInvoices,
        paid: paidInvoices,
        totals: invoiceTotals,
      },
      announcement: latestAnnouncement,
    },
    message: 'Customer dashboard fetched',
  });
}

module.exports = wrapHandlers({ getStats });
