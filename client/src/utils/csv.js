// RFC 4180-style CSV helpers used by History export and Profile import.

// Cells starting with these could be run as formulas by spreadsheet apps
const FORMULA_START = /^[=+\-@\t\r]/

export const escapeCsvCell = value => {
  if (value === null || value === undefined) return ''
  let s = String(value)
  if (typeof value === 'string' && FORMULA_START.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const toCsv = (headers, rows) =>
  [headers, ...rows].map(row => row.map(escapeCsvCell).join(',')).join('\r\n')

/**
 * Parses CSV text into an array of rows (arrays of strings). Handles quoted
 * fields containing commas, newlines and escaped quotes ("").
 */
export const parseCsv = text => {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const src = text.replace(/^\uFEFF/, '')

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter(r => r.some(cell => cell.trim() !== ''))
}

// Undo the formula guard added by escapeCsvCell
const unguard = s => (/^'[=+\-@\t\r]/.test(s) ? s.slice(1) : s)

// Parses CSV text into objects keyed by lower-cased, trimmed header names
export const parseCsvObjects = text => {
  const [headerRow, ...rows] = parseCsv(text)
  if (!headerRow) return []
  const headers = headerRow.map(h => h.trim().toLowerCase())
  return rows.map(cells => Object.fromEntries(headers.map((h, i) => [h, unguard((cells[i] ?? '').trim())])))
}

export const downloadCsv = (filename, csv) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Columns shared by session export and import so exported files re-import cleanly
export const SESSION_CSV_COLUMNS = ['venue', 'type', 'game', 'name', 'buyin', 'cashout', 'start', 'end', 'notes']
