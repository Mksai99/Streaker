import { body, query, param, validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join(', ');
    throw new AppError(messages, 400);
  }
  next();
};

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('displayName').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('role').isIn(['customer', 'shopOwner']).withMessage('Role must be customer or shopOwner'),
  validate
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
  validate
];

export const shopValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Shop name is required'),
  body('category').trim().isLength({ min: 2 }).withMessage('Category is required'),
  body('address').trim().isLength({ min: 5 }).withMessage('Address is required'),
  validate
];

export const rewardValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Reward name is required'),
  body('description').trim().isLength({ min: 5 }).withMessage('Description is required'),
  body('requiredStreak').isInt({ min: 1 }).withMessage('Required streak must be a positive number'),
  body('rewardType').isIn(['percentage_discount', 'fixed_discount', 'cashback', 'free_product']).withMessage('Invalid reward type'),
  validate
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  validate
];

export const idParamValidation = [
  param('id').trim().isLength({ min: 1 }).withMessage('Valid ID is required'),
  validate
];
