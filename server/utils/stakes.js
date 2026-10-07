/**
 * Helpers for cash-game stakes (small blind / big blind) and their labels.
 */

const roundCents = v => Math.round(v * 100) / 100

// Conventional small blind for common big blind sizes
const SMALL_BLINDS = {
  0.02: 0.01,
  0.05: 0.02,
  0.1: 0.05,
  0.25: 0.1,
  0.5: 0.25,
  1: 0.5,
  2: 1,
  4: 2,
  5: 2,
  10: 5,
  25: 10,
}

// Label a cash game by its big blind in cents, e.g. ('NL', 0.1) → 'NL10'
export const stakesLabel = (game, bb) => `${game}${Math.round(bb * 100)}`

// Best-guess small blind for a big blind when only the big blind is known
export const defaultSmallBlind = bb => {
  const key = roundCents(bb)
  if (SMALL_BLINDS[key] != null) return SMALL_BLINDS[key]
  return roundCents(bb / 2)
}

const detectGame = text => {
  if (/plo|omaha/.test(text)) return 'PLO'
  if (/nl|hold'?em/.test(text)) return 'NL'
  return undefined
}

// '$0.10/$0.20', '.05/.10', '1/2'
const BLINDS_RE = /\$?(\d*\.?\d+)\/\$?(\d*\.?\d+)/
const PREFIX_RE = /(?:nlh|nl|plo)(\d+(?:\.\d+)?)/
const SUFFIX_RE = /(\d+(?:\.\d+)?)(?:nlh|nl|plo)/

/**
 * Parse free-form stakes text such as 'NL20', '20NL', '$0.10/$0.20', '1/2'
 * or 'NL10 ($0.05/$0.10)'. Returns { sb, bb, game? } or null.
 */
export const parseStakes = text => {
  if (typeof text !== 'string') return null
  const t = text.toLowerCase().replace(/\s+/g, '')
  if (!t) return null

  const game = detectGame(t)
  let sb
  let bb

  // Explicit blinds win over the NLxx shorthand
  const blinds = t.match(BLINDS_RE)
  if (blinds) {
    sb = parseFloat(blinds[1])
    bb = parseFloat(blinds[2])
  } else {
    const short = t.match(PREFIX_RE) || t.match(SUFFIX_RE)
    if (!short) return null
    bb = roundCents(parseFloat(short[1]) / 100)
    sb = defaultSmallBlind(bb)
  }

  if (!Number.isFinite(sb) || !Number.isFinite(bb)) return null
  sb = roundCents(sb)
  bb = roundCents(bb)
  if (bb <= 0 || sb <= 0 || sb > bb) return null

  const result = { sb, bb }
  if (game) result.game = game
  return result
}

export default { stakesLabel, defaultSmallBlind, parseStakes }
