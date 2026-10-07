import Transaction from '../models/Transaction.js'

const upsertOptions = { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }

/**
 * Keep a session's Buy-in / Cash-out transactions in step with the session.
 * - Buy-in always exists (amount = buyin, dated at start)
 * - Cash-out exists only while cashout > 0 (dated at end, falling back to start)
 */
export const syncSessionLedger = async session => {
  const key = { sessionId: session._id, user: session.user }

  await Transaction.findOneAndUpdate(
    { ...key, type: 'Buy-in' },
    { $set: { amount: session.buyin ?? 0, date: session.start, note: session.name } },
    upsertOptions
  )

  if (session.cashout > 0) {
    await Transaction.findOneAndUpdate(
      { ...key, type: 'Cash-out' },
      { $set: { amount: session.cashout, date: session.end || session.start, note: session.name } },
      upsertOptions
    )
  } else {
    await Transaction.deleteOne({ ...key, type: 'Cash-out' })
  }
}

export default { syncSessionLedger }
