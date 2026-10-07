import { describe, it, expect } from 'vitest'
import { computeBankroll, normalizeTransaction } from '../utils/bankroll'

describe('computeBankroll', () => {
  it('returns zeros for no transactions', () => {
    const r = computeBankroll([])
    expect(r.balance).toBe(0)
    expect(r.profit).toBe(0)
    expect(r.netCash).toBe(0)
  })

  it('credits purchased chips and tracks dollars spent and bonus separately', () => {
    const r = computeBankroll([{ type: 'Purchase', amount: 120, cost: 100 }])
    expect(r.balance).toBe(120)
    expect(r.spent).toBe(100)
    expect(r.bonus).toBe(20)
    // Bonus chips count toward profit
    expect(r.profit).toBe(20)
    expect(r.netCash).toBe(-100)
  })

  it('treats a purchase without cost as paid at face value', () => {
    const r = computeBankroll([{ type: 'Purchase', amount: 50 }])
    expect(r.spent).toBe(50)
    expect(r.bonus).toBe(0)
  })

  it('applies session buy-ins and cash-outs', () => {
    const r = computeBankroll([
      { type: 'Purchase', amount: 100, cost: 100 },
      { type: 'Buy-in', amount: 20 },
      { type: 'Cash-out', amount: 35.5 },
    ])
    expect(r.balance).toBe(115.5)
    expect(r.profit).toBe(15.5)
  })

  it('removes pending and completed redemptions from the balance but not cancelled ones', () => {
    const r = computeBankroll([
      { type: 'Purchase', amount: 200, cost: 200 },
      { type: 'Redemption', amount: 50, status: 'Pending' },
      { type: 'Redemption', amount: 30, status: 'Completed' },
      { type: 'Redemption', amount: 999, status: 'Cancelled' },
    ])
    expect(r.balance).toBe(120)
    expect(r.pending).toBe(50)
    expect(r.redeemed).toBe(30)
    expect(r.netCash).toBe(-170)
  })

  it('adds promos to balance and profit', () => {
    const r = computeBankroll([{ type: 'Promo', amount: 25 }])
    expect(r.balance).toBe(25)
    expect(r.profit).toBe(25)
  })

  it('avoids floating point drift', () => {
    const r = computeBankroll([
      { type: 'Promo', amount: 0.1 },
      { type: 'Promo', amount: 0.2 },
    ])
    expect(r.balance).toBe(0.3)
  })
})

describe('normalizeTransaction', () => {
  it('maps legacy deposits and withdrawals', () => {
    expect(normalizeTransaction({ type: 'Deposit', amount: 10 })).toMatchObject({ type: 'Purchase', cost: 10 })
    expect(normalizeTransaction({ type: 'Withdrawal', amount: 10 })).toMatchObject({
      type: 'Redemption',
      status: 'Completed',
    })
  })

  it('defaults a redemption without status to pending', () => {
    expect(normalizeTransaction({ type: 'Redemption', amount: 5 }).status).toBe('Pending')
  })

  it('includes legacy rows in the balance', () => {
    const r = computeBankroll([
      { type: 'Deposit', amount: 100 },
      { type: 'Withdrawal', amount: 40 },
    ])
    expect(r.balance).toBe(60)
    expect(r.redeemed).toBe(40)
  })
})
