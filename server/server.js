import express from 'express'
import dotenv from 'dotenv'
import logger from 'morgan'
import cookieParser from 'cookie-parser'
import cors from 'cors'
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

// Connect to MongoDB
connectDB()

const app = express()

// Middleware
app.use(express.json({ extended: true }))
app.use(express.urlencoded({ extended: true }))

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

// Routes
app.use('/api', mainRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/support', supportRoutes)

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')))

// Error Routes
// app.use(error.notFound) // Interfers with client 404
app.use(error.errorHandler)

// Catch all other routes and return the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'))
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
