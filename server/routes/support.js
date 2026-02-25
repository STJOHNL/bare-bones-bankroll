import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import supportController from '../controllers/support.js'

router.get('/', protect, supportController.getMessages)
router.post('/', protect, supportController.createMessage)
router.put('/', protect, supportController.editMessage)

router.get('/:id', protect, supportController.getMessage)
router.delete('/:id', protect, supportController.deleteMessage)

export default router
