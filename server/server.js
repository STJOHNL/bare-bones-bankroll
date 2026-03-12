import express from 'express'
import dotenv from 'dotenv'
import logger from 'morgan'
import appLogger from './utils/logger.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import connectDB from './config/database.js'
import sgMail from '@sendgrid/mail'
import { fileURLToPath } from 'url'
import path from 'path'

// Configure dotenv
dotenv.config({ path: './config/.env' })

const port = process.env.PORT || 3000

// Routes imports
import error from './middleware/error.js'
import mainRoutes from './routes/main.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import supportRoutes from './routes/support.js'
import sessionRoutes from './routes/session.js'
import transactionRoutes from './routes/transaction.js'

// Connect to MongoDB
connectDB()

const app = express()

// Middleware
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// Log
app.use(logger('dev'))

// Cookie Parser
app.use(cookieParser())

// CORS
if (process.env.NODE_ENV === 'development') {
  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true
    })
  )
}

// Sendgrid connection
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// File handling
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Rate limiting — restrict auth endpoints to 20 requests per 15 minutes per IP
// to mitigate brute-force and credential-stuffing attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
})

// Routes
app.use('/api', mainRoutes)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/transaction', transactionRoutes)

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')))

// Error Routes
// app.use(error.notFound) // Interfers with client 404
app.use(error.errorHandler)

// Catch all other routes and return the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'))
})

// In Electron mode the main process calls app.listen() itself after import;
// otherwise start listening immediately (normal web / CLI usage).
if (!process.env.ELECTRON) {
  app.listen(port, () => {
    appLogger.log(`Server is running on port ${port}`)
  })
}

export { app }
