import { describe, it, expect } from '@jest/globals'
import { normalizeSession, pickSessionFields } from '../utils/sessionRules.js'

const START = '2026-01-01T18:00:00.000Z'
const END = '2026-01-01T20:00:00.000Z'

const cash = (overrides = {}) => ({
  venue: 'Online',
  type: 'Cash',
  game: 'NL',
  name: 'NL10',
  buyin: 10,
  start: START,
  ...overrides,
})

const tournament = (overrides = {}) => ({
  venue: 'Live',
  type: 'Tournament',
  game: 'NL',
  name: 'Sunday MTT',
  buyin: 100,
  start: START,
  ...overrides,
})

const ok = input => {
  const { value, error } = normalizeSession(input)
  expect(error).toBeNull()
  return value
}

const err = input => {
  const { value, error } = normalizeSession(input)
  expect(value).toBeNull()
  return error
}

describe('normalizeSession — whitelist & coercion', () => {
  it('drops non-whitelisted fields', () => {
    const value = ok(cash({ _id: 'abc', user: 'someone', createdAt: 'x', isAdmin: true }))
    expect(Object.keys(value).sort()).toEqual(
      ['buyin', 'cashout', 'end', 'game', 'name', 'notes', 'start', 'type', 'venue'].sort()
    )
  })

  it('pickSessionFields only returns own whitelisted keys', () => {
    expect(pickSessionFields({ cashout: 5, _id: 'x', user: 'y' })).toEqual({ cashout: 5 })
    expect(pickSessionFields(null)).toEqual({})
  })

  it('coerces numeric strings to numbers', () => {
    const value = ok(cash({ buyin: '50', cashout: ' 75.5 ' }))
    expect(value.buyin).toBe(50)
    expect(value.cashout).toBe(75.5)
  })

  it('rejects non-numeric numbers', () => {
    expect(err(cash({ buyin: 'abc' }))).toBe('Buy-in must be a number')
    expect(err(cash({ buyin: true }))).toBe('Buy-in must be a number')
    expect(err(cash({ cashout: { $gt: 0 } }))).toBe('Cash-out must be a number')
  })

  it('rejects non-string strings', () => {
    expect(err(tournament({ name: { $ne: null } }))).toBe('Name must be text')
    expect(err(cash({ notes: 5 }))).toBe('Notes must be text')
    expect(err(cash({ venue: ['Online'] }))).toMatch(/^Venue must be one of/)
  })

  it('treats empty string / null as unset for end and cashout', () => {
    const value = ok(cash({ end: '', cashout: '' }))
    expect(value.end).toBeUndefined()
    expect(value.cashout).toBe(0)
    expect(ok(cash({ cashout: null })).cashout).toBe(0)
    expect(ok(cash()).cashout).toBe(0)
  })

  it('accepts Date objects (merged from an existing document)', () => {
    const value = ok(cash({ start: new Date(START), end: new Date(END) }))
    expect(value.start.toISOString()).toBe(START)
    expect(value.end.toISOString()).toBe(END)
  })
})

describe('normalizeSession — common rules', () => {
  it('validates enums', () => {
    expect(err(cash({ venue: 'Moon' }))).toMatch(/^Venue must be one of/)
    expect(err(cash({ type: 'Spin' }))).toMatch(/^Type must be one of/)
    expect(err(cash({ game: 'Stud' }))).toMatch(/^Game must be one of/)
    expect(err(cash({ venue: undefined }))).toBe('Venue is required')
  })

  it('requires buyin within 0..10,000,000', () => {
    expect(err(cash({ buyin: undefined }))).toBe('Buy-in is required')
    expect(err(cash({ buyin: '' }))).toBe('Buy-in is required')
    expect(err(cash({ buyin: -1 }))).toMatch(/^Buy-in must be between 0 and 10,000,000/)
    expect(err(cash({ buyin: 10000001 }))).toMatch(/^Buy-in must be between/)
    expect(ok(cash({ buyin: 0 })).buyin).toBe(0)
    expect(ok(cash({ buyin: 10000000 })).buyin).toBe(10000000)
  })

  it('limits cashout to 0..10,000,000', () => {
    expect(err(cash({ cashout: -5 }))).toMatch(/^Cash-out must be between/)
    expect(err(cash({ cashout: 10000001 }))).toMatch(/^Cash-out must be between/)
  })

  it('requires a valid start date', () => {
    expect(err(cash({ start: undefined }))).toBe('Start time is required')
    expect(err(cash({ start: 'not a date' }))).toBe('Start time must be a valid date')
    expect(err(cash({ end: 'nope' }))).toBe('End time must be a valid date')
  })

  it('requires end >= start', () => {
    expect(err(cash({ end: '2026-01-01T17:59:00.000Z' }))).toBe('End time must be after start time')
    expect(ok(cash({ end: START })).end.toISOString()).toBe(START)
  })

  it('limits notes and name length and trims the name', () => {
    expect(err(cash({ notes: 'x'.repeat(5001) }))).toMatch(/^Notes must be 5000/)
    expect(ok(cash({ notes: 'x'.repeat(5000) })).notes).toHaveLength(5000)
    expect(err(tournament({ name: 'x'.repeat(201) }))).toMatch(/^Name must be 200/)
    expect(ok(tournament({ name: '  Main Event  ' })).name).toBe('Main Event')
  })
})

describe('normalizeSession — cash games', () => {
  it('keeps the stake exactly as typed', () => {
    expect(ok(cash({ name: '  NL25  ' })).name).toBe('NL25')
    expect(ok(cash({ name: '$0.10/$0.25' })).name).toBe('$0.10/$0.25')
  })

  it('does not require a stake name', () => {
    expect(ok(cash({ name: undefined })).name).toBeUndefined()
  })

  it('drops fields that are not part of a session', () => {
    const value = ok(cash({ sb: 1, bb: 2, hands: 300 }))
    expect(value).not.toHaveProperty('sb')
    expect(value).not.toHaveProperty('hands')
  })
})

describe('normalizeSession — tournaments', () => {
  it('requires a name', () => {
    expect(err(tournament({ name: undefined }))).toBe('Tournament name is required')
    expect(err(tournament({ name: '   ' }))).toBe('Tournament name is required')
  })
})
