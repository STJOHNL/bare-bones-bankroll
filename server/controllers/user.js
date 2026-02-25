import User from '../models/User.js'

export default {
  // @desc Get Users
  // @route GET /api/user
  // @access PRIVATE
  getUsers: async (req, res, next) => {
    try {
      const users = await User.find().select('-password').sort({ fName: 1 })

      res.status(200).json(users)
    } catch (error) {
      console.log(error)
    }
  },

  // @desc Get User
  // @route GET /api/user/:id
  // @access PRIVATE
  getUser: async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id).select('-password')

      res.status(200).json(user)
    } catch (error) {
      console.log(error)
    }
  },

  // @desc Create User
  // @route POST /api/user
  // @access PRIVATE
  createUser: async (req, res, next) => {
    try {
      let { email, fName, lName, phone, role, team } = req.body
      email = email.toLowerCase()

      const userExists = await User.findOne({ email })

      if (userExists) {
        res.status(400).json({ message: 'User with that email already exists' })
        return
      }

      const user = await User.create({
        email,
        fName,
        lName,
        phone,
        role,
        team,
      })

      if (user) {
        const userObj = user.toObject()
        delete userObj.password
        res.status(201).json(userObj)
      } else {
        res.status(400).json({ error: error.message })
      }
    } catch (error) {
      console.log(error)
    }
  },

  // @desc Edit User
  // @route PUT /api/user
  // @access PRIVATE
  editUser: async (req, res, next) => {
    try {
      let { id, updatingUserId, email, fName, lName, phone, role, team } =
        req.body

      // Get users from db
      const updatingUser = await User.findById(updatingUserId)

      if (!updatingUser) {
        return res.status(404).json({ message: 'User not found' })
      }

      // Check permission to update user
      if (updatingUser.id !== id && updatingUser.role !== 'Admin') {
        return res
          .status(403)
          .json({ message: 'You do not have permission to update this user' })
      }

      // Update user document
      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          email,
          fName,
          lName,
          phone,
          role,
          team,
        },
        {
          new: true,
        }
      )

      res.status(200).json(updatedUser)
    } catch (error) {
      console.log(error)
    }
  },

  // @desc Delete Users
  // @route DELETE /api/user/:id
  // @access PRIVATE
  deleteUser: async (req, res, next) => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.params.id)

      res.status(200).json(deletedUser)
    } catch (error) {
      console.log(error)
    }
  },
}
