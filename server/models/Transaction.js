import mongoose from 'mongoose'
import { roundCents } from '../utils/money.js'

export const TRANSACTION_TYPES = ['Purchase', 'Redemption', 'Promo', 'Buy-in', 'Cash-out']
// Types a user records by hand; Buy-in / Cash-out are owned by sessions
export const MANUAL_TYPES = ['Purchase', 'Redemption', 'Promo']
export const SESSION_TYPES = ['Buy-in', 'Cash-out']
export const REDEMPTION_STATUSES = ['Pending', 'Completed', 'Cancelled']

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    // Chips (Gold) moved by the transaction
    amount: { type: Number, required: true, set: roundCents },
    // Purchase only: dollars paid for the credits
    cost: { type: Number, set: roundCents },
    // Redemption only
    status: { type: String, enum: REDEMPTION_STATUSES },
    note: String,
    date: { type: Date, default: Date.now },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  },
  { timestamps: true }
)

transactionSchema.index({ user: 1, date: -1 })
// One Buy-in and at most one Cash-out per session
transactionSchema.index(
  { sessionId: 1, type: 1 },
  { unique: true, partialFilterExpression: { sessionId: { $exists: true } } }
)

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction
