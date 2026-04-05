const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLE_LEVELS } = require('../config/constants');

/**
 * Verifies the JWT in the Authorization header and attaches the user to req.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  const user = await User.findById(decoded.id).select('+status +role');
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (user.status === 'inactive') {
    return next(new AppError('Your account has been deactivated. Contact an administrator.', 403));
  }

  req.user = user;
  next();
});

/**
 * Restricts access to users with one of the specified roles.
 * Usage: restrictTo('admin', 'analyst')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`,
          403
        )
      );
    }
    next();
  };
};

/**
 * Restricts access to users at or above a minimum role level.
 * Usage: requireRoleLevel('analyst') — allows analyst and admin
 */
const requireRoleLevel = (minRole) => {
  return (req, res, next) => {
    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const requiredLevel = ROLE_LEVELS[minRole] || 0;

    if (userLevel < requiredLevel) {
      return next(
        new AppError(
          `Access denied. You need at least '${minRole}' role to perform this action.`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { protect, restrictTo, requireRoleLevel };