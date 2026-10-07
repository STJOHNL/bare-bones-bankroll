// Bankroll math shared by the navbar balance, the Bankroll page and tests.
//
// Club WPT Gold model:
// - Purchase: dollars paid (`cost`) for chips credited (`amount`). Any extra
//   chips over what was paid are bonus value.
// - Redemption: chips cashed out. Pending and Completed redemptions leave the
//   playable balance; Cancelled ones are returned to it.

export const MANUAL_TYPES = ['Purchase', 'Redemption', 'Promo']
export const SESSION_TYPES = ['Buy-in', 'Cash-out']
export const REDEMPTION_STATUSES = ['Pending', 'Completed', 'Cancelled']

// Older records used Deposit/Withdrawal — read them as Purchase/Redemption
export const normalizeTransaction = t => {
  if (t.type === 'Deposit') return { ...t, type: 'Purchase', cost: t.cost ?? t.amount }
  if (t.type === 'Withdrawal') return { ...t, type: 'Redemption', status: t.status || 'Completed' }
  if (t.type === 'Purchase') return { ...t, cost: t.cost ?? t.amount }
  if (t.type === 'Redemption') return { ...t, status: t.status || 'Pending' }
  return t
}

export const isSessionTransaction = t => SESSION_TYPES.includes(t.type)

// Does this transaction add chips to the balance?
export const isCredit = t => ['Purchase', 'Promo', 'Cash-out', 'Deposit'].includes(t.type)

const roundCents = n => Math.round(n * 100) / 100

export const computeBankroll = transactions => {
  const totals = {
    purchasedChips: 0,
    spent: 0,
    bonus: 0,
    promos: 0,
    buyins: 0,
    cashouts: 0,
    redeemed: 0,
    pending: 0,
  }

  for (const raw of transactions) {
    const t = normalizeTransaction(raw)
    const amount = t.amount || 0
    switch (t.type) {
      case 'Purchase':
        totals.purchasedChips += amount
        totals.spent += t.cost
        totals.bonus += amount - t.cost
        break
      case 'Promo':
        totals.promos += amount
        break
      case 'Buy-in':
        totals.buyins += amount
        break
      case 'Cash-out':
        totals.cashouts += amount
        break
      case 'Redemption':
        if (t.status === 'Completed') totals.redeemed += amount
        else if (t.status === 'Pending') totals.pending += amount
        break
      default:
        break
    }
  }

  const balance =
    totals.purchasedChips + totals.promos + totals.cashouts - totals.buyins - totals.redeemed - totals.pending

  // Poker results plus every free chip received (promos and purchase bonuses)
  const profit = totals.cashouts - totals.buyins + totals.promos + totals.bonus

  // Real money: what came back to you minus what you paid
  const netCash = totals.redeemed - totals.spent

  return Object.fromEntries(
    Object.entries({ ...totals, balance, profit, netCash }).map(([k, v]) => [k, roundCents(v)])
  )
}
