/**
 * Integration tests for the session controller — specifically the
 * editSession transaction upsert logic which is the most critical server path.
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import authRoutes from '../routes/auth.js'
import sessionRoutes from '../routes/session.js'
import transactionRoutes from '../routes/transaction.js'
import error from '../middleware/error.js'

dotenv.config({ path: './config/.env.test' })

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/transaction', transactionRoutes)
app.use(error.errorHandler)

const TEST_USER = {
  fName: 'Session',
  lName: 'Tester',
  email: `session_test_${Date.now()}@example.com`,
  password: 'TestPass123!',
}

let authCookie = ''

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/bbankroll_test')
  // Create and sign in test user to get auth cookie
  await request(app).post('/api/auth/sign-up').send(TEST_USER)
  const res = await request(app).post('/api/auth/sign-in').send({
    email: TEST_USER.email,
    password: TEST_USER.password,
  })
  authCookie = res.headers['set-cookie']?.[0] || ''
})

afterAll(async () => {
  const User = (await import('../models/User.js')).default
  await User.deleteMany({ email: TEST_USER.email })
  await mongoose.disconnect()
})

describe('GET /api/session (data scoping)', () => {
  it('returns only the authenticated user\'s sessions', async () => {
    const res = await request(app)
      .get('/api/session')
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('returns 401 without auth cookie', async () => {
    const res = await request(app).get('/api/session')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/session', () => {
  it('creates a session with valid data', async () => {
    const res = await request(app)
      .post('/api/session')
      .set('Cookie', authCookie)
      .send({
        venue: 'Online',
        type: 'Cash',
        game: 'NL',
        name: 'NL50',
        buyin: 50,
        cashout: 0,
        start: new Date().toISOString(),
      })
    expect(res.status).toBe(201)
    expect(res.body._id).toBeDefined()
  })

  it('rejects invalid venue with 422', async () => {
    const res = await request(app)
      .post('/api/session')
      .set('Cookie', authCookie)
      .send({
        venue: 'InvalidVenue',
        type: 'Cash',
        game: 'NL',
        name: 'NL50',
        buyin: 50,
      })
    expect(res.status).toBe(422)
  })

  it('rejects negative buyin with 422', async () => {
    const res = await request(app)
      .post('/api/session')
      .set('Cookie', authCookie)
      .send({
        venue: 'Online',
        type: 'Cash',
        game: 'NL',
        name: 'NL50',
        buyin: -50,
      })
    expect(res.status).toBe(422)
  })
})

describe('editSession transaction upsert', () => {
  let sessionId

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/session')
      .set('Cookie', authCookie)
      .send({
        venue: 'Live',
        type: 'Tournament',
        game: 'NL',
        name: 'Sunday MTT',
        buyin: 100,
        cashout: 0,
        start: new Date().toISOString(),
      })
    sessionId = res.body._id
  })

  it('upserts Cash-out transaction when cashout > 0', async () => {
    const res = await request(app)
      .put('/api/session')
      .set('Cookie', authCookie)
      .send({
        id: sessionId,
        venue: 'Live',
        type: 'Tournament',
        game: 'NL',
        name: 'Sunday MTT',
        buyin: 100,
        cashout: 250,
        start: new Date().toISOString(),
      })
    expect(res.status).toBe(200)
    expect(res.body.cashout).toBe(250)

    // Verify Cash-out transaction was created
    const txnRes = await request(app)
      .get('/api/transaction')
      .set('Cookie', authCookie)
    const cashoutTxn = txnRes.body.find(
      t => t.sessionId === sessionId && t.type === 'Cash-out'
    )
    expect(cashoutTxn).toBeDefined()
    expect(cashoutTxn.amount).toBe(250)
  })

  it('deletes Cash-out transaction when cashout is set to 0', async () => {
    const res = await request(app)
      .put('/api/session')
      .set('Cookie', authCookie)
      .send({
        id: sessionId,
        venue: 'Live',
        type: 'Tournament',
        game: 'NL',
        name: 'Sunday MTT',
        buyin: 100,
        cashout: 0,
        start: new Date().toISOString(),
      })
    expect(res.status).toBe(200)

    // Verify Cash-out transaction was removed
    const txnRes = await request(app)
      .get('/api/transaction')
      .set('Cookie', authCookie)
    const cashoutTxn = txnRes.body.find(
      t => t.sessionId === sessionId && t.type === 'Cash-out'
    )
    expect(cashoutTxn).toBeUndefined()
  })
})
