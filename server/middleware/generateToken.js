import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// Cookie options shared by sign-in and sign-out so clearing actually matches
export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV !== 'development' && !process.env.ELECTRON, // False in Electron (http://localhost)
  sameSite: 'strict',
})

// Signs a JWT for the user and sets it as an httpOnly cookie.
// The token is never returned in a response body.
const generateToken = (res, user) => {
  const token = jwt.sign(
    { sub: user._id.toString(), ver: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  )

  res.cookie('token', token, {
    ...cookieOptions(),
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  })
}

const clearToken = res => {
  res.clearCookie('token', cookieOptions())
}

// Raw reset token (goes in the email link only)
const generateResetToken = () => crypto.randomBytes(32).toString('hex')

// What we store in the database
const hashResetToken = token => crypto.createHash('sha256').update(token).digest('hex')

export { generateToken, clearToken, generateResetToken, hashResetToken }
