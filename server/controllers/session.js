import Session from '../models/Session.js'
import Transaction from '../models/Transaction.js'

export default {
  // @desc Get Sessions
  // @route GET /api/session
  // @access PRIVATE
  getSessions: async (req, res, next) => {
    try {
      const sessions = await Session.find().sort({ startTime: -1 })

      res.status(200).json(sessions)
    } catch (error) {
      console.log(error)
    }
  },

  // @desc Get Session By Id
  // @route GET /api/session/:id
  // @access PRIVATE
  getSessionById: async (req, res, next) => {
    try {
      const session = await Session.findById(req.params.id)

      res.status(200).json(session)
    } catch (error) {
      console.log(error)
    }
  },

  // @desc Create Session
  // @route POST /api/session
  // @access PRIVATE
  createSession: async (req, res, next) => {
    try {
      const { venue, type, game, name, buyin, cashout, start, end, notes } = req.body

      // Create session document
      const sessionObj = await Session.create({
        venue,
        type,
        game,
        name,
        buyin,
        cashout,
        start,
        end,
        notes
      })

      res.status(201).json(sessionObj)
    } catch (error) {
      console.log(error)
    }
  },

  // @desc Edit Session
  // @route PUT /api/session
  // @access PRIVATE
  editSession: async (req, res, next) => {
    try {
      const { id, venue, type, game, name, buyin, cashout, start, end, notes } = req.body

      // Update session document
      const updatedSession = await Session.findByIdAndUpdate(
        id,
        { venue, type, game, name, buyin, cashout, start, end, notes },
        { new: true }
      )

      // Update linked transactions by sessionId
      await Transaction.findOneAndUpdate(
        { sessionId: id, type: 'Buy-in' },
        { amount: buyin, note: name, date: start || end }
      )
      await Transaction.findOneAndUpdate(
        { sessionId: id, type: 'Cash-out' },
        { amount: cashout, note: name, date: end }
      )

      res.status(200).json(updatedSession)
    } catch (error) {
      console.log(error)
    }
  },

  // @desc Bulk import Sessions from CSV
  // @route POST /api/session/import
  // @access PRIVATE
  importSessions: async (req, res, next) => {
    try {
      const sessions = req.body
      if (!Array.isArray(sessions) || sessions.length === 0) {
        return res.status(400).json({ message: 'No sessions provided' })
      }
      const created = await Session.insertMany(sessions, { ordered: false })

      const txnDocs = []
      for (const s of created) {
        if (s.end && s.buyin != null) txnDocs.push({ type: 'Buy-in', amount: s.buyin, note: s.name, date: s.start })
        if (s.end && s.cashout != null) txnDocs.push({ type: 'Cash-out', amount: s.cashout, note: s.name, date: s.end })
      }
      const txns = txnDocs.length ? await Transaction.insertMany(txnDocs, { ordered: false }) : []

      res.status(201).json({ imported: created.length, transactions: txns })
    } catch (error) {
      console.log(error)
      res.status(400).json({ message: 'Import failed', error: error.message })
    }
  },

  // @desc Delete Sessions
  // @route DELETE /api/session/:id
  // @access PRIVATE
  deleteSession: async (req, res, next) => {
    try {
      const deletedSession = await Session.findByIdAndDelete(req.params.id)
      await Transaction.deleteMany({ sessionId: req.params.id })

      res.status(200).json(deletedSession)
    } catch (error) {
      console.log(error)
    }
  }
}
