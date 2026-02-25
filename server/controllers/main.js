export default {
  // @desc Index page for API
  // @route GET /api/
  // @access PUBLIC
  index: async (req, res, next) => {
    try {
      return res.status(200).json({ message: 'Boiler' })
    } catch (error) {
      console.log(error)
    }
  }
}
