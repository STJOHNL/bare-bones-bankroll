/**
 * Production-safe server logger.
 * Only outputs debug/info messages in development — errors always log.
 */
const isDev = process.env.NODE_ENV === 'development'

const logger = {
  log: (...args) => isDev && console.log(...args),
  info: (...args) => isDev && console.info(...args),
  warn: (...args) => isDev && console.warn(...args),
  // Errors always log — they should surface in production monitoring
  error: (...args) => console.error(...args),
}

export default logger
