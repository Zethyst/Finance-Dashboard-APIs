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
/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: List transactions
 *     description: Requires analyst or admin role.
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: List of transactions
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden — insufficient role (viewer cannot access)
 */
router.get('/', requireRoleLevel(ROLES.ANALYST), getAllTransactions);
/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     description: Requires analyst or admin role.
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction found
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden — insufficient role
 *       404:
 *         description: Transaction not found
 */
router.get('/:id', requireRoleLevel(ROLES.ANALYST), getTransactionById);

// Write operations — admin only
/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a transaction
 *     description: Admin only.
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category]
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 exclusiveMinimum: 0
 *                 example: 99.99
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *                 enum:
 *                   - salary
 *                   - freelance
 *                   - investment
 *                   - rental
 *                   - business
 *                   - food
 *                   - transport
 *                   - utilities
 *                   - entertainment
 *                   - healthcare
 *                   - education
 *                   - shopping
 *                   - travel
 *                   - insurance
 *                   - taxes
 *                   - other
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: ISO date; defaults to now if omitted
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Transaction created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden — admin only
 */
router.post('/', restrictTo(ROLES.ADMIN), validate(createTransactionSchema), createTransaction);
/**
 * @swagger
 * /transactions/{id}:
 *   patch:
 *     summary: Update a transaction
 *     description: Admin only. At least one field required.
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 exclusiveMinimum: 0
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *                 enum:
 *                   - salary
 *                   - freelance
 *                   - investment
 *                   - rental
 *                   - business
 *                   - food
 *                   - transport
 *                   - utilities
 *                   - entertainment
 *                   - healthcare
 *                   - education
 *                   - shopping
 *                   - travel
 *                   - insurance
 *                   - taxes
 *                   - other
 *               date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Transaction updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden — admin only
 *       404:
 *         description: Transaction not found
 */
router.patch('/:id', restrictTo(ROLES.ADMIN), validate(updateTransactionSchema), updateTransaction);
/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     description: Admin only.
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden — admin only
 *       404:
 *         description: Transaction not found
 */
router.delete('/:id', restrictTo(ROLES.ADMIN), deleteTransaction);

module.exports = router;
