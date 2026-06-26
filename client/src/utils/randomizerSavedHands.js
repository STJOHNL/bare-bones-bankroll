export const SAVED_HANDS_STORAGE_KEY = 'randomizerSavedHands'

export const createSavedHand = ({ title, notes, details }) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  title: title.trim() || 'Saved hand',
  notes: notes.trim(),
  details: details.trim(),
  createdAt: new Date().toISOString(),
})

export const loadSavedHands = () => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(SAVED_HANDS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    console.error('Failed to load saved hands', error)
    return []
  }
}

export const saveSavedHands = hands => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(SAVED_HANDS_STORAGE_KEY, JSON.stringify(hands))
}
