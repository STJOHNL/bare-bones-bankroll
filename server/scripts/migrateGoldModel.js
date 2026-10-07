/**
 * Migration: move existing data onto the Club WPT Gold model.
 *
 *   (a) Transactions 'Deposit'    → 'Purchase'   (cost = amount)
 *   (b) Transactions 'Withdrawal' → 'Redemption' (status = 'Completed')
 *   (c) Cash sessions without stakes: parse sb/bb from the name and relabel (e.g. 'NL25')
 *   (d) Users: drop legacy resetToken and team fields
 *   (e) syncIndexes() on every model (after removing duplicate session ledger rows,
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
import { parseStakes, stakesLabel } from '../utils/stakes.js'

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

// (c) Cash sessions missing stakes
const migrateCashStakes = async db => {
  const sessions = await db
    .collection('sessions')
    .find({ type: 'Cash', $or: [{ bb: { $exists: false } }, { bb: null }] })
    .project({ name: 1, game: 1 })
    .toArray()

  let parsedCount = 0
  const unparsed = new Map()
  const ops = []

  for (const s of sessions) {
    const parsed = parseStakes(s.name)
    const game = s.game || parsed?.game
    if (!parsed || !game) {
      const key = s.name ?? '(no name)'
      unparsed.set(key, (unparsed.get(key) || 0) + 1)
      continue
    }
    parsedCount++
    ops.push({
      updateOne: {
        filter: { _id: s._id },
        update: { $set: { sb: parsed.sb, bb: parsed.bb, game, name: stakesLabel(game, parsed.bb) } },
      },
    })
  }

  if (APPLY && ops.length) await db.collection('sessions').bulkWrite(ops)

  const unparsedTotal = sessions.length - parsedCount
  console.log(`(c) Cash sessions missing stakes: ${sessions.length} found, ${verb} ${parsedCount}, ${unparsedTotal} could not be parsed`)
  if (unparsed.size) {
    console.table(
      [...unparsed.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
    )
  }
}

// (d) Legacy user fields
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
  console.log(`(d) Users: unset resetToken ${verb} ${resetCount}, unset team ${verb} ${teamCount}`)

  const badRoles = await users.countDocuments({ role: { $exists: true, $nin: ROLES } })
  if (badRoles) console.log(`    Note: ${badRoles} user(s) have a role outside ${ROLES.join('/')} — fix by hand`)
}

// (e) Indexes
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
  console.log(`(e) Duplicate session ledger rows: ${APPLY ? 'removed' : 'would remove'} ${extraIds.length}`)

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
  // Indexes are managed explicitly in step (e)
  mongoose.set('autoIndex', false)
  mongoose.set('strictQuery', true)
  await mongoose.connect(MONGO_URL)
  console.log(`Connected to MongoDB — ${APPLY ? 'APPLYING changes' : 'DRY RUN (pass --apply to write)'}`)

  const db = mongoose.connection.db
  await migrateDeposits(db)
  await migrateWithdrawals(db)
  await migrateCashStakes(db)
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
