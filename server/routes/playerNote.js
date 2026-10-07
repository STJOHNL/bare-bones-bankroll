import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import playerNoteController from '../controllers/playerNote.js'
import validate, { validateIdParam } from '../middleware/validate.js'
import { playerNoteValidator } from '../middleware/validators.js'

router.get('/', protect, playerNoteController.getPlayerNotes)
router.post('/', protect, playerNoteValidator, validate, playerNoteController.createPlayerNote)
router.put('/:id', protect, validateIdParam, playerNoteValidator, validate, playerNoteController.updatePlayerNote)
router.delete('/:id', protect, validateIdParam, playerNoteController.deletePlayerNote)

export default router
