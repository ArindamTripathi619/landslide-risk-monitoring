/**
 * Input validation middleware using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(e => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
};

// Auth validations
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be 6-128 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'district_admin', 'field_officer', 'villager'])
    .withMessage('Invalid role'),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s-]{10,15}$/)
    .withMessage('Invalid phone number'),
  body('district')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('District must be 2-100 characters'),
  body('state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be 2-100 characters'),
  handleValidation,
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidation,
];

// Alert validations
const validateAlert = [
  body('type')
    .isIn(['landslide_warning', 'rainfall_warning', 'road_blockage', 'evacuation', 'other'])
    .withMessage('Invalid alert type'),
  body('severity')
    .isIn(['low', 'moderate', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be 5-200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be 10-2000 characters'),
  body('district')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('District is required'),
  handleValidation,
];

// Field report validations
const validateReport = [
  body('category')
    .isIn(['crack', 'slope_movement', 'road_block', 'water_seepage', 'subsidence', 'debris_flow', 'other'])
    .withMessage('Invalid report category'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be 3-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be under 2000 characters'),
  body('urgency')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid urgency level'),
  body('location')
    .isObject()
    .withMessage('Location is required'),
  body('location.type')
    .equals('Point')
    .withMessage('Location type must be Point'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be [longitude, latitude]'),
  body('location.coordinates.0')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('location.coordinates.1')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('district')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('District is required'),
  handleValidation,
];

// Prediction validations
const validatePrediction = [
  body('latitude')
    .isFloat({ min: 20, max: 32 })
    .withMessage('Latitude must be in NER region (20-32°N)'),
  body('longitude')
    .isFloat({ min: 85, max: 100 })
    .withMessage('Longitude must be in NER region (85-100°E)'),
  handleValidation,
];

// Query parameter validations
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100'),
  handleValidation,
];

const validateDistrict = [
  param('district')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Invalid district name'),
  handleValidation,
];

module.exports = {
  handleValidation,
  validateRegister,
  validateLogin,
  validateAlert,
  validateReport,
  validatePrediction,
  validatePagination,
  validateDistrict,
};
