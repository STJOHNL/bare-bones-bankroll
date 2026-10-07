import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import request from 'supertest'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { startTestApp, stopTestApp, createUser, getCookie, mailer } from './setup.js'

const FORGOT_MESSAGE = 'If an account exists for that email, a reset link has been sent.'

let app
const users = () => mongoose.connection.db.collection('users')
const findUser = email => users().findOne({ email })

beforeAll(async () => {
  app = await startTestApp()
})

afterAll(stopTestApp)

beforeEach(() => {
  mailer.sendPasswordReset.mockReset()
  mailer.sendPasswordReset.mockImplementation(async () => null)
})

describe('sign-up / sign-in / me / sign-out', () => {
  const account = {
    fName: 'Auth',
    lName: 'Tester',
    email: 'Auth.Tester@Example.com',
    password: 'TestPass123!',
  }
  let cookie

  it('signs up, returns { user } and sets an httpOnly cookie (no token in body)', async () => {
    const res = await request(app).post('/api/auth/sign-up').send(account)
    expect(res.status).toBe(201)
    expect(Object.keys(res.body)).toEqual(['user'])
    expect(Object.keys(res.body.user).sort()).toEqual(['_id', 'email', 'fName', 'lName', 'role'])
    expect(res.body.user.role).toBe('User')
    expect(res.body.user.email).toBe('auth.tester@example.com')
    expect(JSON.stringify(res.body)).not.toMatch(/token|password/i)

    const setCookie = res.headers['set-cookie'].join(';')
    expect(setCookie).toMatch(/token=/)
    expect(setCookie).toMatch(/HttpOnly/i)
    expect(setCookie).toMatch(/SameSite=Strict/i)

    const stored = await findUser('auth.tester@example.com')
    expect(stored.password).not.toBe(account.password)
    expect(stored.password).toMatch(/^\$2[aby]\$/)
    expect(stored.tokenVersion).toBe(0)
  })

  it('rejects a duplicate email', async () => {
    const res = await request(app).post('/api/auth/sign-up').send(account)
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/already exists/i)
  })

  it('rejects a short password with 422 { message, errors }', async () => {
    const res = await request(app)
      .post('/api/auth/sign-up')
      .send({ ...account, email: 'other@example.com', password: 'short' })
    expect(res.status).toBe(422)
    expect(res.body.message).toMatch(/Password must be/)
    expect(Array.isArray(res.body.errors)).toBe(true)
    expect(JSON.stringify(res.body)).not.toContain('short"')
  })

  it('rejects an invalid email with 422', async () => {
    const res = await request(app)
      .post('/api/auth/sign-up')
      .send({ ...account, email: 'not-an-email' })
    expect(res.status).toBe(422)
    expect(res.body.message).toBe('Valid email is required')
  })

  it('rejects non-string fields with 422', async () => {
    const res = await request(app)
      .post('/api/auth/sign-up')
      .send({ ...account, email: 'x@example.com', fName: { $gt: '' } })
    expect(res.status).toBe(422)
  })

  it('signs in with correct credentials (email normalized)', async () => {
    const res = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'AUTH.TESTER@example.com', password: account.password })
    expect(res.status).toBe(200)
    expect(Object.keys(res.body)).toEqual(['user'])
    expect(res.body.user.email).toBe('auth.tester@example.com')
    cookie = getCookie(res)
    expect(cookie).toBeDefined()
  })

  it('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: account.email, password: 'WrongPassword!' })
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ message: 'Invalid credentials' })
  })

  it('rejects an unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'nobody@example.com', password: account.password })
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ message: 'Invalid credentials' })
  })

  it('rejects operator injection in sign-in', async () => {
    const res = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: { $ne: null }, password: { $ne: null } })
    expect(res.status).toBe(422)
  })

  it('GET /me returns the signed-in user', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ fName: 'Auth', lName: 'Tester', email: 'auth.tester@example.com', role: 'User' })
    expect(Object.keys(res.body.user).sort()).toEqual(['_id', 'email', 'fName', 'lName', 'role'])
  })

  it('GET /me without a cookie is 401', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('rejects legacy-shaped and forged tokens', async () => {
    const stored = await findUser('auth.tester@example.com')
    const legacy = jwt.sign({ user: { _id: stored._id.toString(), role: 'Admin' } }, 'test-secret')
    let res = await request(app).get('/api/auth/me').set('Cookie', `token=${legacy}`)
    expect(res.status).toBe(401)

    const forged = jwt.sign({ sub: stored._id.toString(), ver: 0 }, 'wrong-secret')
    res = await request(app).get('/api/auth/me').set('Cookie', `token=${forged}`)
    expect(res.status).toBe(401)

    const deletedUser = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), ver: 0 }, 'test-secret')
    res = await request(app).get('/api/auth/me').set('Cookie', `token=${deletedUser}`)
    expect(res.status).toBe(401)
  })

  it('sign-out returns 200 and clears the cookie', async () => {
    const res = await request(app).post('/api/auth/sign-out').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.message).toBeDefined()
    const setCookie = res.headers['set-cookie'].join(';')
    expect(setCookie).toMatch(/token=;/)
    expect(setCookie).toMatch(/Expires=Thu, 01 Jan 1970/)
    expect(setCookie).toMatch(/HttpOnly/i)
    expect(setCookie).toMatch(/SameSite=Strict/i)
  })

  it('sign-out without a cookie still returns 200', async () => {
    const res = await request(app).post('/api/auth/sign-out')
    expect(res.status).toBe(200)
  })
})

