import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const OBJECT_ID = /^[a-f0-9]{24}$/i

// Verifies the JWT cookie, loads the user and attaches a safe user object to req.user.
// Returns 401 if the token is missing, invalid, or has been revoked (tokenVersion bump).
const protect = async (req, res, next) => {
  const token = req?.cookies?.token
  if (!token) {
    return res.status(401).json({ message: 'You must log in first.' })
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }

  if (typeof decoded?.sub !== 'string' || !OBJECT_ID.test(decoded.sub)) {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }

  try {
    const user = await User.findById(decoded.sub).select('fName lName email role tokenVersion')
    if (!user || decoded.ver !== (user.tokenVersion ?? 0)) {
      return res.status(401).json({ message: 'Invalid or expired token.' })
    }

    req.user = {
      _id: user._id,
      fName: user.fName,
      lName: user.lName,
      email: user.email,
      role: user.role,
    }
    next()
  } catch (error) {
    next(error)
  }
}

export default protect
