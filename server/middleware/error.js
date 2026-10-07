import logger from '../utils/logger.js'

export default {
  // Unknown API routes (404) — mounted on /api only so the SPA keeps its own 404 page
  notFound: (req, res) => {
    res.status(404).json({ message: 'Not found' })
  },

  // Error Handler
  // eslint-disable-next-line no-unused-vars
  errorHandler: (error, req, res, next) => {
    if (res.headersSent) {
      return next(error)
    }

    let statusCode = res?.statusCode && res.statusCode !== 200 ? res.statusCode : 500
    let message = error?.message || 'An unknown error occurred'

    // Handle specific error types
    if (error?.name === 'ValidationError' && error.errors) {
      statusCode = 422
      message = Object.values(error.errors)[0]?.message || 'Validation failed'
    } else if (error?.code === 11000) {
      statusCode = 409
      message = 'Duplicate record'
    } else if (error?.name === 'CastError') {
      statusCode = 404
      message = 'Resource not found'
    } else if (error?.type === 'entity.parse.failed') {
      statusCode = 400
      message = 'Malformed JSON body'
    } else if (error?.type === 'entity.too.large') {
      statusCode = 413
      message = 'Request body too large'
    } else if (error?.code === 'ENOENT') {
      statusCode = 404
      message = 'File not found'
    }

    // Ensure we're using a valid HTTP status code
    if (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599) {
      statusCode = 500
    }

    if (statusCode >= 500) {
      logger.error('Error:', error)
      // Never leak internal error details outside development
      if (process.env.NODE_ENV !== 'development') message = 'Server error'
    }

    const body = { message }
    if (process.env.NODE_ENV === 'development') body.stack = error?.stack
    res.status(statusCode).json(body)
  },
}
