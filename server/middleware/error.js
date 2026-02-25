export default {
  // Unsupported routes (404)
  notFound: (req, res, next) => {
    if (req.path === '/favicon.ico') {
      // Optionally log or handle favicon requests separately
      return res.status(204).send() // No content for favicon requests
    }
    const error = new Error(`Not Found - ${req.originalUrl}`)
    console.log(error)
    res.status(404)
    next(error)
  },

  // Error Handler
  errorHandler: (error, req, res, next) => {
    if (res.headersSent) {
      return next(error)
    }

    console.error('Error:', error)

    let statusCode = res?.statusCode !== 200 ? res?.statusCode : 500
    let message = error?.message || 'An unknown error occurred'

    // Handle specific error types
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      statusCode = 404
      message = 'Resource not found'
    } else if (error.code === 'ENOENT') {
      statusCode = 404
      message = 'File not found'
    }

    // Ensure we're using a valid HTTP status code
    if (
      typeof statusCode !== 'number' ||
      statusCode < 100 ||
      statusCode > 599
    ) {
      console.warn(`Invalid status code: ${statusCode}, defaulting to 500`)
      statusCode = 500
    }

    res.status(statusCode).json({
      message: message,
      stack: process.env.NODE_ENV != 'development' ? '🥞' : error.stack,
    })
  },
}
