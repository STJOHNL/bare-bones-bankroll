import User from '../models/User.js'
import {
  generateToken,
  clearToken,
  generateResetToken,
  hashResetToken,
} from '../middleware/generateToken.js'
import mailer from '../helpers/mailer.js'
import logger from '../utils/logger.js'

const RESET_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const FORGOT_MESSAGE = 'If an account exists for that email, a reset link has been sent.'

export default {
  // @desc Sign in user
  // @route POST /api/auth/sign-in
  // @access PUBLIC
  signIn: async (req, res, next) => {
    try {
      const { email, password } = req.body

      const user = await User.findOne({ email }).select('+password')
      if (!user || !(await user.matchPassword(password))) {
        // Use the same message for both cases to avoid user enumeration
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      generateToken(res, user)
      return res.status(200).json({ user: user.toSafeObject() })
    } catch (error) {
      next(error)
    }
  },

  // @desc Sign up user
  // @route POST /api/auth/sign-up
  // @access PUBLIC
  signUp: async (req, res, next) => {
    try {
      const { fName, lName, email, password } = req.body

      const userExists = await User.exists({ email })
      if (userExists) {
        return res.status(400).json({ message: 'User with that email already exists' })
      }

      const user = await User.create({
        fName,
        lName,
        email,
        password, // Password hashing handled by User model pre-save hook
      })

      generateToken(res, user)
      res.status(201).json({ user: user.toSafeObject() })
    } catch (error) {
      next(error)
    }
  },

  // @desc Sign out user
  // @route POST /api/auth/sign-out
  // @access PUBLIC
  signOut: async (req, res, next) => {
    try {
      clearToken(res)
      res.status(200).json({ message: 'User signed out' })
    } catch (error) {
      next(error)
    }
  },

  // @desc Get the signed-in user
  // @route GET /api/auth/me
  // @access PRIVATE
  me: async (req, res, next) => {
    try {
      res.status(200).json({ user: req.user })
    } catch (error) {
      next(error)
    }
  },

  // @desc Send forgot password email
  // @route POST /api/auth/forgot-password
  // @access PUBLIC
  forgotPassword: async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email })

      // Always respond the same way so the endpoint can't be used to discover accounts
      if (user) {
        const resetToken = generateResetToken()
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              resetTokenHash: hashResetToken(resetToken),
              resetExpires: new Date(Date.now() + RESET_WINDOW_MS),
            },
          }
        )

        const link = `${process.env.CLIENT_URL}/reset-password/${resetToken}`
        try {
          await mailer.sendPasswordReset({ recipient: user.email, name: user.fName, link })
        } catch (error) {
          logger.error('Error sending password reset email:', error?.response?.body || error)
        }
      }

      res.status(200).json({ message: FORGOT_MESSAGE })
    } catch (error) {
      next(error)
    }
  },

  // @desc Reset users password via email token
  // @route POST /api/auth/reset-password
  // @access PUBLIC
  resetPassword: async (req, res, next) => {
    try {
      const { token, password } = req.body

      const user = await User.findOne({
        resetTokenHash: hashResetToken(token),
        resetExpires: { $gt: new Date() },
      })

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' })
      }

      user.password = password
      user.resetTokenHash = undefined
      user.resetExpires = undefined
      // Sign out every existing session
      user.tokenVersion = (user.tokenVersion ?? 0) + 1
      await user.save({ validateModifiedOnly: true })

      res.status(200).json({ message: 'Password updated!' })
    } catch (error) {
      next(error)
    }
  },

  // @desc Change password for authenticated user
  // @route PUT /api/auth/change-password
  // @access PRIVATE
  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body

      const user = await User.findById(req.user._id).select('+password')
      if (!user) return res.status(404).json({ message: 'User not found' })

      const isMatch = await user.matchPassword(currentPassword)
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' })
      }

      user.password = newPassword
      // Sign out every other session, then re-issue a cookie for this one
      user.tokenVersion = (user.tokenVersion ?? 0) + 1
      await user.save({ validateModifiedOnly: true })
      generateToken(res, user)

      res.status(200).json({ message: 'Password updated!' })
    } catch (error) {
      next(error)
    }
  },
}
