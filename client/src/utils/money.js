// Currency formatting shared across pages

export const formatMoney = value => `$${(Number(value) || 0).toFixed(2)}`

// '+$12.50' / '-$4.00' — sign before the dollar sign
export const formatSigned = value => {
  const n = Number(value) || 0
  return `${n >= 0 ? '+' : '-'}$${Math.abs(n).toFixed(2)}`
}

// '-$4.00' for negatives, '$12.50' otherwise
export const formatPL = value => {
  const n = Number(value) || 0
  return `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`
}

export const plColor = value => ((Number(value) || 0) >= 0 ? 'var(--green)' : 'var(--red)')
