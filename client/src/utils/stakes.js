// Structured cash-game stakes. Mirrors server/utils/stakes.js so the form,
// reports and CSV import label stakes exactly the way the server stores them.

// Common online blind levels, offered as presets in the session form
export const STAKE_PRESETS = [
  { sb: 0.01, bb: 0.02 },
  { sb: 0.02, bb: 0.05 },
  { sb: 0.05, bb: 0.1 },
  { sb: 0.1, bb: 0.25 },
  { sb: 0.25, bb: 0.5 },
  { sb: 0.5, bb: 1 },
  { sb: 1, bb: 2 },
  { sb: 2, bb: 5 },
  { sb: 5, bb: 10 },
]

const SMALL_BLINDS = { 0.02: 0.01, 0.05: 0.02, 0.1: 0.05, 0.25: 0.1, 0.5: 0.25, 1: 0.5, 2: 1, 4: 2, 5: 2, 10: 5, 25: 10 }

const toCents = n => Math.round(n * 100) / 100

export const defaultSmallBlind = bb => SMALL_BLINDS[toCents(bb)] ?? toCents(bb / 2)

// ('NL', 0.1) → 'NL10' — the conventional "buy-in in big blinds × 100" name
export const stakesLabel = (game, bb) => `${game}${Math.round(bb * 100)}`

const formatBlind = n => `$${n < 1 ? n.toFixed(2) : Number.isInteger(n) ? n : n.toFixed(2)}`

// (0.05, 0.1) → '$0.05/$0.10'
export const formatBlinds = (sb, bb) => `${formatBlind(sb)}/${formatBlind(bb)}`

const detectGame = text => {
  if (/plo|omaha/.test(text)) return 'PLO'
  if (/nl|holdem|hold'em/.test(text)) return 'NL'
  return undefined
}

/**
 * Parses free-text stakes ('NL20', '$0.10/$0.20', '1/2', '20NL', 'PLO50') into
 * { sb, bb, game? }. Returns null when nothing usable is found.
 */
export const parseStakes = text => {
  if (typeof text !== 'string') return null
  const t = text.toLowerCase().replace(/\s+/g, '')
  if (!t) return null
  const game = detectGame(t)

  // Explicit blinds win: "$0.10/$0.20", ".05/.10", "1/2"
  const blinds = t.match(/\$?(\d*\.?\d+)\/\$?(\d*\.?\d+)/)
  if (blinds) {
    const sb = toCents(parseFloat(blinds[1]))
    const bb = toCents(parseFloat(blinds[2]))
    if (!(bb > 0) || !(sb > 0) || sb > bb) return null
    return { sb, bb, ...(game && { game }) }
  }

  // "NL20", "NLH20", "PLO50" or "20NL"
  const named = t.match(/(?:nlh?|plo)(\d+(?:\.\d+)?)/) || t.match(/(\d+(?:\.\d+)?)(?:nlh?|plo)/)
  if (named) {
    const bb = toCents(parseFloat(named[1]) / 100)
    if (!(bb > 0)) return null
    return { sb: defaultSmallBlind(bb), bb, ...(game && { game }) }
  }

  return null
}

// Stakes for a session, falling back to parsing the name for legacy rows
export const sessionStakes = session => {
  if (session?.type !== 'Cash') return null
  if (session.bb > 0) return { sb: session.sb ?? defaultSmallBlind(session.bb), bb: session.bb }
  return parseStakes(session.name)
}

// Display name: cash sessions use their stakes label, tournaments their name
export const sessionLabel = session => {
  const stakes = sessionStakes(session)
  return stakes ? stakesLabel(session.game, stakes.bb) : session?.name || '—'
}