describe('change-password', () => {
  it('rejects a wrong current password', async () => {
    const { cookie } = await createUser()
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'nope-nope', newPassword: 'NewPassword123!' })
    expect(res.status).toBe(400)
  })

  it('requires auth', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .send({ currentPassword: 'TestPass123!', newPassword: 'NewPassword123!' })
    expect(res.status).toBe(401)
  })

  it('invalidates old cookies and re-issues one for the current user', async () => {
    const { cookie: oldCookie, email } = await createUser()
    // A second device signed in with the same account
    const other = await request(app).post('/api/auth/sign-in').send({ email, password: 'TestPass123!' })
    const otherCookie = getCookie(other)

    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Cookie', oldCookie)
      .send({ currentPassword: 'TestPass123!', newPassword: 'NewPassword123!' })
    expect(res.status).toBe(200)
    expect(res.body.message).toBeDefined()
    expect(res.body.token).toBeUndefined()
    const newCookie = getCookie(res)
    expect(newCookie).toBeDefined()

    expect((await request(app).get('/api/auth/me').set('Cookie', oldCookie)).status).toBe(401)
    expect((await request(app).get('/api/auth/me').set('Cookie', otherCookie)).status).toBe(401)
    expect((await request(app).get('/api/auth/me').set('Cookie', newCookie)).status).toBe(200)

    const oldLogin = await request(app).post('/api/auth/sign-in').send({ email, password: 'TestPass123!' })
    expect(oldLogin.status).toBe(401)
    const newLogin = await request(app).post('/api/auth/sign-in').send({ email, password: 'NewPassword123!' })
    expect(newLogin.status).toBe(200)

    const stored = await findUser(email)
    expect(stored.tokenVersion).toBe(1)
  })
})

describe('forgot-password / reset-password', () => {
  it('always responds 200 with the same message and does not leak existence', async () => {
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@example.com' })
    expect(unknown.status).toBe(200)
    expect(unknown.body).toEqual({ message: FORGOT_MESSAGE })
    expect(mailer.sendPasswordReset).not.toHaveBeenCalled()

    const { email } = await createUser()
    const known = await request(app).post('/api/auth/forgot-password').send({ email })
    expect(known.status).toBe(200)
    expect(known.body).toEqual({ message: FORGOT_MESSAGE })
    expect(mailer.sendPasswordReset).toHaveBeenCalledTimes(1)
  })

  it('stores only a hash of the token; the raw token is only in the email link', async () => {
    const { email } = await createUser()
    const res = await request(app).post('/api/auth/forgot-password').send({ email })
    expect(res.status).toBe(200)

    const { link, recipient } = mailer.sendPasswordReset.mock.calls[0][0]
    expect(recipient).toBe(email)
    const rawToken = link.split('/reset-password/')[1]
    expect(rawToken).toMatch(/^[a-f0-9]{64}$/)
    expect(JSON.stringify(res.body)).not.toContain(rawToken)

    const stored = await findUser(email)
    expect(stored.resetTokenHash).toBe(crypto.createHash('sha256').update(rawToken).digest('hex'))
    expect(stored.resetToken).toBeUndefined()
    expect(stored.resetExpires.getTime()).toBeGreaterThan(Date.now())
  })

  it('still responds 200 when the mailer fails', async () => {
    mailer.sendPasswordReset.mockImplementation(async () => {
      throw new Error('SendGrid down')
    })
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { email } = await createUser()
    const res = await request(app).post('/api/auth/forgot-password').send({ email })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: FORGOT_MESSAGE })
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('rejects operator injection in the token and does not reset', async () => {
    const { email, password } = await createUser()
    await request(app).post('/api/auth/forgot-password').send({ email })

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: { $ne: null }, password: 'Hijacked123!' })
    expect([400, 422]).toContain(res.status)

    const stored = await findUser(email)
    expect(stored.resetTokenHash).toBeDefined()
    expect((await request(app).post('/api/auth/sign-in').send({ email, password })).status).toBe(200)
    expect((await request(app).post('/api/auth/sign-in').send({ email, password: 'Hijacked123!' })).status).toBe(401)
  })

  it('rejects a short or unknown token', async () => {
    let res = await request(app).post('/api/auth/reset-password').send({ token: 'short', password: 'NewPassword123!' })
    expect(res.status).toBe(422)

    res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'a'.repeat(64), password: 'NewPassword123!' })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ message: 'Invalid or expired token' })
  })

  it('resets with a valid token, bumps tokenVersion and the token is single-use', async () => {
    const { email, cookie } = await createUser()
    await request(app).post('/api/auth/forgot-password').send({ email })
    const rawToken = mailer.sendPasswordReset.mock.calls[0][0].link.split('/reset-password/')[1]

    const res = await request(app).post('/api/auth/reset-password').send({ token: rawToken, password: 'ResetPass123!' })
    expect(res.status).toBe(200)

    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401)
    expect((await request(app).post('/api/auth/sign-in').send({ email, password: 'ResetPass123!' })).status).toBe(200)

    const stored = await findUser(email)
    expect(stored.resetTokenHash).toBeUndefined()
    expect(stored.resetExpires).toBeUndefined()
    expect(stored.tokenVersion).toBe(1)

    const reuse = await request(app).post('/api/auth/reset-password').send({ token: rawToken, password: 'Another123!' })
    expect(reuse.status).toBe(400)
  })

  it('rejects an expired token', async () => {
    const { email } = await createUser()
    await request(app).post('/api/auth/forgot-password').send({ email })
    const rawToken = mailer.sendPasswordReset.mock.calls[0][0].link.split('/reset-password/')[1]
    await users().updateOne({ email }, { $set: { resetExpires: new Date(Date.now() - 1000) } })

    const res = await request(app).post('/api/auth/reset-password').send({ token: rawToken, password: 'ResetPass123!' })
    expect(res.status).toBe(400)
  })
})
