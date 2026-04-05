const AppError = require('../utils/AppError');

/**
 * Middleware factory that validates req.body against a Joi schema.
 * Returns a 400 with detailed field errors if validation fails.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,    // Collect all errors, not just the first
    stripUnknown: true,   // Remove unrecognized fields from body
    convert: true,        // Coerce types where safe (e.g., string -> number)
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));

    return next(new AppError('Validation failed', 400));
  }

  req.body = value; // Replace body with sanitized/coerced value
  next();
};

module.exports = validate;