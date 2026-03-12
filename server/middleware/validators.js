import { body } from 'express-validator'

/**
 * Auth validators
 */
export const signInValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]

export const signUpValidator = [
  body('fName').trim().notEmpty().withMessage('First name is required'),
  body('lName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
]

export const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
]

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
]

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
]

/**
 * Session validators
 */
export const sessionValidator = [
  body('venue').isIn(['Online', 'Live']).withMessage('Venue must be Online or Live'),
  body('type').isIn(['Cash', 'Tournament']).withMessage('Type must be Cash or Tournament'),
  body('game').isIn(['NL', 'PLO']).withMessage('Game must be NL or PLO'),
  body('buyin').isFloat({ min: 0 }).withMessage('Buy-in must be a non-negative number'),
  body('cashout').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Cash-out must be a non-negative number'),
]

/**
 * Transaction validators
 */
export const transactionValidator = [
  body('type')
    .isIn(['Deposit', 'Withdrawal', 'Buy-in', 'Cash-out', 'Promo'])
    .withMessage('Invalid transaction type'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a non-negative number'),
]
