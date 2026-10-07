import { describe, it, expect } from 'vitest'
import { format } from 'date-fns'
import { inDateRange, localDateToISO, parseLocalDate, toDateTimeLocal, formatDuration } from '../utils/dates'

describe('local dates', () => {
  it('keeps a picked calendar date on the same local day', () => {
    const iso = localDateToISO('2026-03-05')
    expect(format(new Date(iso), 'yyyy-MM-dd')).toBe('2026-03-05')
  })

  it('parses date inputs as local midnight, not UTC', () => {
    const d = parseLocalDate('2026-03-05')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 2, 5, 0])
  })

  it('treats the "to" date as inclusive of the whole day', () => {
    const lateEvening = new Date(2026, 2, 5, 23, 30)
    expect(inDateRange(lateEvening, '2026-03-05', '2026-03-05')).toBe(true)
    expect(inDateRange(new Date(2026, 2, 6, 0, 1), '2026-03-05', '2026-03-05')).toBe(false)
    expect(inDateRange(new Date(2026, 2, 4, 23, 59), '2026-03-05', '')).toBe(false)
  })

  it('formats datetime-local values in local time', () => {
    expect(toDateTimeLocal(new Date(2026, 0, 2, 3, 4))).toBe('2026-01-02T03:04')
  })

  it('formats durations', () => {
    expect(formatDuration(90 * 60000)).toBe('1h 30m')
    expect(formatDuration(45 * 60000)).toBe('45m')
    expect(formatDuration(2 * 3600000)).toBe('2h')
    expect(formatDuration(-1)).toBe('')
  })
})
