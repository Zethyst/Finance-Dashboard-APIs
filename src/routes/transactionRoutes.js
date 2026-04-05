const express = require('express');
const router = express.Router();
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const { protect, requireRoleLevel, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTransactionSchema, updateTransactionSchema } = require('../validators/transactionValidator');
const { ROLES } = require('../config/constants');

// All transaction routes require authentication
router.use(protect);

// Read operations — analyst and admin
router.get('/', requireRoleLevel(ROLES.ANALYST), getAllTransactions);
router.get('/:id', requireRoleLevel(ROLES.ANALYST), getTransactionById);

// Write operations — admin only
router.post('/', restrictTo(ROLES.ADMIN), validate(createTransactionSchema), createTransaction);
router.patch('/:id', restrictTo(ROLES.ADMIN), validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', restrictTo(ROLES.ADMIN), deleteTransaction);

module.exports = router;
