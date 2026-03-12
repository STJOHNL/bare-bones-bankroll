import Message from '../models/Message.js'
import mailer from '../helpers/mailer.js'

export default {
  // @desc Get Messages
  // @route GET /api/support
  // @access PRIVATE
  getMessages: async (req, res, next) => {
    try {
      // Admins see all tickets; regular users only see their own
      const filter = req.user.role === 'Admin' ? {} : { userEmail: req.user.email }
      const messages = await Message.find(filter).sort({ createdAt: 1 })

      res.status(200).json(messages)
    } catch (error) {
      next(error)
    }
  },

  // @desc Get Message
  // @route GET /api/support/:id
  // @access PRIVATE
  getMessage: async (req, res, next) => {
    try {
      const message = await Message.findById(req.params.id)

      res.status(200).json(message)
    } catch (error) {
      next(error)
    }
  },

  // @desc Create Message
  // @route POST /api/support
  // @access PRIVATE
  createMessage: async (req, res, next) => {
    try {
      const { category, message, status, userEmail, userName } = req.body

      const messageObj = await Message.create({
        category,
        message,
        status,
        userEmail,
        userName,
      })

      // Admin email is configured via ADMIN_EMAIL env variable — no hardcoded addresses
      const admin = process.env.ADMIN_EMAIL

      try {
        await mailer.sendMessageReceived({
          recipient: [admin],
          name: userName?.split(' ')[0],
          reply: userEmail,
          message,
          category,
        })
      } catch (error) {
        console.error('Error sending admin notification email:', error)
      }

      try {
        await mailer.sendMessageSent({
          recipient: userEmail,
          name: userName?.split(' ')[0],
          message,
        })
      } catch (error) {
        console.error('Error sending confirmation email:', error)
      }

      res.status(201).json(messageObj)
    } catch (error) {
      next(error)
    }
  },

  // @desc Edit Message
  // @route PUT /api/support
  // @access PRIVATE
  editMessage: async (req, res, next) => {
    try {
      const { id, category, message, status, userEmail, userName } = req.body

      const updatedMessage = await Message.findByIdAndUpdate(
        id,
        { category, message, status, userEmail, userName },
        { new: true }
      )

      res.status(200).json(updatedMessage)
    } catch (error) {
      next(error)
    }
  },

  // @desc Delete Messages
  // @route DELETE /api/support/:id
  // @access PRIVATE
  deleteMessage: async (req, res, next) => {
    try {
      const deletedMessage = await Message.findByIdAndDelete(req.params.id)

      res.status(200).json(deletedMessage)
    } catch (error) {
      next(error)
    }
  },
}
