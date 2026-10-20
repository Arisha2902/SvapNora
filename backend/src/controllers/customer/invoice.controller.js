'use strict';

const Invoice = require('../../models/Invoice');
const ApiError = require('../../utils/ApiError');
const { wrapHandlers } = require('../../utils/asyncHandler');
const { getPagination, buildMeta, escapeRegex } = require('../../utils/pagination');

/** GET /customer/invoices — own invoices only. */
async function listInvoices(req, res) {
  const { page, limit, skip, search } = getPagination(req.query);
  const filter = { customer: req.user._id };

  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ number: re }, { notes: re }];
  }
  if (req.query.status) filter.status = req.query.status;

  const [total, items, totals] = await Promise.all([
    Invoice.countDocuments(filter),
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('project', 'title slug')
      .select('-customer -__v')
      .lean(),
    Invoice.aggregate([
      { $match: { customer: req.user._id } },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', total: 1, count: 1 } },
    ]),
  ]);

  return res.status(200).json({
    success: true,
    data: { items, meta: buildMeta(total, page, limit), totals },
    message: 'Invoices fetched',
  });
}

/** GET /customer/invoices/:id — own only. */
async function getInvoice(req, res) {
  const invoice = await Invoice.findOne({ _id: req.params.id, customer: req.user._id })
    .populate('project', 'title slug')
    .select('-customer -__v')
    .lean();
  if (!invoice) throw ApiError.notFound('Invoice not found');

  return res.status(200).json({ success: true, data: invoice, message: 'Invoice fetched' });
}

module.exports = wrapHandlers({ listInvoices, getInvoice });
