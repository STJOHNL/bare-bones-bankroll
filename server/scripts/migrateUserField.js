/**
 * One-time migration: backfill the `user` field on all Session and Transaction
 * documents that were created before user-scoping was added.
 *
 * Usage (from the server/ directory):
 *   node scripts/migrateUserField.js
 *
 * If you have multiple users and want to assign to a specific one:
 *   USER_EMAIL=you@example.com node scripts/migrateUserField.js
 */
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: './config/.env' })

const MONGO_URL = process.env.MONGO_URL
if (!MONGO_URL) {
  console.error('MONGO_URL is not set. Check server/config/.env')
  process.exit(1)
}

await mongoose.connect(MONGO_URL)
console.log('Connected to MongoDB')

const db = mongoose.connection.db

// Find target user
const userEmail = process.env.USER_EMAIL
const userQuery = userEmail ? { email: userEmail } : {}
const user = await db.collection('users').findOne(userQuery, { sort: { createdAt: 1 } })

if (!user) {
  console.error('No user found. Sign up first, then re-run this script.')
  await mongoose.disconnect()
  process.exit(1)
}

console.log(`Assigning all unscoped documents to user: ${user.email} (${user._id})`)

// Backfill sessions without a user field
const sessionResult = await db
  .collection('sessions')
  .updateMany({ user: { $exists: false } }, { $set: { user: user._id } })

console.log(`Sessions updated: ${sessionResult.modifiedCount}`)

// Backfill transactions without a user field
const txnResult = await db
  .collection('transactions')
  .updateMany({ user: { $exists: false } }, { $set: { user: user._id } })

console.log(`Transactions updated: ${txnResult.modifiedCount}`)

await mongoose.disconnect()
console.log('Done.')
