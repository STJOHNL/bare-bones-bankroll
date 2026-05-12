import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import playerNoteController from '../controllers/playerNote.js'

router.get('/', protect, playerNoteController.getPlayerNotes)
router.post('/', protect, playerNoteController.createPlayerNote)
router.put('/:id', protect, playerNoteController.updatePlayerNote)
router.delete('/:id', protect, playerNoteController.deletePlayerNote)

export default router
