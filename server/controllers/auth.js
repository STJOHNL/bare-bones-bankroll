import User from '../models/User.js'
import {
  generateToken,
  generateResetToken,
} from '../middleware/generateToken.js'
import mailer from '../helpers/mailer.js'

export default {
  // @desc Sign in user
  // @route POST /api/auth/sign-in
  // @access PUBLIC
  signIn: async (req, res, next) => {
    try {
      let { email, password } = req.body
      email = email.toLowerCase()

      const user = await User.findOne({ email })
      if (!user || !(await user.matchPassword(password))) {
        // Use the same message for both cases to avoid user enumeration
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      const userObj = user.toObject()
      delete userObj.password
      const token = generateToken(res, userObj)

      return res.status(200).json({ token })
    } catch (error) {
      next(error)
    }
  },

  // @desc Sign up user
  // @route POST /api/auth/sign-up
  // @access PUBLIC
  signUp: async (req, res, next) => {
    try {
      let { fName, lName, email, password } = req.body
      email = email.toLowerCase()

      const userExists = await User.findOne({ email })
      if (userExists) {
        return res.status(400).json({ message: 'User with that email already exists' })
      }

      const user = await User.create({
        fName,
        lName,
        email,
        password, // Password hashing handled by User model pre-save hook
      })

      const userObj = user.toObject()
      delete userObj.password
      const token = generateToken(res, userObj)
      res.status(201).json({ token, userObj })
    } catch (error) {
      next(error)
    }
  },

  // @desc Sign out user
  // @route POST /api/auth/sign-out
  // @access PUBLIC
  signOut: async (req, res, next) => {
    try {
      if (!req.cookies?.token) return res.sendStatus(204)
      res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
      })
      res.json({ message: 'User signed out' })
    } catch (error) {
      next(error)
    }
  },

  // @desc Send forgot password email
  // @route POST /api/auth/forgot-password
  // @access PUBLIC
  forgotPassword: async (req, res, next) => {
    try {
      const email = req.body.email?.toLowerCase()
      const user = await User.findOne({ email })
      if (!user) {
        return res.status(400).json({ message: 'User with that email does not exist' })
      }

      const resetToken = generateResetToken()
      user.resetToken = resetToken
      user.resetExpires = Date.now() + 3600000 // 1 hour
      await user.save()

      const link = `${process.env.CLIENT_URL}/reset-password/${resetToken}`
      mailer.sendPasswordReset({ recipient: user.email, name: user.fName, link })

      res.status(200).json({ message: 'Email has been sent!' })
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
        resetToken: token,
        resetExpires: { $gt: Date.now() },
      })

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' })
      }

      user.password = password
      user.resetToken = undefined
      user.resetExpires = undefined
      await user.save()

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

      // Fetch from DB to get the hashed password (JWT payload may be stale)
      const user = await User.findById(req.user._id)
      if (!user) return res.status(404).json({ message: 'User not found' })

      const isMatch = await user.matchPassword(currentPassword)
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' })
      }

      user.password = newPassword
      await user.save()

      res.status(200).json({ message: 'Password updated!' })
    } catch (error) {
      next(error)
    }
  },
}
