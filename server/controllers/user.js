import User from '../models/User.js'
import Session from '../models/Session.js'
import Transaction from '../models/Transaction.js'
import PlayerNote from '../models/PlayerNote.js'

// Only these fields ever leave the server
const SAFE_FIELDS = '_id fName lName email role createdAt'

const toSafeUser = user => ({
  _id: user._id,
  fName: user.fName,
  lName: user.lName,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
})

const isAdmin = req => req.user.role === 'Admin'
const isSelf = (req, id) => req.user._id.toString() === String(id)

export default {
  // @desc Get Users
  // @route GET /api/user
  // @access ADMIN
  getUsers: async (req, res, next) => {
    try {
      const users = await User.find().select(SAFE_FIELDS).sort({ fName: 1 }).lean()

      res.status(200).json(users.map(toSafeUser))
    } catch (error) {
      next(error)
    }
  },

  // @desc Get User
  // @route GET /api/user/:id
  // @access PRIVATE (self or admin)
  getUser: async (req, res, next) => {
    try {
      if (!isSelf(req, req.params.id) && !isAdmin(req)) {
        return res.status(403).json({ message: 'You do not have permission to view this user' })
      }

      const user = await User.findById(req.params.id).select(SAFE_FIELDS).lean()
      if (!user) return res.status(404).json({ message: 'User not found' })

      res.status(200).json(toSafeUser(user))
    } catch (error) {
      next(error)
    }
  },

  // @desc Edit User
  // @route PUT /api/user
  // @access PRIVATE (self or admin; only admins may change roles)
  editUser: async (req, res, next) => {
    try {
      const { id, email, fName, lName, role } = req.body

      if (!isSelf(req, id) && !isAdmin(req)) {
        return res.status(403).json({ message: 'You do not have permission to update this user' })
      }

      const user = await User.findById(id)
      if (!user) return res.status(404).json({ message: 'User not found' })

      if (role !== undefined && role !== user.role && !isAdmin(req)) {
        return res.status(403).json({ message: 'Only admins can change roles' })
      }

      const emailTaken = await User.exists({ email, _id: { $ne: user._id } })
      if (emailTaken) {
        return res.status(409).json({ message: 'Email already in use' })
      }

      user.fName = fName
      user.lName = lName
      user.email = email
      if (role !== undefined && isAdmin(req)) user.role = role
      await user.save({ validateModifiedOnly: true })

      res.status(200).json(toSafeUser(user))
    } catch (error) {
      next(error)
    }
  },

  // @desc Delete User (and all of their data)
  // @route DELETE /api/user/:id
  // @access ADMIN
  deleteUser: async (req, res, next) => {
    try {
      if (isSelf(req, req.params.id)) {
        return res.status(400).json({ message: 'You cannot delete your own account' })
      }

      const deletedUser = await User.findByIdAndDelete(req.params.id)
      if (!deletedUser) return res.status(404).json({ message: 'User not found' })

      await Promise.all([
        Session.deleteMany({ user: deletedUser._id }),
        Transaction.deleteMany({ user: deletedUser._id }),
        PlayerNote.deleteMany({ user: deletedUser._id }),
      ])

      res.status(200).json(toSafeUser(deletedUser))
    } catch (error) {
      next(error)
    }
  },
}
