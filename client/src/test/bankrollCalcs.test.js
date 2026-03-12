/**
 * Unit tests for the bankroll balance calculation logic that lives in
 * BankrollContext. These test the pure math without needing to render React.
 */
import { describe, it, expect } from 'vitest'

// --- Pure helpers extracted from BankrollContext for testability ---

const TRANSACTION_TYPES = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  BUYIN: 'Buy-in',
  CASHOUT: 'Cash-out',
  PROMO: 'Promo',
}

function calculateBalance(transactions) {
  return transactions.reduce((total, txn) => {
    switch (txn.type) {
      case TRANSACTION_TYPES.DEPOSIT:
      case TRANSACTION_TYPES.PROMO:
      case TRANSACTION_TYPES.CASHOUT:
        return total + txn.amount
      case TRANSACTION_TYPES.WITHDRAWAL:
      case TRANSACTION_TYPES.BUYIN:
        return total - txn.amount
      default:
        return total
    }
  }, 0)
}

function calculatePL(transactions) {
  const cashouts = transactions
    .filter(t => t.type === TRANSACTION_TYPES.CASHOUT)
    .reduce((s, t) => s + t.amount, 0)
  const buyins = transactions
    .filter(t => t.type === TRANSACTION_TYPES.BUYIN)
    .reduce((s, t) => s + t.amount, 0)
  return cashouts - buyins
}

// --- Tests ---

describe('calculateBalance', () => {
  it('returns 0 for an empty transaction list', () => {
    expect(calculateBalance([])).toBe(0)
  })

  it('adds deposits to balance', () => {
    const txns = [{ type: 'Deposit', amount: 500 }]
    expect(calculateBalance(txns)).toBe(500)
  })

  it('subtracts withdrawals from balance', () => {
    const txns = [
      { type: 'Deposit', amount: 500 },
      { type: 'Withdrawal', amount: 200 },
    ]
    expect(calculateBalance(txns)).toBe(300)
  })

  it('subtracts buy-ins and adds cash-outs', () => {
    const txns = [
      { type: 'Deposit', amount: 1000 },
      { type: 'Buy-in', amount: 100 },
      { type: 'Cash-out', amount: 150 },
    ]
    // 1000 - 100 + 150 = 1050
    expect(calculateBalance(txns)).toBe(1050)
  })

  it('adds promos to balance', () => {
    const txns = [{ type: 'Promo', amount: 25 }]
    expect(calculateBalance(txns)).toBe(25)
  })

  it('handles a losing session correctly', () => {
    const txns = [
      { type: 'Deposit', amount: 500 },
      { type: 'Buy-in', amount: 200 },
      { type: 'Cash-out', amount: 0 },
    ]
    // 500 - 200 + 0 = 300
    expect(calculateBalance(txns)).toBe(300)
  })
})

describe('calculatePL', () => {
  it('returns 0 with no session transactions', () => {
    expect(calculatePL([])).toBe(0)
  })

  it('calculates profit correctly', () => {
    const txns = [
      { type: 'Buy-in', amount: 100 },
      { type: 'Cash-out', amount: 250 },
    ]
    expect(calculatePL(txns)).toBe(150)
  })

  it('calculates loss correctly', () => {
    const txns = [
      { type: 'Buy-in', amount: 200 },
      { type: 'Cash-out', amount: 50 },
    ]
    expect(calculatePL(txns)).toBe(-150)
  })

  it('ignores non-session transaction types', () => {
    const txns = [
      { type: 'Deposit', amount: 1000 },
      { type: 'Buy-in', amount: 100 },
      { type: 'Cash-out', amount: 180 },
    ]
    expect(calculatePL(txns)).toBe(80)
  })
})
