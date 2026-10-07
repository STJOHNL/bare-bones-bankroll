import mongoose from 'mongoose'
import { roundCents } from '../utils/money.js'

const money = { type: Number, set: roundCents }

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    venue: { type: String, enum: ['Online', 'Live'], required: true },
    type: { type: String, enum: ['Cash', 'Tournament'], required: true },
    game: { type: String, enum: ['NL', 'PLO'], required: true },
    name: String,
    buyin: money,
    cashout: money,
    start: Date,
    end: Date,
    notes: String,
  },
  { timestamps: true }
)

sessionSchema.index({ user: 1, start: -1 })

const Session = mongoose.model('Session', sessionSchema)

export default Session
