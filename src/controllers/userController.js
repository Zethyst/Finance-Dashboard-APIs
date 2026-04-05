const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * GET /api/users
 * Admin only — list all users with optional filters and pagination
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const filter = {};

  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  sendSuccess(
    res, 200, 'Users fetched.',
    { users: users.map((u) => u.toSafeObject()) },
    buildPaginationMeta(total, page, limit)
  );
});

/**
 * GET /api/users/:id
 * Admin only — fetch a single user by ID
 */
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));

  sendSuccess(res, 200, 'User fetched.', { user: user.toSafeObject() });
});

/**
 * PATCH /api/users/:id
 * Admin only — update a user's name, role, or status
 */
const updateUser = asyncHandler(async (req, res, next) => {
  // Prevent an admin from accidentally deactivating themselves
  if (req.params.id === String(req.user._id) && req.body.status === 'inactive') {
    return next(new AppError('You cannot deactivate your own account.', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!user) return next(new AppError('User not found.', 404));

  sendSuccess(res, 200, 'User updated.', { user: user.toSafeObject() });
});

/**
 * DELETE /api/users/:id
 * Admin only — permanently delete a user
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  if (req.params.id === String(req.user._id)) {
    return next(new AppError('You cannot delete your own account.', 400));
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));

  sendSuccess(res, 200, 'User deleted.');
});

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
