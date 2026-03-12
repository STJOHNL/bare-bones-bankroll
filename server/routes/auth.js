import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import authController from '../controllers/auth.js'
import validate from '../middleware/validate.js'
import {
  signInValidator,
  signUpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '../middleware/validators.js'

router.post('/sign-in', signInValidator, validate, authController.signIn)

router.post('/sign-up', signUpValidator, validate, authController.signUp)

router.post('/sign-out', authController.signOut)

router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword)

router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword)

// Change password requires authentication — verify identity before allowing update
router.put('/change-password', protect, changePasswordValidator, validate, authController.changePassword)

export default router
