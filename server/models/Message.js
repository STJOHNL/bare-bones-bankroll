import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    category: String,
    message: String,
    status: String,
    userEmail: String,
    userName: String,
  },
  { timestamps: true }
)

const Message = mongoose.model('Message', messageSchema)

export default Message
