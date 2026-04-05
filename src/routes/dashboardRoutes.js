const express = require('express');
const router = express.Router();
const {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
  getOverview,
} = require('../controllers/dashboardController');
const { protect, requireRoleLevel } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// All dashboard routes require at least analyst level
router.use(protect, requireRoleLevel(ROLES.ANALYST));

router.get('/overview', getOverview);
router.get('/summary', getSummary);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/monthly-trends', getMonthlyTrends);
router.get('/weekly-trends', getWeeklyTrends);
router.get('/recent-activity', getRecentActivity);

module.exports = router;
