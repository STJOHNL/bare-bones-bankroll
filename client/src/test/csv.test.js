import { describe, it, expect } from 'vitest'
import { escapeCsvCell, parseCsv, parseCsvObjects, toCsv } from '../utils/csv'

describe('escapeCsvCell', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"')
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"')
  })

  it('neutralises spreadsheet formulas in text', () => {
    expect(escapeCsvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(escapeCsvCell('+1')).toBe("'+1")
  })

  it('leaves numbers alone, including negatives', () => {
    expect(escapeCsvCell(-5.5)).toBe('-5.5')
    expect(escapeCsvCell(null)).toBe('')
  })
})

describe('parseCsv', () => {
  it('handles quoted commas, escaped quotes and embedded newlines', () => {
    const text = 'name,notes\r\n"Sunday, Major","He said ""fold""\nthen shoved"\r\nTurbo,\r\n'
    expect(parseCsv(text)).toEqual([
      ['name', 'notes'],
      ['Sunday, Major', 'He said "fold"\nthen shoved'],
      ['Turbo', ''],
    ])
  })

  it('strips a byte-order mark and skips blank lines', () => {
    expect(parseCsv('\uFEFFa,b\n\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})

describe('round trip', () => {
  it('re-reads exactly what was written', () => {
    const headers = ['name', 'notes', 'buyin']
    const rows = [
      ['Sunday, Major', 'multi\nline "quoted"', 10],
      ['=cmd', '-tilted', 5.5],
    ]
    const objects = parseCsvObjects(toCsv(headers, rows))
    expect(objects).toEqual([
      { name: 'Sunday, Major', notes: 'multi\nline "quoted"', buyin: '10' },
      { name: '=cmd', notes: '-tilted', buyin: '5.5' },
    ])
  })

  it('lower-cases headers', () => {
    expect(parseCsvObjects('Venue,Type\nOnline,Cash')).toEqual([{ venue: 'Online', type: 'Cash' }])
  })
})
