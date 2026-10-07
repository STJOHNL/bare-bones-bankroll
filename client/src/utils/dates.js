// Date helpers that keep calendar dates in the user's local timezone.
// A bare 'YYYY-MM-DD' passed to new Date() is read as UTC midnight, which
// shows up as the previous day anywhere west of UTC.

const pad = n => String(n).padStart(2, '0')

// 'YYYY-MM-DD' → Date at local midnight (or end of that local day)
export const parseLocalDate = (value, { endOfDay = false } = {}) => {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d)
}

// 'YYYY-MM-DD' → ISO string at local noon, so the stored instant falls on the
// same calendar day in any nearby timezone
export const localDateToISO = value => {
  const date = parseLocalDate(value)
  if (!date) return undefined
  date.setHours(12)
  return date.toISOString()
}

// Date (or ISO string) → 'YYYY-MM-DDTHH:mm' for datetime-local inputs
export const toDateTimeLocal = (date = new Date()) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// True when `date` is within the inclusive local-day range [from, to]
export const inDateRange = (date, from, to) => {
  const t = new Date(date)
  const fromDate = parseLocalDate(from)
  const toDate = parseLocalDate(to, { endOfDay: true })
  if (fromDate && t < fromDate) return false
  if (toDate && t > toDate) return false
  return true
}

export const formatDuration = ms => {
  if (!(ms > 0)) return ''
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
