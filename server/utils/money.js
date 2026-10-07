// Mongoose setter: round money / stake values to 2 decimal places
export const roundCents = v => (v == null ? v : Math.round(v * 100) / 100)

export default roundCents
