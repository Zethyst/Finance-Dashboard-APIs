const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * Build a MongoDB filter object from query params.
 */
const buildFilter = (query) => {
  const filter = {};

  if (query.type) filter.type = query.type;
  if (query.category) filter.category = query.category;

  // Date range filters
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end day
      filter.date.$lte = end;
    }
  }

  // Amount range filters
  if (query.minAmount || query.maxAmount) {
    filter.amount = {};
    if (query.minAmount) filter.amount.$gte = parseFloat(query.minAmount);
    if (query.maxAmount) filter.amount.$lte = parseFloat(query.maxAmount);
  }

  // Full-text search on description
  if (query.search) {
    filter.description = new RegExp(query.search, 'i');
  }

  return filter;
};

/**
 * GET /api/transactions
 * Analyst + Admin — paginated list with filters
 */
const getAllTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = buildFilter(req.query);

  // Determine sort order (default: most recent first)
  const sortField = req.query.sortBy || 'date';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('createdBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  sendSuccess(
    res, 200, 'Transactions fetched.',
    { transactions },
    buildPaginationMeta(total, page, limit)
  );
});

/**
 * GET /api/transactions/:id
 * Analyst + Admin — fetch a single transaction
 */
const getTransactionById = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id).populate(
    'createdBy',
    'name email role'
  );

  if (!transaction) return next(new AppError('Transaction not found.', 404));

  sendSuccess(res, 200, 'Transaction fetched.', { transaction });
});

/**
 * POST /api/transactions
 * Admin only — create a new transaction
 */
const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.create({
    ...req.body,
    createdBy: req.user._id,
  });

  const populated = await transaction.populate('createdBy', 'name email role');
  sendSuccess(res, 201, 'Transaction created.', { transaction: populated });
});

/**
 * PATCH /api/transactions/:id
 * Admin only — update an existing transaction
 */
const updateTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email role');

  if (!transaction) return next(new AppError('Transaction not found.', 404));

  sendSuccess(res, 200, 'Transaction updated.', { transaction });
});

/**
 * DELETE /api/transactions/:id
 * Admin only — soft delete a transaction
 */
const deleteTransaction = asyncHandler(async (req, res, next) => {
  // Manually bypass the isDeleted pre-query hook to find + mark
  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true }
  );

  if (!transaction) return next(new AppError('Transaction not found.', 404));

  sendSuccess(res, 200, 'Transaction deleted.');
});

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
