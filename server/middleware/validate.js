import { validationResult } from 'express-validator'

/**
 * Runs after express-validator checks and short-circuits with 422 if any
 * validation errors are present, so controllers never see invalid data.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }
  next()
}

export default validate
