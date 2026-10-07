import mongoose from 'mongoose'

const playerNoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
)

playerNoteSchema.index({ user: 1, updatedAt: -1 })

const PlayerNote = mongoose.model('PlayerNote', playerNoteSchema)

export default PlayerNote
