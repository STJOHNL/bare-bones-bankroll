import mongoose from 'mongoose'

// Hands played are logged in batches rather than per session. Each entry is a
// checkpoint: `hands` more were played up to `date`, which lets reports map a
// range of lifetime hands (e.g. 100k–200k) onto the sessions played in it.
const handLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hands: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true, default: Date.now },
    note: String,
  },
  { timestamps: true }
)

handLogSchema.index({ user: 1, date: 1 })

const HandLog = mongoose.model('HandLog', handLogSchema)

export default HandLog
