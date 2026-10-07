/**
 * Migration: move existing data onto the Club WPT Gold model.
 *
 *   (a) Transactions 'Deposit'    → 'Purchase'   (cost = amount)
 *   (b) Transactions 'Withdrawal' → 'Redemption' (status = 'Completed')
 *   (c) Users: drop legacy resetToken and team fields
 *   (d) syncIndexes() on every model (after removing duplicate session ledger rows,
 *       which would block the new unique { sessionId, type } index)
 *
 * DRY RUN by default — nothing is written. Pass --apply to write changes.
 * Safe to run repeatedly.
 *
 * Usage (from the server/ directory):
 *   npm run migrate:gold            # dry run
 *   npm run migrate:gold -- --apply # write changes
 */
/* eslint-disable no-console */
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User, { ROLES } from '../models/User.js'
import Session from '../models/Session.js'
import Transaction from '../models/Transaction.js'
import Message from '../models/Message.js'
import PlayerNote from '../models/PlayerNote.js'

dotenv.config({ path: process.env.BBB_ENV_PATH || './config/.env' })

const APPLY = process.argv.includes('--apply')

const MONGO_URL = process.env.MONGO_URL
if (!MONGO_URL) {
  console.error('MONGO_URL is not set. Check server/config/.env (or BBB_ENV_PATH)')
  process.exit(1)
}

const verb = APPLY ? 'updated' : 'would update'

// (a) Deposit → Purchase
const migrateDeposits = async db => {
  const filter = { type: 'Deposit' }
  const count = await db.collection('transactions').countDocuments(filter)
  if (APPLY && count) {
    await db
      .collection('transactions')
      .updateMany(filter, [{ $set: { type: 'Purchase', cost: { $ifNull: ['$cost', '$amount'] } } }])
  }
  console.log(`(a) Deposit → Purchase: ${verb} ${count}`)
}

// (b) Withdrawal → Redemption
const migrateWithdrawals = async db => {
  const filter = { type: 'Withdrawal' }
  const count = await db.collection('transactions').countDocuments(filter)
  if (APPLY && count) {
    await db.collection('transactions').updateMany(filter, { $set: { type: 'Redemption', status: 'Completed' } })
  }
  console.log(`(b) Withdrawal → Redemption: ${verb} ${count}`)
}

// (c) Legacy user fields
const migrateUsers = async db => {
  const users = db.collection('users')
  const resetCount = await users.countDocuments({ resetToken: { $exists: true } })
  const teamCount = await users.countDocuments({ team: { $exists: true } })
  if (APPLY && (resetCount || teamCount)) {
    await users.updateMany(
      { $or: [{ resetToken: { $exists: true } }, { team: { $exists: true } }] },
      { $unset: { resetToken: '', team: '' } }
    )
  }
  console.log(`(c) Users: unset resetToken ${verb} ${resetCount}, unset team ${verb} ${teamCount}`)

  const badRoles = await users.countDocuments({ role: { $exists: true, $nin: ROLES } })
  if (badRoles) console.log(`    Note: ${badRoles} user(s) have a role outside ${ROLES.join('/')} — fix by hand`)
}

// (d) Indexes
const migrateIndexes = async db => {
  // The unique { sessionId, type } index cannot be built while duplicates exist.
  // Ledger rows are derived from their session, so keep the newest of each pair.
  const dupes = await db
    .collection('transactions')
    .aggregate([
      { $match: { sessionId: { $exists: true } } },
      { $sort: { updatedAt: -1, _id: -1 } },
      { $group: { _id: { sessionId: '$sessionId', type: '$type' }, ids: { $push: '$_id' }, n: { $sum: 1 } } },
      { $match: { n: { $gt: 1 } } },
    ])
    .toArray()
  const extraIds = dupes.flatMap(d => d.ids.slice(1))
  if (APPLY && extraIds.length) {
    await db.collection('transactions').deleteMany({ _id: { $in: extraIds } })
  }
  console.log(`(d) Duplicate session ledger rows: ${APPLY ? 'removed' : 'would remove'} ${extraIds.length}`)

  for (const Model of [User, Session, Transaction, Message, PlayerNote]) {
    if (APPLY) {
      const dropped = await Model.syncIndexes()
      console.log(`    ${Model.modelName}: indexes synced${dropped.length ? ` (dropped: ${dropped.join(', ')})` : ''}`)
    } else {
      const diff = await Model.diffIndexes()
      const create = diff.toCreate.map(i => JSON.stringify(i)).join(', ') || 'none'
      const drop = diff.toDrop.join(', ') || 'none'
      console.log(`    ${Model.modelName}: would create ${create}; would drop ${drop}`)
    }
  }
}

let exitCode = 0
try {
  // Indexes are managed explicitly in step (d)
  mongoose.set('autoIndex', false)
  mongoose.set('strictQuery', true)
  await mongoose.connect(MONGO_URL)
  console.log(`Connected to MongoDB — ${APPLY ? 'APPLYING changes' : 'DRY RUN (pass --apply to write)'}`)

  const db = mongoose.connection.db
  await migrateDeposits(db)
  await migrateWithdrawals(db)
  await migrateUsers(db)
  await migrateIndexes(db)

  console.log(APPLY ? 'Done.' : 'Dry run complete — no changes written.')
} catch (error) {
  console.error('Migration failed:', error)
  exitCode = 1
} finally {
  await mongoose.disconnect()
}
process.exit(exitCode)
