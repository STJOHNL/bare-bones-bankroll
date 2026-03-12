/**
 * Production-safe logger that only outputs in development mode.
 * Replace all direct console.log/console.error calls with this utility
 * so debug output is never leaked to production.
 */
const isDev = import.meta.env.DEV

const logger = {
  log: (...args) => isDev && console.log(...args),
  warn: (...args) => isDev && console.warn(...args),
  error: (...args) => isDev && console.error(...args),
}

export default logger
