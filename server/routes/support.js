import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import admin from '../middleware/admin.js'
import supportController from '../controllers/support.js'
import validate, { validateIdParam } from '../middleware/validate.js'
import { supportLimiter } from '../middleware/rateLimit.js'
import { supportCreateValidator, supportEditValidator } from '../middleware/validators.js'

router.get('/', protect, supportController.getMessages)
router.post('/', protect, supportLimiter, supportCreateValidator, validate, supportController.createMessage)
router.put('/', protect, admin, supportEditValidator, validate, supportController.editMessage)

router.get('/:id', protect, validateIdParam, supportController.getMessage)
router.delete('/:id', protect, admin, validateIdParam, supportController.deleteMessage)

export default router
