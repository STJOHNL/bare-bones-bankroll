import HandLog from '../models/HandLog.js'

export default {
  // @desc  Get the hand log for the authenticated user, oldest first
  // @route GET /api/hands
  // @access PRIVATE
  getHandLogs: async (req, res, next) => {
    try {
      const logs = await HandLog.find({ user: req.user._id }).sort({ date: 1, createdAt: 1 })
      res.status(200).json(logs)
    } catch (error) {
      next(error)
    }
  },

  // @desc  Log hands played
  // @route POST /api/hands
  // @access PRIVATE
  createHandLog: async (req, res, next) => {
    try {
      const { hands, date, note } = req.body
      const log = await HandLog.create({
        user: req.user._id,
        hands,
        ...(date && { date }),
        ...(note && { note }),
      })
      res.status(201).json(log)
    } catch (error) {
      next(error)
    }
  },

  // @desc  Delete a hand log entry
  // @route DELETE /api/hands/:id
  // @access PRIVATE
  deleteHandLog: async (req, res, next) => {
    try {
      const log = await HandLog.findOneAndDelete({ _id: req.params.id, user: req.user._id })
      if (!log) return res.status(404).json({ message: 'Entry not found' })
      res.status(200).json(log)
    } catch (error) {
      next(error)
    }
  },
}
