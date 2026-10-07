// "Play decision" reaction animations. Eager URL imports are just strings —
// an image only downloads when it is actually shown.
const urls = pattern => Object.values(pattern)

export const yesGifs = urls(
  import.meta.glob('../assets/NumGenGifs/yes*.webp', { eager: true, query: '?url', import: 'default' })
)
export const noGifs = urls(
  import.meta.glob('../assets/NumGenGifs/no*.webp', { eager: true, query: '?url', import: 'default' })
)

const pick = list => list[Math.floor(Math.random() * list.length)]

// Rolls 1–100; 50 and above means play aggressively
export const rollDecision = () => {
  const roll = Math.floor(Math.random() * 100) + 1
  const aggressive = roll >= 50
  return { roll, aggressive, gif: pick(aggressive ? yesGifs : noGifs) }
}
