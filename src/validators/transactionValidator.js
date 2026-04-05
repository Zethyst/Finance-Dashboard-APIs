const Joi = require('joi');
const { TRANSACTION_TYPES, TRANSACTION_CATEGORIES } = require('../config/constants');

const createTransactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required',
  }),
  type: Joi.string()
    .valid(...Object.values(TRANSACTION_TYPES))
    .required()
    .messages({
      'any.only': `Type must be one of: ${Object.values(TRANSACTION_TYPES).join(', ')}`,
      'any.required': 'Transaction type is required',
    }),
  category: Joi.string()
    .valid(...TRANSACTION_CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${TRANSACTION_CATEGORIES.join(', ')}`,
      'any.required': 'Category is required',
    }),
  date: Joi.date().iso().max('now').default(Date.now).messages({
    'date.max': 'Transaction date cannot be in the future',
  }),
  description: Joi.string().max(500).allow('', null).default(''),
});

const updateTransactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid(...Object.values(TRANSACTION_TYPES)),
  category: Joi.string().valid(...TRANSACTION_CATEGORIES),
  date: Joi.date().iso().max('now').messages({
    'date.max': 'Transaction date cannot be in the future',
  }),
  description: Joi.string().max(500).allow('', null),
}).min(1); // At least one field must be provided

module.exports = { createTransactionSchema, updateTransactionSchema };