import { describe, it, expect } from 'vitest'
import { subDays } from 'date-fns'
import {
  bbPer100,
  filterByPeriod,
  playedMinutes,
  stakesBreakdown,
  streaks,
  summarize,
  topSessions,
  cumulativeSeries,
} from '../utils/stats'

const at = iso => new Date(iso).toISOString()
const session = (start, end, buyin, cashout, extra = {}) => ({
  start: at(start),
  end: at(end),
  buyin,
  cashout,
  type: 'Cash',
  game: 'NL',
  ...extra,
})

describe('playedMinutes', () => {
  it('counts overlapping tables once', () => {
    const sessions = [
      session('2026-01-01T10:00:00', '2026-01-01T11:00:00', 10, 10),
      session('2026-01-01T10:00:00', '2026-01-01T11:00:00', 10, 10),
      session('2026-01-01T10:30:00', '2026-01-01T11:30:00', 10, 10),
    ]
    expect(playedMinutes(sessions)).toBe(90)
  })

  it('adds separate sittings', () => {
    const sessions = [
      session('2026-01-01T10:00:00', '2026-01-01T11:00:00', 10, 10),
      session('2026-01-01T12:00:00', '2026-01-01T12:30:00', 10, 10),
    ]
    expect(playedMinutes(sessions)).toBe(90)
  })

  it('ignores sessions without an end or with end before start', () => {
    expect(playedMinutes([{ start: at('2026-01-01T10:00:00') }])).toBe(0)
    expect(playedMinutes([session('2026-01-01T11:00:00', '2026-01-01T10:00:00', 1, 1)])).toBe(0)
  })
})

describe('summarize', () => {
  it('computes hourly from the merged time at the tables', () => {
    const sessions = [
      session('2026-01-01T10:00:00', '2026-01-01T12:00:00', 10, 30),
      session('2026-01-01T10:00:00', '2026-01-01T12:00:00', 10, 10),
    ]
    const s = summarize(sessions)
    expect(s.totalPL).toBe(20)
    expect(s.hours).toBe(2)
    expect(s.hourlyRate).toBe(10)
    expect(s.winRate).toBe(50)
  })

  it('treats a missing cashout as zero', () => {
    expect(summarize([{ buyin: 5 }]).totalPL).toBe(-5)
  })
})

describe('bbPer100', () => {
  it('uses only cash sessions that recorded hands', () => {
    const sessions = [
      session('2026-01-01T10:00:00', '2026-01-01T11:00:00', 10, 12, { sb: 0.05, bb: 0.1, hands: 200 }),
      session('2026-01-01T10:00:00', '2026-01-01T11:00:00', 10, 0, { sb: 0.05, bb: 0.1 }),
    ]
    // +$2 at $0.10 bb = 20bb over 200 hands = 10bb/100
    expect(bbPer100(sessions)).toEqual({ value: 10, hands: 200 })
  })

  it('returns null without hands', () => {
    expect(bbPer100([session('2026-01-01T10:00:00', '2026-01-01T11:00:00', 1, 2)])).toBeNull()
  })
})

describe('stakesBreakdown', () => {
  it('groups cash sessions by stakes, smallest first, including legacy names', () => {
    const rows = stakesBreakdown([
      session('2026-01-01T10:00:00', '2026-01-01T11:00:00', 50, 60, { sb: 0.25, bb: 0.5 }),
      session('2026-01-01T10:00:00', '2026-01-01T11:00:00', 10, 5, { sb: 0.05, bb: 0.1 }),
      session('2026-01-02T10:00:00', '2026-01-02T11:00:00', 10, 15, { name: 'NL10' }),
      { ...session('2026-01-01T10:00:00', '2026-01-01T11:00:00', 5, 0), type: 'Tournament', name: 'Turbo' },
    ])
    expect(rows.map(r => [r.label, r.count, r.totalPL])).toEqual([
      ['NL10', 2, 0],
      ['NL50', 1, 10],
    ])
  })
})

describe('streaks', () => {
  it('tracks current and longest runs', () => {
    const pl = [5, 5, -1, -1, -1, 3]
    const sessions = pl.map((p, i) =>
      session(`2026-01-0${i + 1}T10:00:00`, `2026-01-0${i + 1}T11:00:00`, 10, 10 + p)
    )
    expect(streaks(sessions)).toEqual({ current: 1, longestWin: 2, longestLoss: 3 })
  })

  it('is empty for no sessions', () => {
    expect(streaks([])).toEqual({ current: 0, longestWin: 0, longestLoss: 0 })
  })
})

describe('topSessions', () => {
  it('never lists a session as both best and worst', () => {
    const sessions = [
      session('2026-01-01T10:00:00', '2026-01-01T11:00:00', 10, 20),
      session('2026-01-02T10:00:00', '2026-01-02T11:00:00', 10, 5),
    ]
    const { best, worst } = topSessions(sessions)
    expect(best).toHaveLength(1)
    expect(worst).toHaveLength(1)
    expect(best[0]).not.toBe(worst[0])
  })
})

describe('filterByPeriod', () => {
  const now = new Date()
  const sessions = [
    { start: now.toISOString() },
    { start: subDays(now, 40).toISOString() },
    { start: subDays(now, 400).toISOString() },
  ]

  it('returns everything for all time', () => {
    expect(filterByPeriod(sessions, 'alltime')).toHaveLength(3)
  })

  it('includes today and excludes older sessions for the today filter', () => {
    expect(filterByPeriod(sessions, 'today', now)).toEqual([sessions[0]])
  })

  it('includes this year and excludes last year for the year filter', () => {
    const result = filterByPeriod(sessions, 'year', now)
    expect(result).toContain(sessions[0])
    expect(result).not.toContain(sessions[2])
  })
})

describe('cumulativeSeries', () => {
  it('accumulates P/L in start order', () => {
    const series = cumulativeSeries([
      session('2026-01-02T10:00:00', '2026-01-02T11:00:00', 10, 5),
      session('2026-01-01T10:00:00', '2026-01-01T11:00:00', 10, 20),
    ])
    expect(series.map(p => p.pl)).toEqual([10, 5])
  })
})
