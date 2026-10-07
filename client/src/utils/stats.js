import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import { sessionLabel, sessionStakes } from './stakes'

export const DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'alltime' },
]

export const sessionPL = s => (s.cashout ?? 0) - (s.buyin ?? 0)

export const isCompleted = s => !!s.end

const byStartAsc = (a, b) => new Date(a.start) - new Date(b.start)

export const periodStart = (period, now = new Date()) => {
  switch (period) {
    case 'today':
      return startOfDay(now)
    case 'week':
      return startOfWeek(now, { weekStartsOn: 1 })
    case 'month':
      return startOfMonth(now)
    case 'year':
      return startOfYear(now)
    default:
      return null
  }
}

export const filterByPeriod = (sessions, period, now = new Date()) => {
  const cutoff = periodStart(period, now)
  if (!cutoff) return sessions
  return sessions.filter(s => s.start && new Date(s.start) >= cutoff)
}

/**
 * Total time played in minutes, counting overlapping sessions once — four
 * tables run side by side for an hour is one hour at the tables, not four.
 */
export const playedMinutes = sessions => {
  const intervals = sessions
    .filter(s => s.start && s.end)
    .map(s => [new Date(s.start).getTime(), new Date(s.end).getTime()])
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0])

  let total = 0
  let curStart = null
  let curEnd = null
  for (const [a, b] of intervals) {
    if (curEnd === null || a > curEnd) {
      if (curEnd !== null) total += curEnd - curStart
      curStart = a
      curEnd = b
    } else if (b > curEnd) {
      curEnd = b
    }
  }
  if (curEnd !== null) total += curEnd - curStart
  return total / 60000
}

// Big blinds won per 100 hands, across cash sessions that recorded hands
export const bbPer100 = sessions => {
  let bbWon = 0
  let hands = 0
  for (const s of sessions) {
    const stakes = sessionStakes(s)
    if (!stakes || !(s.hands > 0)) continue
    bbWon += sessionPL(s) / stakes.bb
    hands += s.hands
  }
  return hands > 0 ? { value: (bbWon / hands) * 100, hands } : null
}

export const summarize = sessions => {
  let totalPL = 0
  let wins = 0
  for (const s of sessions) {
    const pl = sessionPL(s)
    totalPL += pl
    if (pl > 0) wins += 1
  }
  const count = sessions.length
  const minutes = playedMinutes(sessions)
  return {
    totalPL,
    count,
    wins,
    winRate: count > 0 ? (wins / count) * 100 : 0,
    avgPerSession: count > 0 ? totalPL / count : 0,
    hours: minutes / 60,
    hourlyRate: minutes > 0 ? totalPL / (minutes / 60) : null,
    bb100: bbPer100(sessions),
  }
}

export const cumulativeSeries = sessions => {
  let cumulative = 0
  return [...sessions].sort(byStartAsc).map(s => {
    cumulative += sessionPL(s)
    return {
      date: s.start ? format(new Date(s.start), 'MM/dd') : '',
      pl: Math.round(cumulative * 100) / 100,
    }
  })
}

// Groups sessions by a key function and summarizes each group
export const breakdownBy = (sessions, keyFn) => {
  const groups = new Map()
  for (const s of sessions) {
    const key = keyFn(s)
    if (key == null) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(s)
  }
  return [...groups.entries()].map(([label, rows]) => ({ label, ...summarize(rows) }))
}

// Cash results per stake level, smallest stakes first
export const stakesBreakdown = sessions =>
  breakdownBy(
    sessions.filter(s => sessionStakes(s)),
    s => sessionLabel(s)
  ).sort((a, b) => {
    const bbOf = label => parseFloat(label.replace(/^\D+/, '')) || 0
    return bbOf(a.label) - bbOf(b.label) || a.label.localeCompare(b.label)
  })

export const streaks = sessions => {
  const sorted = [...sessions].sort(byStartAsc)
  let longestWin = 0
  let longestLoss = 0
  let run = 0
  let runIsWin = null
  for (const s of sorted) {
    const win = sessionPL(s) > 0
    run = win === runIsWin ? run + 1 : 1
    runIsWin = win
    if (win) longestWin = Math.max(longestWin, run)
    else longestLoss = Math.max(longestLoss, run)
  }
  const current = runIsWin === null ? 0 : runIsWin ? run : -run
  return { current, longestWin, longestLoss }
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const byDayOfWeek = sessions => {
  const days = DAYS.map(day => ({ day, count: 0, pl: 0 }))
  for (const s of sessions) {
    if (!s.start) continue
    const d = days[new Date(s.start).getDay()]
    d.count += 1
    d.pl += sessionPL(s)
  }
  return days
}

// Best sessions are winners only and worst are losers only, so a short
// history never lists the same session in both tables
export const topSessions = (sessions, n = 3) => {
  const sorted = [...sessions].sort((a, b) => sessionPL(b) - sessionPL(a))
  return {
    best: sorted.filter(s => sessionPL(s) > 0).slice(0, n),
    worst: sorted.filter(s => sessionPL(s) < 0).slice(-n).reverse(),
  }
}
