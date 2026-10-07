// Must run after protect — only lets Admin users through
const admin = (req, res, next) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

export default admin
