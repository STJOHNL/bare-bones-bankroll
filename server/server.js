import express from 'express'
import dotenv from 'dotenv'
import logger from 'morgan'
import mongoose from 'mongoose'
import appLogger from './utils/logger.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import connectDB from './config/database.js'
import sgMail from '@sendgrid/mail'
import { fileURLToPath } from 'url'
import path from 'path'

// Configure dotenv — packaged Electron builds point BBB_ENV_PATH at their own file
dotenv.config({ path: process.env.BBB_ENV_PATH || './config/.env' })

const port = process.env.PORT || 3000

// Routes imports
import error from './middleware/error.js'
import securityHeaders from './middleware/securityHeaders.js'
import { apiLimiter } from './middleware/rateLimit.js'
import mainRoutes from './routes/main.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import supportRoutes from './routes/support.js'
import sessionRoutes from './routes/session.js'
import transactionRoutes from './routes/transaction.js'
import playerNoteRoutes from './routes/playerNote.js'

// Connect to MongoDB
mongoose.set('strictQuery', true)
const dbReady = connectDB()

const app = express()
app.disable('x-powered-by')

// Behind a reverse proxy, TRUST_PROXY makes req.ip (and rate limiting) use the client IP
if (process.env.TRUST_PROXY) {
  const v = process.env.TRUST_PROXY
  app.set('trust proxy', isNaN(+v) ? v : +v)
}

// Security headers on every response
app.use(securityHeaders)

// Middleware
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// Log
if (process.env.NODE_ENV !== 'test') app.use(logger('dev'))

// Cookie Parser
app.use(cookieParser())

// CORS
if (process.env.NODE_ENV === 'development') {
  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
    })
  )
}

// Sendgrid connection
if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// File handling
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// General API rate limit (credential endpoints have a stricter per-route limiter)
app.use('/api', apiLimiter)

// Routes
app.use('/api', mainRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/transaction', transactionRoutes)
app.use('/api/player-notes', playerNoteRoutes)

// Unknown API routes get a JSON 404 (the SPA handles its own 404s)
app.use('/api', error.notFound)

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')))

// Catch all other routes and return the index.html file
app.get('*', (req, res, next) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'), err => {
    if (err) next(err)
  })
})

// Error Handler
app.use(error.errorHandler)

// In Electron mode the main process awaits dbReady and calls app.listen() itself;
// under Jest supertest drives the app directly. Otherwise listen once the DB is up.
if (!process.env.ELECTRON && process.env.NODE_ENV !== 'test') {
  dbReady.then(
    () => {
      app.listen(port, () => {
        appLogger.log(`Server is running on port ${port}`)
      })
    },
    () => process.exit(1)
  )
} else {
  // Consumers await dbReady themselves; avoid an unhandled rejection in the meantime
  dbReady.catch(() => {})
}

export { app, dbReady }
