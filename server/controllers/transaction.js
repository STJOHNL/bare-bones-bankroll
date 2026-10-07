import Transaction, { SESSION_TYPES } from '../models/Transaction.js'

// Copy the type-specific fields from the request onto a transaction:
// cost only applies to Purchases, status only to Redemptions
const applyFields = (txn, body) => {
  const { amount, cost, status, note, date } = body
  if (amount != null) txn.amount = amount
  if (note !== undefined) txn.note = note ?? undefined
  if (date) txn.date = date

  if (txn.type === 'Purchase') {
    if (cost != null) txn.cost = cost
    if (txn.cost == null) txn.cost = txn.amount
  } else {
    txn.cost = undefined
  }

  if (txn.type === 'Redemption') {
    if (status != null) txn.status = status
    if (!txn.status) txn.status = 'Pending'
  } else {
    txn.status = undefined
  }
}

export default {
  // @desc Get all transactions
  // @route GET /api/transaction
  // @access PRIVATE
  getTransactions: async (req, res, next) => {
    try {
      // Scope to the authenticated user so users cannot see each other's transactions
      const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 })
      res.status(200).json(transactions)
    } catch (error) {
      next(error)
    }
  },

  // @desc Create a manual transaction (Purchase / Redemption / Promo)
  // @route POST /api/transaction
  // @access PRIVATE
  createTransaction: async (req, res, next) => {
    try {
      // sessionId is never accepted from the client — Buy-in / Cash-out are session-owned
      const transaction = new Transaction({ type: req.body.type, user: req.user._id })
      applyFields(transaction, req.body)
      await transaction.save()

      res.status(201).json(transaction)
    } catch (error) {
      next(error)
    }
  },

  // @desc Update a manual transaction
  // @route PUT /api/transaction/:id
  // @access PRIVATE
  updateTransaction: async (req, res, next) => {
    try {
      const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id })
      if (!transaction) return res.status(404).json({ message: 'Transaction not found' })

      if (SESSION_TYPES.includes(transaction.type)) {
        return res.status(400).json({ message: 'Edit the session instead' })
      }

      applyFields(transaction, req.body)
      await transaction.save()

      res.status(200).json(transaction)
    } catch (error) {
      next(error)
    }
  },

  // @desc Delete a manual transaction
  // @route DELETE /api/transaction/:id
  // @access PRIVATE
  deleteTransaction: async (req, res, next) => {
    try {
      // Verify ownership before deleting
      const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id })
      if (!transaction) return res.status(404).json({ message: 'Transaction not found' })

      if (SESSION_TYPES.includes(transaction.type)) {
        return res.status(400).json({ message: 'Delete the session instead' })
      }

      await transaction.deleteOne()

      res.status(200).json(transaction)
    } catch (error) {
      next(error)
    }
  },
}
