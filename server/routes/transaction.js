import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import transactionController from '../controllers/transaction.js'
import validate, { validateIdParam } from '../middleware/validate.js'
import { transactionCreateValidator, transactionEditValidator } from '../middleware/validators.js'

router.get('/', protect, transactionController.getTransactions)
router.post('/', protect, transactionCreateValidator, validate, transactionController.createTransaction)
router.put('/:id', protect, validateIdParam, transactionEditValidator, validate, transactionController.updateTransaction)
router.delete('/:id', protect, validateIdParam, transactionController.deleteTransaction)

export default router
