import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import transactionController from '../controllers/transaction.js'

router.get('/', protect, transactionController.getTransactions)
router.post('/', protect, transactionController.createTransaction)
router.delete('/:id', protect, transactionController.deleteTransaction)

export default router
