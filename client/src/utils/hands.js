// Hands played are logged in batches (not per session). Each log entry says
// `hands` more were played up to `date`, so the running total gives
// checkpoints that map lifetime hand counts onto points in time.

const byDateAsc = (a, b) => new Date(a.date) - new Date(b.date)

export const totalHands = logs => logs.reduce((sum, l) => sum + l.hands, 0)

// [{ hands: running total, date }] in date order
export const handCheckpoints = logs => {
  let total = 0
  return [...logs].sort(byDateAsc).map(l => ({ hands: (total += l.hands), date: new Date(l.date) }))
}

// Lifetime hands logged at or before `date`
export const handsAsOf = (logs, date) => {
  const t = new Date(date)
  return logs.reduce((sum, l) => (new Date(l.date) <= t ? sum + l.hands : sum), 0)
}

/**
 * Resolves a range of lifetime hands (e.g. 100,000 – 200,000) to a time
 * window. Hand counts are only known at checkpoints, so the range widens
 * outward to the nearest ones and the result reports the range actually used.
 *
 * Returns { from, to, after, until } — sessions starting after `after`
 * (null = the beginning) and up to `until` — or null when the range is empty.
 */
export const resolveHandRange = (logs, from, to) => {
  const points = [{ hands: 0, date: null }, ...handCheckpoints(logs)]
  const total = points[points.length - 1].hands
  const lo = Math.min(Math.max(from ?? 0, 0), total)
  const hi = Math.min(Math.max(to ?? total, 0), total)
  if (hi <= lo) return null

  const start = points.findLast(p => p.hands <= lo)
  const end = points.find(p => p.hands >= hi)
  return { from: start.hands, to: end.hands, after: start.date, until: end.date }
}

export const filterByHandRange = (sessions, range) =>
  sessions.filter(s => {
    if (!s.start) return false
    const t = new Date(s.start)
    return (!range.after || t > range.after) && t <= range.until
  })

// P/L per 100 hands
export const per100 = (pl, hands) => (hands > 0 ? (pl / hands) * 100 : null)

export const formatHands = n => Math.round(n).toLocaleString('en-US')
