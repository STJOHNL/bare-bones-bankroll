import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import sessionController from '../controllers/session.js'
import validate, { validateIdParam } from '../middleware/validate.js'
import { sessionEditValidator } from '../middleware/validators.js'

// Session field validation lives in utils/sessionRules.js (normalizeSession)
router.get('/', protect, sessionController.getSessions)
router.post('/', protect, sessionController.createSession)
router.put('/', protect, sessionEditValidator, validate, sessionController.editSession)

router.post('/import', protect, sessionController.importSessions)

router.get('/:id', protect, validateIdParam, sessionController.getSessionById)
router.delete('/:id', protect, validateIdParam, sessionController.deleteSession)

export default router
