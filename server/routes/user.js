import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import userController from '../controllers/user.js'

router.get('/', protect, userController.getUsers)
router.put('/', protect, userController.editUser)
router.post('/', protect, userController.createUser)

router.get('/:id', protect, userController.getUser)
router.delete('/:id', protect, userController.deleteUser)

export default router
