/**
 * Integration tests for the auth controller.
 * These run against a real (test) MongoDB connection via a mock or
 * an in-memory store — configure MONGO_URL in a .env.test file.
 *
 * Run: npm test
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import authRoutes from '../routes/auth.js'
import error from '../middleware/error.js'

dotenv.config({ path: './config/.env.test' })

// Build a minimal Express app for testing — no morgan, no static files
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRoutes)
app.use(error.errorHandler)

const TEST_USER = {
  fName: 'Test',
  lName: 'User',
  email: `test_${Date.now()}@example.com`,
  password: 'TestPass123!',
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/bbankroll_test')
})

afterAll(async () => {
  // Clean up the test user so tests are idempotent
  const User = (await import('../models/User.js')).default
  await User.deleteMany({ email: TEST_USER.email })
  await mongoose.disconnect()
})

describe('POST /api/auth/sign-up', () => {
  it('creates a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/sign-up').send(TEST_USER)
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
  })

  it('rejects duplicate email with 400', async () => {
    const res = await request(app).post('/api/auth/sign-up').send(TEST_USER)
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/already exists/i)
  })

  it('rejects short password with 422', async () => {
    const res = await request(app)
      .post('/api/auth/sign-up')
      .send({ ...TEST_USER, email: 'other@example.com', password: 'short' })
    expect(res.status).toBe(422)
  })

  it('rejects invalid email with 422', async () => {
    const res = await request(app)
      .post('/api/auth/sign-up')
      .send({ ...TEST_USER, email: 'not-an-email' })
    expect(res.status).toBe(422)
  })
})

describe('POST /api/auth/sign-in', () => {
  it('signs in with correct credentials and returns a token', async () => {
    const res = await request(app).post('/api/auth/sign-in').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    // Cookie should be set
    expect(res.headers['set-cookie']).toBeDefined()
  })

  it('rejects wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/sign-in').send({
      email: TEST_USER.email,
      password: 'WrongPassword!',
    })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid credentials')
  })

  it('rejects unknown email with 401', async () => {
    const res = await request(app).post('/api/auth/sign-in').send({
      email: 'nobody@example.com',
      password: TEST_USER.password,
    })
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/forgot-password', () => {
  it('rejects unknown email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' })
    expect(res.status).toBe(400)
  })

  it('sends reset email for known user (200)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: TEST_USER.email })
    // 200 even if SendGrid is not configured in test — controller should not throw
    expect([200, 201]).toContain(res.status)
  })
})

describe('POST /api/auth/reset-password', () => {
  it('rejects invalid token with 400', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'invalidtoken123',
      password: 'NewPassword123!',
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/invalid or expired/i)
  })
})
