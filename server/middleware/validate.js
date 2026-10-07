import { validationResult } from 'express-validator'

/**
 * Runs after express-validator checks and short-circuits with 422 if any
 * validation errors are present, so controllers never see invalid data.
 * Submitted values are not echoed back (they may contain passwords).
 */
const validate = (req, res, next) => {
  const result = validationResult(req)
  if (!result.isEmpty()) {
    const errors = result
      .array()
      .map(({ type, path, location, msg }) => ({ type, path, location, msg }))
    return res.status(422).json({ message: errors[0].msg, errors })
  }
  next()
}

const OBJECT_ID = /^[a-f0-9]{24}$/i

/**
 * Rejects malformed :id route params with 404 before they reach the database.
 */
export const validateIdParam = (req, res, next) => {
  if (!OBJECT_ID.test(req.params.id || '')) {
    return res.status(404).json({ message: 'Not found' })
  }
  next()
}

export default validate
