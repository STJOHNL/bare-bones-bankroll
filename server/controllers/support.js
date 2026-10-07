import Message from '../models/Message.js'
import mailer from '../helpers/mailer.js'
import logger from '../utils/logger.js'

const isAdmin = req => req.user.role === 'Admin'

// Tickets are linked by user id; legacy tickets only have the email
const ownerFilter = req => ({ $or: [{ user: req.user._id }, { userEmail: req.user.email }] })

export default {
  // @desc Get Messages
  // @route GET /api/support
  // @access PRIVATE (admins see all tickets, users see their own)
  getMessages: async (req, res, next) => {
    try {
      const filter = isAdmin(req) ? {} : ownerFilter(req)
      const messages = await Message.find(filter).sort({ createdAt: 1 })

      res.status(200).json(messages)
    } catch (error) {
      next(error)
    }
  },

  // @desc Get Message
  // @route GET /api/support/:id
  // @access PRIVATE (owner or admin)
  getMessage: async (req, res, next) => {
    try {
      const filter = isAdmin(req)
        ? { _id: req.params.id }
        : { $and: [{ _id: req.params.id }, ownerFilter(req)] }
      const message = await Message.findOne(filter)
      if (!message) return res.status(404).json({ message: 'Message not found' })

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
      const { category, message } = req.body
      const { _id, email, fName, lName } = req.user
      const userName = [fName, lName].filter(Boolean).join(' ')

      // Identity and status always come from the server, never the client
      const messageObj = await Message.create({
        user: _id,
        category,
        message,
        status: 'Pending',
        userEmail: email,
        userName,
      })

      // Admin email is configured via ADMIN_EMAIL env variable — no hardcoded addresses
      const admin = process.env.ADMIN_EMAIL
      if (admin) {
        try {
          await mailer.sendMessageReceived({
            recipient: [admin],
            name: fName,
            reply: email,
            message,
            category,
          })
        } catch (error) {
          logger.error('Error sending admin notification email:', error?.response?.body || error)
        }
      }

      try {
        await mailer.sendMessageSent({
          recipient: email,
          name: fName,
          message,
        })
      } catch (error) {
        logger.error('Error sending confirmation email:', error?.response?.body || error)
      }

      res.status(201).json(messageObj)
    } catch (error) {
      next(error)
    }
  },

  // @desc Edit Message
  // @route PUT /api/support
  // @access ADMIN
  editMessage: async (req, res, next) => {
    try {
      const { id, category, message, status } = req.body

      const update = {}
      if (category !== undefined) update.category = category
      if (message !== undefined) update.message = message
      if (status !== undefined) update.status = status

      const updatedMessage = await Message.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      })
      if (!updatedMessage) return res.status(404).json({ message: 'Message not found' })

      res.status(200).json(updatedMessage)
    } catch (error) {
      next(error)
    }
  },

  // @desc Delete Messages
  // @route DELETE /api/support/:id
  // @access ADMIN
  deleteMessage: async (req, res, next) => {
    try {
      const deletedMessage = await Message.findByIdAndDelete(req.params.id)
      if (!deletedMessage) return res.status(404).json({ message: 'Message not found' })

      res.status(200).json(deletedMessage)
    } catch (error) {
      next(error)
    }
  },
}
