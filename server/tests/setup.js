/**
 * Shared integration-test harness.
 *
 * Each test file gets its own in-memory MongoDB (mongodb-memory-server) and its
 * own copy of the real Express app from server.js, so the suites exercise the
 * real middleware stack. The mailer is replaced with jest mocks and the real
 * config/.env is never loaded.
 */
import { jest } from '@jest/globals'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import request from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const mailer = {
  sendPasswordReset: jest.fn(async () => null),
  sendMessageSent: jest.fn(async () => null),
  sendMessageReceived: jest.fn(async () => null),
}

let mongod
let app

export const startTestApp = async () => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret'
  process.env.CLIENT_URL = 'http://localhost:5173'
  process.env.ADMIN_EMAIL = 'admin-inbox@example.com'
  process.env.FROM_EMAIL = 'noreply@example.com'
  // Point dotenv at a file that doesn't exist so the real config/.env is never read
  process.env.BBB_ENV_PATH = path.join(__dirname, '__no_such_env_file__.env')
  delete process.env.ELECTRON
  delete process.env.TRUST_PROXY
  delete process.env.SENDGRID_API_KEY

  mongod = await MongoMemoryServer.create()
  process.env.MONGO_URL = mongod.getUri('bbb_test')

  jest.unstable_mockModule('../helpers/mailer.js', () => ({ default: mailer }))

  const server = await import('../server.js')
  await server.dbReady
  // Make sure unique indexes exist before tests rely on them
  await Promise.all(Object.values(mongoose.models).map(model => model.init()))

  app = server.app
  return app
}

export const stopTestApp = async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase()
  }
  await mongoose.disconnect()
  if (mongod) await mongod.stop()
}

// Remove every document (indexes are kept)
export const clearDatabase = async () => {
  const collections = await mongoose.connection.db.collections()
  await Promise.all(collections.map(c => c.deleteMany({})))
}

// Extract "token=..." from a response's Set-Cookie header
export const getCookie = res => {
  const header = res.headers['set-cookie'] || []
  const tokenCookie = header.find(c => c.startsWith('token='))
  return tokenCookie ? tokenCookie.split(';')[0] : undefined
}

let counter = 0

// Sign up a fresh user and return their cookie + safe user object
export const createUser = async (overrides = {}) => {
  counter += 1
  const data = {
    fName: 'Test',
    lName: `User${counter}`,
    email: `user${counter}_${Date.now()}@example.com`,
    password: 'TestPass123!',
    ...overrides,
  }
  const res = await request(app).post('/api/auth/sign-up').send(data)
  if (res.status !== 201) throw new Error(`sign-up failed: ${res.status} ${JSON.stringify(res.body)}`)
  return { cookie: getCookie(res), user: res.body.user, password: data.password, email: data.email }
}

export const createAdmin = async (overrides = {}) => {
  const admin = await createUser({ fName: 'Admin', ...overrides })
  await mongoose.connection.db
    .collection('users')
    .updateOne({ _id: new mongoose.Types.ObjectId(admin.user._id) }, { $set: { role: 'Admin' } })
  admin.user.role = 'Admin'
  return admin
}
