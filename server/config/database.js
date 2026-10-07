import mongoose from 'mongoose'
import logger from '../utils/logger.js'

// Returns the connection promise so callers (server.js, Electron, tests) can await it
const connectDB = () =>
  mongoose.connect(process.env.MONGO_URL).then(
    () => {
      logger.log('MongoDB Connected')
    },
    error => {
      logger.error('MongoDB connection error:', error)
      throw error
    }
  )

export default connectDB
