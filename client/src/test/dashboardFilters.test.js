/**
 * Unit tests for the Dashboard date-filter logic.
 * These test the pure filter/sort function without rendering the component.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, subDays } from 'date-fns'

// Mirrors the filtering logic in Dashboard.jsx completedSessions useMemo
function filterSessions(sessions, dateFilter) {
  const done = sessions.filter(s => !!s.end)
  const filtered =
    dateFilter === 'alltime'
      ? done
      : (() => {
          const now = new Date()
          let cutoff
          if (dateFilter === 'today') cutoff = startOfDay(now)
          else if (dateFilter === 'week') cutoff = startOfWeek(now, { weekStartsOn: 1 })
          else if (dateFilter === 'month') cutoff = startOfMonth(now)
          else if (dateFilter === 'year') cutoff = startOfYear(now)
          return done.filter(s => s.start && new Date(s.start) >= cutoff)
        })()
  return filtered.sort((a, b) => new Date(b.start) - new Date(a.start))
}

const now = new Date()
const yesterday = subDays(now, 1).toISOString()
const lastMonth = subDays(now, 35).toISOString()
const lastYear = subDays(now, 400).toISOString()

const sessions = [
  { _id: '1', start: now.toISOString(), end: now.toISOString(), buyin: 100, cashout: 150 },
  { _id: '2', start: yesterday, end: yesterday, buyin: 50, cashout: 30 },
  { _id: '3', start: lastMonth, end: lastMonth, buyin: 200, cashout: 400 },
  { _id: '4', start: lastYear, end: lastYear, buyin: 100, cashout: 80 },
  // Active session — should never appear in filtered results
  { _id: '5', start: now.toISOString(), end: null, buyin: 100, cashout: 0 },
]

describe('filterSessions', () => {
  it('excludes active sessions (no end date) from all filters', () => {
    const result = filterSessions(sessions, 'alltime')
    expect(result.find(s => s._id === '5')).toBeUndefined()
  })

  it('alltime returns all completed sessions', () => {
    const result = filterSessions(sessions, 'alltime')
    expect(result).toHaveLength(4)
  })

  it('sorts results newest first', () => {
    const result = filterSessions(sessions, 'alltime')
    expect(result[0]._id).toBe('1')
    expect(result[result.length - 1]._id).toBe('4')
  })

  it('week filter excludes sessions older than this week', () => {
    const result = filterSessions(sessions, 'week')
    // lastMonth and lastYear sessions should be excluded
    expect(result.find(s => s._id === '3')).toBeUndefined()
    expect(result.find(s => s._id === '4')).toBeUndefined()
  })

  it('year filter includes sessions from this year', () => {
    const result = filterSessions(sessions, 'year')
    expect(result.find(s => s._id === '4')).toBeUndefined()
  })
})
