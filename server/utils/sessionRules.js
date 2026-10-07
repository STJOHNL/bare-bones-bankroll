export const SESSION_FIELDS = [
  'venue',
  'type',
  'game',
  'name',
  'buyin',
  'cashout',
  'start',
  'end',
  'notes',
]

export const VENUES = ['Online', 'Live']
export const SESSION_TYPES = ['Cash', 'Tournament']
export const GAMES = ['NL', 'PLO']

const MAX_MONEY = 10000000
const MAX_NAME = 200
const MAX_NOTES = 5000

const LABELS = {
  venue: 'Venue',
  type: 'Type',
  game: 'Game',
  name: 'Name',
  buyin: 'Buy-in',
  cashout: 'Cash-out',
  start: 'Start time',
  end: 'End time',
  notes: 'Notes',
}

class RuleError extends Error {}

const fail = message => {
  throw new RuleError(message)
}

const isBlank = v => v === undefined || v === null || v === ''

// Pick only whitelisted session fields from an object
export const pickSessionFields = input => {
  const out = {}
  if (!input || typeof input !== 'object') return out
  for (const key of SESSION_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, key)) out[key] = input[key]
  }
  return out
}

const toNumber = (key, v) => {
  if (isBlank(v)) return undefined
  let n
  if (typeof v === 'number') n = v
  else if (typeof v === 'string' && v.trim() !== '') n = Number(v.trim())
  else fail(`${LABELS[key]} must be a number`)
  if (!Number.isFinite(n)) fail(`${LABELS[key]} must be a number`)
  return n
}

const toText = (key, v) => {
  if (v === undefined || v === null) return undefined
  if (typeof v !== 'string') fail(`${LABELS[key]} must be text`)
  return v
}

const toDate = (key, v) => {
  if (isBlank(v)) return undefined
  let d
  if (v instanceof Date) d = new Date(v.getTime())
  else if (typeof v === 'string' || typeof v === 'number') d = new Date(v)
  else fail(`${LABELS[key]} must be a valid date`)
  if (Number.isNaN(d.getTime())) fail(`${LABELS[key]} must be a valid date`)
  return d
}

const toEnum = (key, v, allowed) => {
  if (isBlank(v)) return undefined
  if (typeof v !== 'string' || !allowed.includes(v)) {
    fail(`${LABELS[key]} must be one of: ${allowed.join(', ')}`)
  }
  return v
}

const inRange = (key, n, min, max) => {
  if (n < min || n > max) {
    fail(`${LABELS[key]} must be between ${min.toLocaleString('en-US')} and ${max.toLocaleString('en-US')}`)
  }
}

const normalize = input => {
  const src = pickSessionFields(input)

  const venue = toEnum('venue', src.venue, VENUES)
  if (!venue) fail('Venue is required')
  const type = toEnum('type', src.type, SESSION_TYPES)
  if (!type) fail('Type is required')
  const game = toEnum('game', src.game, GAMES)

  const rawName = toText('name', src.name)
  let name = rawName === undefined ? undefined : rawName.trim()
  if (name !== undefined && name.length > MAX_NAME) fail(`Name must be ${MAX_NAME} characters or fewer`)
  if (name === '') name = undefined

  const notes = toText('notes', src.notes)
  if (notes !== undefined && notes.length > MAX_NOTES) fail(`Notes must be ${MAX_NOTES} characters or fewer`)

  const buyin = toNumber('buyin', src.buyin)
  if (buyin === undefined) fail('Buy-in is required')
  inRange('buyin', buyin, 0, MAX_MONEY)

  const cashout = toNumber('cashout', src.cashout) ?? 0
  inRange('cashout', cashout, 0, MAX_MONEY)

  const start = toDate('start', src.start)
  if (!start) fail('Start time is required')
  const end = toDate('end', src.end)
  if (end && end < start) fail('End time must be after start time')

  if (!game) fail('Game is required')
  // Cash sessions keep the stake as free text (e.g. "NL20"); tournaments need a name
  if (type === 'Tournament' && !name) fail('Tournament name is required')

  return {
    venue,
    type,
    game,
    name,
    buyin,
    cashout,
    start,
    end,
    notes,
  }
}

/**
 * Validate and normalize session data. `input` is the full (merged) session.
 * Returns { value } on success or { error } with a user-facing message.
 * Unset optional fields are returned as `undefined` so callers can apply
 * the value to an existing document and clear them.
 */
export const normalizeSession = input => {
  try {
    return { value: normalize(input), error: null }
  } catch (error) {
    if (error instanceof RuleError) return { value: null, error: error.message }
    throw error
  }
}

export default { normalizeSession, pickSessionFields, SESSION_FIELDS }
