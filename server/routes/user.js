import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import admin from '../middleware/admin.js'
import userController from '../controllers/user.js'
import validate, { validateIdParam } from '../middleware/validate.js'
import { userEditValidator } from '../middleware/validators.js'

router.get('/', protect, admin, userController.getUsers)
router.put('/', protect, userEditValidator, validate, userController.editUser)

router.get('/:id', protect, validateIdParam, userController.getUser)
router.delete('/:id', protect, admin, validateIdParam, userController.deleteUser)

export default router
