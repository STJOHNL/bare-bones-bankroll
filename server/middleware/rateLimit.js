import rateLimit from 'express-rate-limit'

const message = { message: 'Too many requests, please try again later.' }
// Limits are disabled under Jest so the suites can sign in freely
const skip = () => process.env.NODE_ENV === 'test'

const limiter = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message,
    skip,
  })

// Restrict credential endpoints to 20 requests per 15 minutes per IP
// to mitigate brute-force and credential-stuffing attacks
export const authLimiter = limiter(15 * 60 * 1000, 20)

// General ceiling for the whole API
export const apiLimiter = limiter(15 * 60 * 1000, 600)

// Support tickets send email — 10 per hour per IP
export const supportLimiter = limiter(60 * 60 * 1000, 10)
