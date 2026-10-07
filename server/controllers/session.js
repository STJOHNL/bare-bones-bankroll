import Session from '../models/Session.js'
import Transaction from '../models/Transaction.js'
import { normalizeSession, pickSessionFields } from '../utils/sessionRules.js'
import { syncSessionLedger } from '../utils/ledger.js'

const MAX_IMPORT_ROWS = 2000
const IMPORT_SYNC_BATCH = 50

const isPlainObject = v => v !== null && typeof v === 'object' && !Array.isArray(v)

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

  // @desc Create Session (and its Buy-in / Cash-out transactions)
  // @route POST /api/session
  // @access PRIVATE
  createSession: async (req, res, next) => {
    try {
      const { value, error } = normalizeSession(req.body)
      if (error) return res.status(422).json({ message: error })

      // Attach authenticated user so the session is scoped correctly
      const session = await Session.create({ ...value, user: req.user._id })
      await syncSessionLedger(session)

      res.status(201).json(session)
    } catch (error) {
      next(error)
    }
  },

  // @desc Edit Session (partial update — only the fields sent are changed)
  // @route PUT /api/session
  // @access PRIVATE
  editSession: async (req, res, next) => {
    try {
      const { id } = req.body

      // Verify ownership before updating
      const existing = await Session.findOne({ _id: id, user: req.user._id })
      if (!existing) return res.status(404).json({ message: 'Session not found' })

      const incoming = pickSessionFields(req.body)
      const { value, error } = normalizeSession({ ...existing.toObject(), ...incoming })
      if (error) return res.status(422).json({ message: error })

      existing.set(value)
      await existing.save()
      await syncSessionLedger(existing)

      res.status(200).json(existing)
    } catch (error) {
      next(error)
    }
  },

  // @desc Bulk import Sessions from CSV
  // @route POST /api/session/import
  // @access PRIVATE
  importSessions: async (req, res, next) => {
    try {
      const rows = req.body
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(422).json({ message: 'No sessions provided' })
      }
      if (rows.length > MAX_IMPORT_ROWS) {
        return res.status(422).json({ message: `A maximum of ${MAX_IMPORT_ROWS} sessions can be imported at once` })
      }

      // Each row is validated independently; only whitelisted fields survive,
      // so the client can never set _id, user or timestamps
      const docs = []
      const skipped = []
      rows.forEach((row, index) => {
        if (!isPlainObject(row)) {
          skipped.push({ row: index + 1, reason: 'Invalid row' })
          return
        }
        const { value, error } = normalizeSession(row)
        if (error) skipped.push({ row: index + 1, reason: error })
        else docs.push({ ...value, user: req.user._id })
      })

      const created = docs.length ? await Session.insertMany(docs) : []

      for (let i = 0; i < created.length; i += IMPORT_SYNC_BATCH) {
        await Promise.all(created.slice(i, i + IMPORT_SYNC_BATCH).map(syncSessionLedger))
      }

      res.status(201).json({ imported: created.length, skipped })
    } catch (error) {
      next(error)
    }
  },

  // @desc Delete Session (and its transactions)
  // @route DELETE /api/session/:id
  // @access PRIVATE
  deleteSession: async (req, res, next) => {
    try {
      // Verify ownership before deleting
      const session = await Session.findOneAndDelete({ _id: req.params.id, user: req.user._id })
      if (!session) return res.status(404).json({ message: 'Session not found' })

      await Transaction.deleteMany({ sessionId: session._id, user: req.user._id })

      res.status(200).json(session)
    } catch (error) {
      next(error)
    }
  },
}
