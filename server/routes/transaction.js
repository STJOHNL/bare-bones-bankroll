import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import transactionController from '../controllers/transaction.js'
import validate from '../middleware/validate.js'
import { transactionValidator } from '../middleware/validators.js'

router.get('/', protect, transactionController.getTransactions)
router.post('/', protect, transactionValidator, validate, transactionController.createTransaction)
router.delete('/:id', protect, transactionController.deleteTransaction)

export default router
