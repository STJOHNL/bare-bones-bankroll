import PlayerNote from '../models/PlayerNote.js'

export default {
  // @desc  Get all player notes for the authenticated user
  // @route GET /api/player-notes
  // @access PRIVATE
  getPlayerNotes: async (req, res, next) => {
    try {
      // Pinned players first, then most recently updated
      const notes = await PlayerNote.find({ user: req.user._id }).sort({ pinned: -1, updatedAt: -1 })
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
      const { name, notes, category, pinned } = req.body
      const note = await PlayerNote.create({ user: req.user._id, name, notes: notes ?? '', category, pinned })
      res.status(201).json(note)
    } catch (error) {
      next(error)
    }
  },

  // @desc  Update a player note (partial — only the fields sent are changed)
  // @route PUT /api/player-notes/:id
  // @access PRIVATE
  updatePlayerNote: async (req, res, next) => {
    try {
      const { name, notes, category, pinned } = req.body
      const update = {}
      if (name !== undefined) update.name = name
      if (notes !== undefined) update.notes = notes ?? ''
      if (category !== undefined) update.category = category
      if (pinned !== undefined) update.pinned = pinned

      // Ownership is part of the filter so users can only touch their own notes
      const updated = await PlayerNote.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, update, {
        new: true,
        runValidators: true,
      })
      if (!updated) return res.status(404).json({ message: 'Note not found' })

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
