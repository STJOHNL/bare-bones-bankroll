import { describe, it, expect } from '@jest/globals'
import { normalizeSession, pickSessionFields } from '../utils/sessionRules.js'

const START = '2026-01-01T18:00:00.000Z'
const END = '2026-01-01T20:00:00.000Z'

const cash = (overrides = {}) => ({
  venue: 'Online',
  type: 'Cash',
  game: 'NL',
  sb: 0.05,
  bb: 0.1,
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
      ['buyin', 'bb', 'cashout', 'end', 'game', 'hands', 'name', 'notes', 'sb', 'start', 'type', 'venue'].sort()
    )
  })

  it('pickSessionFields only returns own whitelisted keys', () => {
    expect(pickSessionFields({ cashout: 5, _id: 'x', user: 'y' })).toEqual({ cashout: 5 })
    expect(pickSessionFields(null)).toEqual({})
  })

  it('coerces numeric strings to numbers', () => {
    const value = ok(cash({ buyin: '50', cashout: ' 75.5 ', sb: '0.05', bb: '0.10', hands: '120' }))
    expect(value.buyin).toBe(50)
    expect(value.cashout).toBe(75.5)
    expect(value.sb).toBe(0.05)
    expect(value.bb).toBe(0.1)
    expect(value.hands).toBe(120)
  })

  it('rejects non-numeric numbers', () => {
    expect(err(cash({ buyin: 'abc' }))).toBe('Buy-in must be a number')
    expect(err(cash({ buyin: true }))).toBe('Buy-in must be a number')
    expect(err(cash({ cashout: { $gt: 0 } }))).toBe('Cash-out must be a number')
    expect(err(cash({ bb: [1] }))).toBe('Big blind must be a number')
  })

  it('rejects non-string strings', () => {
    expect(err(tournament({ name: { $ne: null } }))).toBe('Name must be text')
    expect(err(cash({ notes: 5 }))).toBe('Notes must be text')
    expect(err(cash({ venue: ['Online'] }))).toMatch(/^Venue must be one of/)
  })

  it('treats empty string / null as unset for end, hands and cashout', () => {
    const value = ok(cash({ end: '', hands: null, cashout: '' }))
    expect(value.end).toBeUndefined()
    expect(value.hands).toBeUndefined()
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
  it('derives the name from game + big blind', () => {
    expect(ok(cash({ name: 'whatever' })).name).toBe('NL10')
    expect(ok(cash({ game: 'PLO', sb: 1, bb: 2 })).name).toBe('PLO200')
    expect(ok(cash({ sb: 0.01, bb: 0.02 })).name).toBe('NL2')
  })

  it('requires stakes when the name cannot be parsed', () => {
    expect(err(cash({ sb: undefined, bb: undefined, name: 'Home game' }))).toBe(
      'Stakes are required for cash sessions'
    )
    expect(err(cash({ sb: undefined, bb: undefined }))).toBe('Stakes are required for cash sessions')
  })

  it('parses stakes from the name when they are missing', () => {
    const value = ok(cash({ sb: undefined, bb: undefined, name: 'NL25' }))
    expect(value).toMatchObject({ sb: 0.1, bb: 0.25, name: 'NL25', game: 'NL' })
  })

  it('fills game from the name only when game is missing', () => {
    expect(ok(cash({ game: undefined, sb: undefined, bb: undefined, name: 'PLO50' }))).toMatchObject({
      game: 'PLO',
      bb: 0.5,
      name: 'PLO50',
    })
    expect(ok(cash({ game: 'NL', sb: undefined, bb: undefined, name: 'PLO50' }))).toMatchObject({
      game: 'NL',
      name: 'NL50',
    })
  })

  it('defaults the small blind when only the big blind is given', () => {
    expect(ok(cash({ sb: undefined, bb: 0.1 })).sb).toBe(0.05)
  })

  it('validates blind sizes', () => {
    expect(err(cash({ sb: 0.2, bb: 0.1 }))).toBe('Small blind cannot be larger than the big blind')
    expect(err(cash({ sb: 0, bb: 0.1 }))).toBe('Small blind must be greater than 0')
    expect(err(cash({ sb: 0.05, bb: 0 }))).toBe('Big blind must be greater than 0')
    expect(err(cash({ sb: 1, bb: 100001 }))).toMatch(/^Big blind must be 100,000 or less/)
    expect(ok(cash({ sb: 50000, bb: 100000 })).bb).toBe(100000)
  })

  it('validates hands as a non-negative integer', () => {
    expect(ok(cash({ hands: 0 })).hands).toBe(0)
    expect(err(cash({ hands: 1.5 }))).toBe('Hands must be a whole number of 0 or more')
    expect(err(cash({ hands: -1 }))).toBe('Hands must be a whole number of 0 or more')
  })
})

describe('normalizeSession — tournaments', () => {
  it('requires a name', () => {
    expect(err(tournament({ name: undefined }))).toBe('Tournament name is required')
    expect(err(tournament({ name: '   ' }))).toBe('Tournament name is required')
  })

  it('unsets sb, bb and hands', () => {
    const value = ok(tournament({ sb: 1, bb: 2, hands: 300 }))
    expect(value.sb).toBeUndefined()
    expect(value.bb).toBeUndefined()
    expect(value.hands).toBeUndefined()
    expect(value.name).toBe('Sunday MTT')
  })
})
