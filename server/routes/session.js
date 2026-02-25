import express from 'express'
const router = express.Router()
import protect from '../middleware/auth.js'
import sessionController from '../controllers/session.js'

router.get('/', protect, sessionController.getSessions)
router.post('/', protect, sessionController.createSession)
router.put('/', protect, sessionController.editSession)

router.post('/import', protect, sessionController.importSessions)

router.get('/:id', protect, sessionController.getSessionById)
router.delete('/:id', protect, sessionController.deleteSession)

export default router
