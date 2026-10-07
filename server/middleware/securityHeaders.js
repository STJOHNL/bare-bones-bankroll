const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // The client loads the Inter font from Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

// Minimal security headers applied to every response
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'same-origin')
  res.setHeader('X-Frame-Options', 'DENY')
  if (process.env.NODE_ENV !== 'development') {
    res.setHeader('Content-Security-Policy', CSP)
  }
  next()
}

export default securityHeaders
