import Transaction from '../models/Transaction.js'

export default {
  // @desc Get all transactions
  // @route GET /api/transaction
  // @access PRIVATE
  getTransactions: async (req, res, next) => {
    try {
      const transactions = await Transaction.find().sort({ date: -1 })
      res.status(200).json(transactions)
    } catch (error) {
      console.log(error)
    }
  },

  // @desc Create a transaction
  // @route POST /api/transaction
  // @access PRIVATE
  createTransaction: async (req, res, next) => {
    try {
      const { type, amount, note, date, sessionId } = req.body

      const transaction = await Transaction.create({ type, amount, note, date, sessionId })
      res.status(201).json(transaction)
    } catch (error) {
      console.log(error)
    }
  },

  // @desc Delete a transaction
  // @route DELETE /api/transaction/:id
  // @access PRIVATE
  deleteTransaction: async (req, res, next) => {
    try {
      const deleted = await Transaction.findByIdAndDelete(req.params.id)
      res.status(200).json(deleted)
    } catch (error) {
      console.log(error)
    }
  }
}
