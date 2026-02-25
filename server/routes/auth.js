import express from 'express'
const router = express.Router()
import authController from '../controllers/auth.js'

router.post('/sign-in', authController.signIn)

router.post('/sign-up', authController.signUp)

router.post('/sign-out', authController.signOut)

router.post('/forgot-password', authController.forgotPassword)

router.post('/reset-password', authController.resetPassword)

export default router
