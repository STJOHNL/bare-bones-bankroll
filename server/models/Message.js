import mongoose from 'mongoose'

export const MESSAGE_CATEGORIES = ['Bug', 'Feedback', 'Feature Request', 'Other']
export const MESSAGE_STATUSES = ['Pending', 'Planned', 'In Progress', 'Completed']

const messageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    category: { type: String, enum: MESSAGE_CATEGORIES },
    message: String,
    status: { type: String, enum: MESSAGE_STATUSES, default: 'Pending' },
    // Filled in by the server from the authenticated user
    userEmail: String,
    userName: String,
  },
  { timestamps: true }
)

const Message = mongoose.model('Message', messageSchema)

export default Message
