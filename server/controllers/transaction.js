import Transaction from '../models/Transaction.js'

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

  // @desc Create a transaction
  // @route POST /api/transaction
  // @access PRIVATE
  createTransaction: async (req, res, next) => {
    try {
      const { type, amount, note, date, sessionId } = req.body

      // Attach authenticated user so the transaction is scoped correctly
      const transaction = await Transaction.create({ type, amount, note, date, sessionId, user: req.user._id })
      res.status(201).json(transaction)
    } catch (error) {
      next(error)
    }
  },

  // @desc Delete a transaction
  // @route DELETE /api/transaction/:id
  // @access PRIVATE
  deleteTransaction: async (req, res, next) => {
    try {
      // Verify ownership before deleting
      const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id })
      if (!deleted) return res.status(404).json({ message: 'Transaction not found' })

      res.status(200).json(deleted)
    } catch (error) {
      next(error)
    }
  }
}
