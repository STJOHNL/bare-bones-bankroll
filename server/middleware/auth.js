import jwt from 'jsonwebtoken'

const protect = async (req, res, next) => {
  try {
    let token
    token = req?.cookies?.token
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET)

      next()
    } else {
      return res.status(401).json({ message: 'You must log in first.' })
    }
  } catch (error) {
    console.log(error)
  }
}

export default protect
