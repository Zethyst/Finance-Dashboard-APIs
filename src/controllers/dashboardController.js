const Transaction = require('../models/Transaction');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Helper: Build a date-range match stage for aggregation pipelines.
 * Defaults to current month if no range is provided.
 */
const buildDateMatch = (query) => {
  if (query.startDate || query.endDate) {
    const dateFilter = {};
    if (query.startDate) dateFilter.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    return { date: dateFilter };
  }

  // Default: current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { date: { $gte: startOfMonth, $lte: endOfMonth } };
};

/**
 * GET /api/dashboard/summary
 * Analyst + Admin
 * Returns: total income, total expenses, net balance, transaction count
 */
const getSummary = asyncHandler(async (req, res) => {
  const dateMatch = buildDateMatch(req.query);

  const result = await Transaction.aggregate([
    { $match: dateMatch },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const r of result) {
    if (r._id === 'income') { totalIncome = r.total; incomeCount = r.count; }
    if (r._id === 'expense') { totalExpenses = r.total; expenseCount = r.count; }
  }

  sendSuccess(res, 200, 'Summary fetched.', {
    summary: {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      netBalance: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      transactionCount: incomeCount + expenseCount,
      incomeCount,
      expenseCount,
    },
  });
});

/**
 * GET /api/dashboard/category-breakdown
 * Analyst + Admin
 * Returns per-category totals, split by type
 */
const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const dateMatch = buildDateMatch(req.query);

  const result = await Transaction.aggregate([
    { $match: dateMatch },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    {
      $group: {
        _id: '$_id.type',
        categories: {
          $push: {
            category: '$_id.category',
            total: { $round: ['$total', 2] },
            count: '$count',
          },
        },
        typeTotal: { $sum: '$total' },
      },
    },
  ]);

  sendSuccess(res, 200, 'Category breakdown fetched.', { breakdown: result });
});

/**
 * GET /api/dashboard/monthly-trends
 * Analyst + Admin
 * Returns monthly income vs expense totals for the past N months (default 6)
 */
const getMonthlyTrends = asyncHandler(async (req, res) => {
  const months = Math.min(parseInt(req.query.months) || 6, 24);
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const result = await Transaction.aggregate([
    { $match: { date: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $group: {
        _id: { year: '$_id.year', month: '$_id.month' },
        entries: {
          $push: { type: '$_id.type', total: { $round: ['$total', 2] }, count: '$count' },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Reshape into a flat, frontend-friendly format
  const trends = result.map(({ _id, entries }) => {
    const income = entries.find((e) => e.type === 'income') || { total: 0, count: 0 };
    const expense = entries.find((e) => e.type === 'expense') || { total: 0, count: 0 };
    return {
      year: _id.year,
      month: _id.month,
      label: new Date(_id.year, _id.month - 1).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      }),
      income: income.total,
      expenses: expense.total,
      net: parseFloat((income.total - expense.total).toFixed(2)),
      totalTransactions: income.count + expense.count,
    };
  });

  sendSuccess(res, 200, 'Monthly trends fetched.', { trends });
});

/**
 * GET /api/dashboard/weekly-trends
 * Analyst + Admin
 * Returns daily totals for the past 7 days
 */
const getWeeklyTrends = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const result = await Transaction.aggregate([
    { $match: { date: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  // Build a full 7-day map, filling in zero for missing days
  const dayMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    dayMap[key] = {
      date: d.toISOString().split('T')[0],
      label: d.toLocaleString('default', { weekday: 'short', month: 'short', day: 'numeric' }),
      income: 0,
      expenses: 0,
      net: 0,
    };
  }

  for (const r of result) {
    const key = `${r._id.year}-${r._id.month}-${r._id.day}`;
    if (dayMap[key]) {
      if (r._id.type === 'income') dayMap[key].income = parseFloat(r.total.toFixed(2));
      if (r._id.type === 'expense') dayMap[key].expenses = parseFloat(r.total.toFixed(2));
      dayMap[key].net = parseFloat((dayMap[key].income - dayMap[key].expenses).toFixed(2));
    }
  }

  sendSuccess(res, 200, 'Weekly trends fetched.', { trends: Object.values(dayMap) });
});

/**
 * GET /api/dashboard/recent-activity
 * Analyst + Admin
 * Returns the N most recent transactions (default 10)
 */
const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const transactions = await Transaction.find()
    .populate('createdBy', 'name email')
    .sort({ date: -1 })
    .limit(limit);

  sendSuccess(res, 200, 'Recent activity fetched.', { transactions });
});

/**
 * GET /api/dashboard/overview
 * Analyst + Admin
 * Combines summary + category breakdown + recent activity in one call
 * to reduce round-trips for the main dashboard view
 */
const getOverview = asyncHandler(async (req, res) => {
  const dateMatch = buildDateMatch(req.query);

  const [summaryRaw, categoryRaw, recent] = await Promise.all([
    Transaction.aggregate([
      { $match: dateMatch },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Transaction.find()
      .populate('createdBy', 'name email')
      .sort({ date: -1 })
      .limit(5),
  ]);

  let totalIncome = 0, totalExpenses = 0, incomeCount = 0, expenseCount = 0;
  for (const r of summaryRaw) {
    if (r._id === 'income') { totalIncome = r.total; incomeCount = r.count; }
    if (r._id === 'expense') { totalExpenses = r.total; expenseCount = r.count; }
  }

  sendSuccess(res, 200, 'Dashboard overview fetched.', {
    summary: {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      netBalance: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      transactionCount: incomeCount + expenseCount,
    },
    topCategories: categoryRaw.slice(0, 5).map((c) => ({
      category: c._id.category,
      type: c._id.type,
      total: parseFloat(c.total.toFixed(2)),
      count: c.count,
    })),
    recentActivity: recent,
  });
});

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
  getOverview,
};
