import Message from '../models/Message.js'
import mailer from '../helpers/mailer.js'

export default {
  // @desc Get Messages
  // @route GET /api/support
  // @access PRIVATE
  getMessages: async (req, res, next) => {
    try {
      const messages = await Message.find().sort({ createdDate: 1 })

      res.status(200).json(messages)
    } catch (error) {
      console.log(error)
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
      console.log(error)
    }
  },

  // @desc Create Message
  // @route POST /api/support
  // @access PRIVATE
  createMessage: async (req, res, next) => {
    try {
      let { category, message, status, userEmail, userName } = req.body

      // Update message document
      const messageObj = await Message.create({
        category,
        message,
        status,
        userEmail,
        userName,
      })

      // Replace with user option on FE
      let admin = 'logan@devtivity.com'

      try {
        await mailer.sendMessageReceived({
          recipient: [admin],
          name: userName?.split(' ')[0], // Return first name only
          reply: userEmail,
          message,
          category,
        })
      } catch (error) {
        console.error('Error sending first email:', error)
      }

      try {
        await mailer.sendMessageSent({
          recipient: userEmail,
          name: userName?.split(' ')[0], // Return first name only
          message,
        })
      } catch (error) {
        console.error('Error sending second email:', error)
      }

      res.status(201).json(messageObj)
    } catch (error) {
      console.log(error)
    }
  },

  // @desc Edit Message
  // @route PUT /api/support
  // @access PRIVATE
  editMessage: async (req, res, next) => {
    try {
      let { id, category, message, status, userEmail, userName } = req.body

      // Update message document
      const updatedMessage = await Message.findByIdAndUpdate(
        id,
        {
          category,
          message,
          status,
          userEmail,
          userName,
        },
        {
          new: true,
        }
      )

      res.status(200).json(updatedMessage)
    } catch (error) {
      console.log(error)
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
      console.log(error)
    }
  },
}
