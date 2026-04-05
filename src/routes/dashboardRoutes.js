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

/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Dashboard overview
 *     description: Aggregated dashboard data. Requires analyst or admin.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Overview payload
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden — insufficient role
 */
router.get('/overview', getOverview);
/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Financial summary
 *     description: High-level totals and metrics. Requires analyst or admin.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Summary data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden — insufficient role
 */
router.get('/summary', getSummary);
/**
 * @swagger
 * /dashboard/category-breakdown:
 *   get:
 *     summary: Spending or income by category
 *     description: Requires analyst or admin.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Category breakdown
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden — insufficient role
 */
router.get('/category-breakdown', getCategoryBreakdown);
/**
 * @swagger
 * /dashboard/monthly-trends:
 *   get:
 *     summary: Monthly trend series
 *     description: Requires analyst or admin.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Monthly trends
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden — insufficient role
 */
router.get('/monthly-trends', getMonthlyTrends);
/**
 * @swagger
 * /dashboard/weekly-trends:
 *   get:
 *     summary: Weekly trend series
 *     description: Requires analyst or admin.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Weekly trends
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden — insufficient role
 */
router.get('/weekly-trends', getWeeklyTrends);
/**
 * @swagger
 * /dashboard/recent-activity:
 *   get:
 *     summary: Recent transactions or activity feed
 *     description: Requires analyst or admin.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Recent activity
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden — insufficient role
 */
router.get('/recent-activity', getRecentActivity);

module.exports = router;
