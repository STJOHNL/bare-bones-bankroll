/**
 * One-time migration: backfill the `user` field on all Session and Transaction
 * documents that were created before user-scoping was added.
 *
 * Usage (from the server/ directory) — USER_EMAIL is required so documents are
 * never silently assigned to the wrong account:
 *   USER_EMAIL=you@example.com node scripts/migrateUserField.js
 */
/* eslint-disable no-console */
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: process.env.BBB_ENV_PATH || './config/.env' })

const userEmail = process.env.USER_EMAIL
if (!userEmail) {
  console.error('USER_EMAIL is not set. Run: USER_EMAIL=you@example.com node scripts/migrateUserField.js')
  process.exit(1)
}

const MONGO_URL = process.env.MONGO_URL
if (!MONGO_URL) {
  console.error('MONGO_URL is not set. Check server/config/.env')
  process.exit(1)
}

await mongoose.connect(MONGO_URL)
console.log('Connected to MongoDB')

const db = mongoose.connection.db

// Find target user
const user = await db.collection('users').findOne({ email: userEmail.toLowerCase() })

if (!user) {
  console.error(`No user found with email ${userEmail}. Sign up first, then re-run this script.`)
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
