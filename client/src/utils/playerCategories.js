// Player types for colour-coding opponents. Keys match server/models/PlayerNote.js.
// Colours are mid-tones that read on both the light and dark themes.
export const PLAYER_CATEGORIES = [
  { key: 'rec', label: 'Rec', color: '#22a35a', hint: 'Recreational — plays too many hands, calls too much' },
  { key: 'whale', label: 'Whale', color: '#2f80ed', hint: 'Big-losing rec — top target' },
  { key: 'reg', label: 'Reg', color: '#e5484d', hint: 'Solid regular — avoid marginal spots' },
  { key: 'nit', label: 'Nit', color: '#d4880f', hint: 'Very tight — respect their raises' },
  { key: 'maniac', label: 'Maniac', color: '#9b5de5', hint: 'Hyper-aggressive — call down lighter' },
  { key: 'unknown', label: 'Unknown', color: '#8b8f98', hint: 'Not enough hands yet' },
]

const BY_KEY = Object.fromEntries(PLAYER_CATEGORIES.map(c => [c.key, c]))

export const playerCategory = key => BY_KEY[key] || BY_KEY.unknown

// Pinned first, then most recently updated
export const sortPlayerNotes = notes =>
  [...notes].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || new Date(b.updatedAt) - new Date(a.updatedAt))

export const initials = name =>
  name
    .trim()
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || '?'
