import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import sessionController from '../controllers/session.js'
import validate from '../middleware/validate.js'
import { sessionValidator } from '../middleware/validators.js'

router.get('/', protect, sessionController.getSessions)
router.post('/', protect, sessionValidator, validate, sessionController.createSession)
router.put('/', protect, sessionValidator, validate, sessionController.editSession)

router.post('/import', protect, sessionController.importSessions)

router.get('/:id', protect, sessionController.getSessionById)
router.delete('/:id', protect, sessionController.deleteSession)

export default router
