import Session from '../models/Session.js'
import Transaction from '../models/Transaction.js'

export default {
  // @desc Get Sessions
  // @route GET /api/session
  // @access PRIVATE
  getSessions: async (req, res, next) => {
    try {
      // Scope to the authenticated user so users cannot see each other's sessions
      const sessions = await Session.find({ user: req.user._id }).sort({ start: -1 })

      res.status(200).json(sessions)
    } catch (error) {
      next(error)
    }
  },

  // @desc Get Session By Id
  // @route GET /api/session/:id
  // @access PRIVATE
  getSessionById: async (req, res, next) => {
    try {
      const session = await Session.findOne({ _id: req.params.id, user: req.user._id })
      if (!session) return res.status(404).json({ message: 'Session not found' })

      res.status(200).json(session)
    } catch (error) {
      next(error)
    }
  },

  // @desc Create Session
  // @route POST /api/session
  // @access PRIVATE
  createSession: async (req, res, next) => {
    try {
      const { venue, type, game, name, buyin, cashout, start, end, notes } = req.body

      // Attach authenticated user so the session is scoped correctly
      const sessionObj = await Session.create({
        user: req.user._id,
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
      next(error)
    }
  },

  // @desc Edit Session
  // @route PUT /api/session
  // @access PRIVATE
  editSession: async (req, res, next) => {
    try {
      const { id, venue, type, game, name, buyin, cashout, start, end, notes } = req.body

      // Verify ownership before updating
      const existing = await Session.findOne({ _id: id, user: req.user._id })
      if (!existing) return res.status(404).json({ message: 'Session not found' })

      const updatedSession = await Session.findByIdAndUpdate(
        id,
        { venue, type, game, name, buyin, cashout, start, end, notes },
        { new: true }
      )

      // Upsert Buy-in transaction — filter by sessionId + type to find existing record,
      // include user in the update so newly created docs are scoped correctly
      await Transaction.findOneAndUpdate(
        { sessionId: id, type: 'Buy-in' },
        { amount: buyin, note: name, date: start || end, user: req.user._id },
        { upsert: true, new: true }
      )

      // Upsert Cash-out whenever a cashout value exists (covers active tournaments
      // with incremental winnings like bounties/PKOs), otherwise remove any stale one
      if (cashout > 0) {
        await Transaction.findOneAndUpdate(
          { sessionId: id, type: 'Cash-out' },
          { amount: cashout, note: name, date: end || start, user: req.user._id },
          { upsert: true, new: true }
        )
      } else {
        await Transaction.findOneAndDelete({ sessionId: id, type: 'Cash-out' })
      }

      res.status(200).json(updatedSession)
    } catch (error) {
      next(error)
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

      // Attach authenticated user to every imported session
      const sessionDocs = sessions.map(s => ({ ...s, user: req.user._id }))
      const created = await Session.insertMany(sessionDocs, { ordered: false })

      // Create Buy-in and Cash-out transactions for completed sessions (end date exists)
      const txnDocs = []
      for (const s of created) {
        if (s.end && s.buyin != null)
          txnDocs.push({ type: 'Buy-in', amount: s.buyin, note: s.name, date: s.start, sessionId: s._id, user: req.user._id })
        if (s.end && s.cashout != null)
          txnDocs.push({ type: 'Cash-out', amount: s.cashout, note: s.name, date: s.end, sessionId: s._id, user: req.user._id })
      }
      const txns = txnDocs.length ? await Transaction.insertMany(txnDocs, { ordered: false }) : []

      res.status(201).json({ imported: created.length, transactions: txns })
    } catch (error) {
      next(error)
    }
  },

  // @desc Delete Session
  // @route DELETE /api/session/:id
  // @access PRIVATE
  deleteSession: async (req, res, next) => {
    try {
      // Verify ownership before deleting
      const session = await Session.findOneAndDelete({ _id: req.params.id, user: req.user._id })
      if (!session) return res.status(404).json({ message: 'Session not found' })

      await Transaction.deleteMany({ sessionId: req.params.id })

      res.status(200).json(session)
    } catch (error) {
      next(error)
    }
  }
}
