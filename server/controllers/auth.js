import User from '../models/User.js'
import {
  generateToken,
  generateResetToken,
} from '../middleware/generateToken.js'
import mailer from '../helpers/mailer.js'
import error from '../middleware/error.js'

export default {
  // @desc Sign in user
  // @route POST /api/sign-in
  // @access PUBLIC
  signIn: async (req, res, next) => {
    try {
      let { email, password } = req.body
      email = email.toLowerCase()

      const user = await User.findOne({ email })
      if (!user) {
        return res.status(404).json({ message: 'Invalid credentials' })
      }

      if (user && (await user.matchPassword(password))) {
        const userObj = user.toObject()
        delete userObj.password
        const token = generateToken(res, userObj)

        return res.status(201).json({ token })
      }
      return res.status(404).json({ message: 'Invalid credentials' })
    } catch {
      console.log(error)
    }
  },

  // @desc Sign up user
  // @route POST /api/sign-up
  // @access PUBLIC
  signUp: async (req, res, next) => {
    try {
      let { fName, lName, email, password } = req.body
      email = email.toLowerCase()

      const userExists = await User.findOne({ email })

      if (userExists) {
        res.status(400).json({ message: 'User with that email already exists' })
        return
      }

      const user = await User.create({
        fName,
        lName,
        email,
        password, // Password hashing in User model
      })

      if (user) {
        const userObj = user.toObject()
        delete userObj.password
        const token = generateToken(res, userObj)
        res.status(201).json({ token, userObj })
      } else {
        res.status(400).json({ error: error.message })
      }
    } catch {
      console.log(error)
    }
  },

  // @desc Sign out user
  // @route POST /api/sign-out
  // @access PUBLIC
  signOut: async (req, res, next) => {
    try {
      const cookies = req.cookies
      if (!cookies?.token) return res.sendStatus(204) // No content
      res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
      })

      res.json({ message: 'User signed out' })
    } catch {
      console.log(error)
    }
  },

  // @desc Send forgot password email
  // @route POST /api/forgot-password
  // @access PUBLIC
  forgotPassword: async (req, res, next) => {
    try {
      let { email } = req.body
      email = email?.toLowerCase()
      const user = await User.findOne({ email })
      if (!user) {
        return res
          .status(400)
          .json({ message: 'User with that email does not exist' })
      }

      const resetToken = generateResetToken()
      user.resetToken = resetToken
      user.resetExpires = Date.now() + 3600000 // 1 hour
      await user.save()

      let link = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

      mailer.sendPasswordReset({
        recipient: user.email,
        name: user.fName,
        link,
      })
      res.status(201).json({ message: 'Email has been sent!' })
    } catch {
      console.log(error)
    }
  },

  // @desc Reset users password
  // @route POST /api/reset-password
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

      // mailer.sendPasswordUpdated({
      //   recipient: user.email,
      //   name: user.fName,
      // })
      res.status(201).json({ message: 'Password updated!' })
    } catch {
      console.log(error)
    }
  },
}
