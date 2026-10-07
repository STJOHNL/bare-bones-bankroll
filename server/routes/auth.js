import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import authController from '../controllers/auth.js'
import validate from '../middleware/validate.js'
import { authLimiter } from '../middleware/rateLimit.js'
import {
  signInValidator,
  signUpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '../middleware/validators.js'

// Credential endpoints are rate limited individually; /me and sign-out are not
router.post('/sign-in', authLimiter, signInValidator, validate, authController.signIn)

router.post('/sign-up', authLimiter, signUpValidator, validate, authController.signUp)

router.post('/sign-out', authController.signOut)

router.get('/me', protect, authController.me)

router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, authController.forgotPassword)

router.post('/reset-password', authLimiter, resetPasswordValidator, validate, authController.resetPassword)

// Change password requires authentication — verify identity before allowing update
router.put('/change-password', protect, changePasswordValidator, validate, authController.changePassword)

export default router
