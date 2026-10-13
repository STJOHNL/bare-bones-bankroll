import mongoose from 'mongoose'

// Player types used to colour-code opponents (colours are defined in the client)
export const PLAYER_CATEGORIES = ['unknown', 'rec', 'whale', 'reg', 'nit', 'maniac']

const playerNoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    notes: { type: String, default: '' },
    category: { type: String, enum: PLAYER_CATEGORIES, default: 'unknown' },
    // Pinned players stay in view while playing
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
)

playerNoteSchema.index({ user: 1, updatedAt: -1 })

const PlayerNote = mongoose.model('PlayerNote', playerNoteSchema)

export default PlayerNote
