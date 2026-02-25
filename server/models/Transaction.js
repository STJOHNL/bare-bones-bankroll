import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Deposit', 'Withdrawal', 'Buy-in', 'Cash-out', 'Promo'], required: true },
    amount: { type: Number, required: true },
    note: String,
    date: { type: Date, default: Date.now },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' }
  },
  { timestamps: true }
)

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction
