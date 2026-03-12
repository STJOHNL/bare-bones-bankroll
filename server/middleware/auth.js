import jwt from 'jsonwebtoken'

// Verifies the JWT cookie and attaches the decoded user to req.user.
// Returns 401 if the token is missing or invalid.
const protect = async (req, res, next) => {
  try {
    const token = req?.cookies?.token
    if (!token) {
      return res.status(401).json({ message: 'You must log in first.' })
    }

    // Decode token and expose user on request so controllers can scope queries
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded.user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

export default protect
