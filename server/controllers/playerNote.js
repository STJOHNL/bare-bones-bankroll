import PlayerNote from '../models/PlayerNote.js'

export default {
  // @desc  Get all player notes for the authenticated user
  // @route GET /api/player-notes
  // @access PRIVATE
  getPlayerNotes: async (req, res, next) => {
    try {
      const notes = await PlayerNote.find({ user: req.user._id }).sort({ updatedAt: -1 })
      res.status(200).json(notes)
    } catch (error) {
      next(error)
    }
  },

  // @desc  Create a player note
  // @route POST /api/player-notes
  // @access PRIVATE
  createPlayerNote: async (req, res, next) => {
    try {
      const { name, notes } = req.body
      const note = await PlayerNote.create({ user: req.user._id, name, notes })
      res.status(201).json(note)
    } catch (error) {
      next(error)
    }
  },

  // @desc  Update a player note
  // @route PUT /api/player-notes/:id
  // @access PRIVATE
  updatePlayerNote: async (req, res, next) => {
    try {
      const { name, notes } = req.body
      const existing = await PlayerNote.findOne({ _id: req.params.id, user: req.user._id })
      if (!existing) return res.status(404).json({ message: 'Note not found' })

      const updated = await PlayerNote.findByIdAndUpdate(
        req.params.id,
        { name, notes },
        { new: true }
      )
      res.status(200).json(updated)
    } catch (error) {
      next(error)
    }
  },

  // @desc  Delete a player note
  // @route DELETE /api/player-notes/:id
  // @access PRIVATE
  deletePlayerNote: async (req, res, next) => {
    try {
      const note = await PlayerNote.findOneAndDelete({ _id: req.params.id, user: req.user._id })
      if (!note) return res.status(404).json({ message: 'Note not found' })
      res.status(200).json(note)
    } catch (error) {
      next(error)
    }
  },
}
