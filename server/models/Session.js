import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema(
  {
    venue: { type: String, enum: ['Online', 'Live'], required: true },
    type: { type: String, enum: ['Cash', 'Tournament'], required: true },
    game: { type: String, enum: ['NL', 'PLO'], required: true },
    name: String,
    buyin: Number,
    cashout: Number,
    start: Date,
    end: Date,
    notes: String
  },
  { timestamps: true }
)

const Session = mongoose.model('Session', sessionSchema)

export default Session
