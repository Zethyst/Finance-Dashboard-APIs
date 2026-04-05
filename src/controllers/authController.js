const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * POST /api/auth/register
 * Public — create a new user account
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const user = await User.create({ name, email, password, role });
  const token = generateToken(user._id);

  sendSuccess(res, 201, 'Account created successfully.', {
    token,
    user: user.toSafeObject(),
  });
});

/**
 * POST /api/auth/login
 * Public — authenticate and receive a JWT
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (user.status === 'inactive') {
    return next(new AppError('Your account has been deactivated. Contact an administrator.', 403));
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  sendSuccess(res, 200, 'Logged in successfully.', {
    token,
    user: user.toSafeObject(),
  });
});

/**
 * GET /api/auth/me
 * Protected — return the currently authenticated user
 */
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Profile fetched.', { user: req.user.toSafeObject() });
});

/**
 * PATCH /api/auth/change-password
 * Protected — change the authenticated user's password
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id);
  sendSuccess(res, 200, 'Password changed successfully.', { token });
});

module.exports = { register, login, getMe, changePassword };
