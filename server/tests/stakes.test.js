import { describe, it, expect } from '@jest/globals'
import { parseStakes, stakesLabel, defaultSmallBlind } from '../utils/stakes.js'

describe('stakesLabel', () => {
  it.each([
    ['NL', 0.1, 'NL10'],
    ['PLO', 2, 'PLO200'],
    ['NL', 0.02, 'NL2'],
    ['NL', 0.25, 'NL25'],
    ['PLO', 0.5, 'PLO50'],
  ])('(%s, %s) → %s', (game, bb, label) => {
    expect(stakesLabel(game, bb)).toBe(label)
  })
})

describe('defaultSmallBlind', () => {
  it.each([
    [0.02, 0.01],
    [0.05, 0.02],
    [0.1, 0.05],
    [0.25, 0.1],
    [0.5, 0.25],
    [1, 0.5],
    [2, 1],
    [4, 2],
    [5, 2],
    [10, 5],
    [25, 10],
    [0.2, 0.1],
    [3, 1.5],
  ])('bb %s → sb %s', (bb, sb) => {
    expect(defaultSmallBlind(bb)).toBe(sb)
  })
})

describe('parseStakes', () => {
  it.each([
    ['NL20', { sb: 0.1, bb: 0.2, game: 'NL' }],
    ['nl20', { sb: 0.1, bb: 0.2, game: 'NL' }],
    ['NL 20', { sb: 0.1, bb: 0.2, game: 'NL' }],
    ['NLH20', { sb: 0.1, bb: 0.2, game: 'NL' }],
    ['PLO50', { sb: 0.25, bb: 0.5, game: 'PLO' }],
    ['20NL', { sb: 0.1, bb: 0.2, game: 'NL' }],
    ['$0.10/$0.20', { sb: 0.1, bb: 0.2 }],
    ['0.1/0.2', { sb: 0.1, bb: 0.2 }],
    ['.05/.10', { sb: 0.05, bb: 0.1 }],
    ['1/2', { sb: 1, bb: 2 }],
    ['$1/$2 NL', { sb: 1, bb: 2, game: 'NL' }],
    ['NL10 ($0.05/$0.10)', { sb: 0.05, bb: 0.1, game: 'NL' }],
    ['NL10', { sb: 0.05, bb: 0.1, game: 'NL' }],
    ['NL2', { sb: 0.01, bb: 0.02, game: 'NL' }],
    ['NL25', { sb: 0.1, bb: 0.25, game: 'NL' }],
    ['PLO 200', { sb: 1, bb: 2, game: 'PLO' }],
    ['Omaha 1/2', { sb: 1, bb: 2, game: 'PLO' }],
    ["Hold'em 2/5", { sb: 2, bb: 5, game: 'NL' }],
    ['  plo10  ', { sb: 0.05, bb: 0.1, game: 'PLO' }],
  ])('%s', (text, expected) => {
    expect(parseStakes(text)).toEqual(expected)
  })

  it('omits game when it cannot be detected', () => {
    expect(parseStakes('1/2')).not.toHaveProperty('game')
  })

  it.each([
    ['Sunday Million'],
    [''],
    ['   '],
    ['NL0'],
    ['0/0'],
    ['2/1'],
    ['NL'],
    [null],
    [undefined],
    [42],
  ])('returns null for %p', text => {
    expect(parseStakes(text)).toBeNull()
  })
})
