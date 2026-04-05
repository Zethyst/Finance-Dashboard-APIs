const Joi = require('joi');
const { ROLES, USER_STATUS } = require('../config/constants');

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  role: Joi.string().valid(...Object.values(ROLES)),
  status: Joi.string().valid(...Object.values(USER_STATUS)),
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'New password must contain uppercase, lowercase, and a number',
      'any.required': 'New password is required',
    }),
});

module.exports = { updateUserSchema, changePasswordSchema };