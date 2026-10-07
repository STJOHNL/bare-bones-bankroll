import { describe, it, expect } from 'vitest'
import { parseStakes, stakesLabel, formatBlinds, sessionLabel, sessionStakes, defaultSmallBlind } from '../utils/stakes'

describe('parseStakes', () => {
  it.each([
    ['NL20', { sb: 0.1, bb: 0.2, game: 'NL' }],
    ['nl20', { sb: 0.1, bb: 0.2, game: 'NL' }],
    ['NL 20', { sb: 0.1, bb: 0.2, game: 'NL' }],
    ['NLH20', { sb: 0.1, bb: 0.2, game: 'NL' }],
    ['PLO50', { sb: 0.25, bb: 0.5, game: 'PLO' }],
    ['20NL', { sb: 0.1, bb: 0.2, game: 'NL' }],
    ['NL25', { sb: 0.1, bb: 0.25, game: 'NL' }],
    ['NL5', { sb: 0.02, bb: 0.05, game: 'NL' }],
    ['$0.10/$0.20', { sb: 0.1, bb: 0.2 }],
    ['0.1/0.2', { sb: 0.1, bb: 0.2 }],
    ['.05/.10', { sb: 0.05, bb: 0.1 }],
    ['1/2', { sb: 1, bb: 2 }],
    ['$1/$2 NL', { sb: 1, bb: 2, game: 'NL' }],
    ['NL10 ($0.05/$0.10)', { sb: 0.05, bb: 0.1, game: 'NL' }],
  ])('parses %s', (text, expected) => {
    expect(parseStakes(text)).toEqual(expected)
  })

  it.each([['Sunday Major'], [''], [null], ['2/1'], ['NL0']])('rejects %s', text => {
    expect(parseStakes(text)).toBeNull()
  })
})

describe('labels', () => {
  it('builds the conventional stake name from the big blind', () => {
    expect(stakesLabel('NL', 0.1)).toBe('NL10')
    expect(stakesLabel('PLO', 2)).toBe('PLO200')
    expect(stakesLabel('NL', 0.02)).toBe('NL2')
  })

  it('formats blinds with cents below a dollar', () => {
    expect(formatBlinds(0.05, 0.1)).toBe('$0.05/$0.10')
    expect(formatBlinds(1, 2)).toBe('$1/$2')
  })

  it('uses the standard small blind for odd levels', () => {
    expect(defaultSmallBlind(0.25)).toBe(0.1)
    expect(defaultSmallBlind(0.4)).toBe(0.2)
  })

  it('labels cash sessions by stakes and tournaments by name', () => {
    expect(sessionLabel({ type: 'Cash', game: 'NL', sb: 0.05, bb: 0.1, name: 'whatever' })).toBe('NL10')
    expect(sessionLabel({ type: 'Tournament', game: 'NL', name: 'Sunday Major' })).toBe('Sunday Major')
  })

  it('falls back to parsing the name of legacy cash sessions', () => {
    expect(sessionStakes({ type: 'Cash', game: 'NL', name: 'NL50' })).toEqual({ sb: 0.25, bb: 0.5, game: 'NL' })
    expect(sessionLabel({ type: 'Cash', game: 'PLO', name: '$0.25/$0.50' })).toBe('PLO50')
  })
})
