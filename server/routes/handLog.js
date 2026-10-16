import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import handLogController from '../controllers/handLog.js'
import validate, { validateIdParam } from '../middleware/validate.js'
import { handLogValidator } from '../middleware/validators.js'

router.get('/', protect, handLogController.getHandLogs)
router.post('/', protect, handLogValidator, validate, handLogController.createHandLog)
router.delete('/:id', protect, validateIdParam, handLogController.deleteHandLog)

export default router
