import { body } from 'express-validator'
import { ROLES } from '../models/User.js'
import { MESSAGE_CATEGORIES, MESSAGE_STATUSES } from '../models/Message.js'
import { MANUAL_TYPES, SESSION_TYPES, REDEMPTION_STATUSES } from '../models/Transaction.js'

const MAX_MONEY = 10000000

/**
 * Shared chains
 */

// One email chain everywhere so normalization is identical for sign-in, sign-up,
// forgot-password and user edits
const emailField = () =>
  body('email')
    .isString()
    .withMessage('Valid email is required')
    .bail()
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .bail()
    .normalizeEmail()

const passwordField = (field, label) =>
  body(field)
    .isString()
    .withMessage(`${label} is required`)
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage(`${label} must be between 8 and 128 characters`)

const nameField = (field, label) =>
  body(field)
    .isString()
    .withMessage(`${label} is required`)
    .bail()
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .bail()
    .isLength({ max: 50 })
    .withMessage(`${label} must be 50 characters or fewer`)

const mongoIdField = (field, label) =>
  body(field).isString().withMessage(`Invalid ${label} id`).bail().isMongoId().withMessage(`Invalid ${label} id`)

// Accepts a number or numeric string within range and converts it to a number
const numberField = (field, label, { min = 0, max = MAX_MONEY, exclusiveMin = false } = {}) =>
  body(field)
    .custom(value => {
      const isNumeric =
        (typeof value === 'number' && Number.isFinite(value)) ||
        (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)))
      if (!isNumeric) throw new Error(`${label} must be a number`)
      const n = Number(value)
      if (exclusiveMin ? n <= min : n < min) {
        throw new Error(`${label} must be ${exclusiveMin ? 'greater than' : 'at least'} ${min}`)
      }
      if (n > max) throw new Error(`${label} must be ${max.toLocaleString('en-US')} or less`)
      return true
    })
    .customSanitizer(value => Number(value))

/**
 * Auth validators
 */
export const signInValidator = [
  emailField(),
  body('password').isString().withMessage('Password is required').bail().notEmpty().withMessage('Password is required'),
]

export const signUpValidator = [
  nameField('fName', 'First name'),
  nameField('lName', 'Last name'),
  emailField(),
  passwordField('password', 'Password'),
]

export const forgotPasswordValidator = [emailField()]

export const resetPasswordValidator = [
  body('token')
    .isString()
    .withMessage('Invalid or expired token')
    .bail()
    .isLength({ min: 20, max: 200 })
    .withMessage('Invalid or expired token'),
  passwordField('password', 'Password'),
]

export const changePasswordValidator = [
  body('currentPassword')
    .isString()
    .withMessage('Current password is required')
    .bail()
    .notEmpty()
    .withMessage('Current password is required'),
  passwordField('newPassword', 'New password'),
]

/**
 * User validators
 */
export const userEditValidator = [
  mongoIdField('id', 'user'),
  nameField('fName', 'First name'),
  nameField('lName', 'Last name'),
  emailField(),
  body('role').optional().isString().withMessage('Invalid role').bail().isIn(ROLES).withMessage('Invalid role'),
]

/**
 * Support validators
 */
const categoryField = () =>
  body('category')
    .isString()
    .withMessage('Category is required')
    .bail()
    .isIn(MESSAGE_CATEGORIES)
    .withMessage(`Category must be one of: ${MESSAGE_CATEGORIES.join(', ')}`)

const messageField = () =>
  body('message')
    .isString()
    .withMessage('Message is required')
    .bail()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters')

export const supportCreateValidator = [categoryField(), messageField()]

export const supportEditValidator = [
  mongoIdField('id', 'message'),
  categoryField().optional(),
  messageField().optional(),
  body('status')
    .optional()
    .isString()
    .withMessage('Invalid status')
    .bail()
    .isIn(MESSAGE_STATUSES)
    .withMessage(`Status must be one of: ${MESSAGE_STATUSES.join(', ')}`),
]

/**
 * Session validators — field rules live in utils/sessionRules.js
 */
export const sessionEditValidator = [mongoIdField('id', 'session')]

/**
 * Transaction validators
 */
const transactionFields = () => [
  numberField('cost', 'Cost').optional({ values: 'null' }),
  body('status')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Invalid status')
    .bail()
    .isIn(REDEMPTION_STATUSES)
    .withMessage(`Status must be one of: ${REDEMPTION_STATUSES.join(', ')}`),
  body('note')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Note must be text')
    .bail()
    .isLength({ max: 500 })
    .withMessage('Note must be 500 characters or fewer'),
  body('date')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Date must be a valid ISO 8601 date')
    .bail()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),
]

export const transactionCreateValidator = [
  body('type')
    .isString()
    .withMessage('Invalid transaction type')
    .bail()
    .custom(value => {
      if (SESSION_TYPES.includes(value)) throw new Error('Session transactions are managed by sessions')
      return true
    })
    .bail()
    .isIn(MANUAL_TYPES)
    .withMessage('Invalid transaction type'),
  numberField('amount', 'Amount', { exclusiveMin: true }),
  ...transactionFields(),
]

export const transactionEditValidator = [
  numberField('amount', 'Amount', { exclusiveMin: true }).optional({ values: 'null' }),
  ...transactionFields(),
]

/**
 * Player note validators
 */
export const playerNoteValidator = [
  body('name')
    .isString()
    .withMessage('Name is required')
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('notes')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Notes must be text')
    .bail()
    .isLength({ max: 5000 })
    .withMessage('Notes must be 5000 characters or fewer'),
]
