import { describe, it, expect } from 'vitest'
import {
  filterByHandRange,
  handCheckpoints,
  handsAsOf,
  per100,
  resolveHandRange,
  totalHands,
} from '../utils/hands'

// Logged out of order on purpose — helpers must sort by date
const logs = [
  { hands: 50000, date: '2026-02-01T12:00:00.000Z' },
  { hands: 100000, date: '2026-01-01T12:00:00.000Z' },
  { hands: 60000, date: '2026-03-01T12:00:00.000Z' },
]

describe('hand totals', () => {
  it('sums and orders checkpoints by date', () => {
    expect(totalHands(logs)).toBe(210000)
    expect(handCheckpoints(logs).map(p => p.hands)).toEqual([100000, 150000, 210000])
  })

  it('counts hands logged up to a date', () => {
    expect(handsAsOf(logs, '2026-02-15T00:00:00.000Z')).toBe(150000)
    expect(handsAsOf(logs, '2025-12-01T00:00:00.000Z')).toBe(0)
  })
})

describe('resolveHandRange', () => {
  it('uses checkpoints that line up exactly', () => {
    const r = resolveHandRange(logs, 100000, 150000)
    expect(r).toMatchObject({ from: 100000, to: 150000 })
    expect(r.after.toISOString()).toBe('2026-01-01T12:00:00.000Z')
    expect(r.until.toISOString()).toBe('2026-02-01T12:00:00.000Z')
  })

  it('widens outward to the nearest checkpoints', () => {
    expect(resolveHandRange(logs, 120000, 160000)).toMatchObject({ from: 100000, to: 210000 })
  })

  it('starts from the beginning for the first hands', () => {
    const r = resolveHandRange(logs, 0, 100000)
    expect(r).toMatchObject({ from: 0, to: 100000, after: null })
  })

  it('clamps to the hands logged and defaults open ends', () => {
    expect(resolveHandRange(logs, 200000, 999999)).toMatchObject({ from: 150000, to: 210000 })
    expect(resolveHandRange(logs, undefined, undefined)).toMatchObject({ from: 0, to: 210000 })
  })

  it('is null for empty ranges or no logs', () => {
    expect(resolveHandRange(logs, 150000, 150000)).toBeNull()
    expect(resolveHandRange(logs, 300000, 400000)).toBeNull()
    expect(resolveHandRange([], 0, 1000)).toBeNull()
  })
})

describe('filterByHandRange', () => {
  it('keeps sessions that started inside the window', () => {
    const sessions = [
      { start: '2025-12-31T10:00:00.000Z' },
      { start: '2026-01-15T10:00:00.000Z' },
      { start: '2026-02-01T11:00:00.000Z' },
      { start: '2026-02-10T10:00:00.000Z' },
      {},
    ]
    const r = resolveHandRange(logs, 100000, 150000)
    expect(filterByHandRange(sessions, r)).toEqual([sessions[1], sessions[2]])
  })
})

describe('per100', () => {
  it('scales P/L to 100 hands', () => {
    expect(per100(250, 50000)).toBe(0.5)
    expect(per100(10, 0)).toBeNull()
  })
})
