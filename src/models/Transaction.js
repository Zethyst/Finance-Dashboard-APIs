const mongoose = require('mongoose');
const { TRANSACTION_TYPES, TRANSACTION_CATEGORIES } = require('../config/constants');

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: Object.values(TRANSACTION_TYPES),
        message: `Type must be one of: ${Object.values(TRANSACTION_TYPES).join(', ')}`,
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: TRANSACTION_CATEGORIES,
        message: `Category must be one of: ${TRANSACTION_CATEGORIES.join(', ')}`,
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false, // Soft-delete flag is hidden from regular queries
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Automatically exclude soft-deleted records from all find queries
transactionSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

// Indexes for common query patterns
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ category: 1, date: -1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ createdBy: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;