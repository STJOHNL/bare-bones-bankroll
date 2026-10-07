import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import mongoose from 'mongoose'
import { startTestApp, stopTestApp, createUser, createAdmin } from './setup.js'

const SAFE_KEYS = ['_id', 'createdAt', 'email', 'fName', 'lName', 'role']

let app
let alice
let bob
let admin

const db = () => mongoose.connection.db
const oid = id => new mongoose.Types.ObjectId(id)

beforeAll(async () => {
  app = await startTestApp()
  alice = await createUser({ fName: 'Alice' })
  bob = await createUser({ fName: 'Bob' })
  admin = await createAdmin()
  // Give Alice sensitive fields that must never be returned
  await db()
    .collection('users')
    .updateOne(
      { _id: oid(alice.user._id) },
      { $set: { resetTokenHash: 'deadbeef', resetExpires: new Date(Date.now() + 60000), phone: '555-0100' } }
    )
})

afterAll(stopTestApp)

describe('GET /api/user', () => {
  it('is admin only', async () => {
    const res = await request(app).get('/api/user').set('Cookie', alice.cookie)
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ message: 'Admin access required' })
  })

  it('requires auth', async () => {
    expect((await request(app).get('/api/user')).status).toBe(401)
  })

  it('returns safe fields only, sorted by first name', async () => {
    const res = await request(app).get('/api/user').set('Cookie', admin.cookie)
    expect(res.status).toBe(200)
    expect(res.body.map(u => u.fName)).toEqual(['Admin', 'Alice', 'Bob'])
    for (const u of res.body) expect(Object.keys(u).sort()).toEqual(SAFE_KEYS)
  })
})

describe('GET /api/user/:id', () => {
  it('lets a user read themselves without sensitive fields', async () => {
    const res = await request(app).get(`/api/user/${alice.user._id}`).set('Cookie', alice.cookie)
    expect(res.status).toBe(200)
    expect(Object.keys(res.body).sort()).toEqual(SAFE_KEYS)
    expect(JSON.stringify(res.body)).not.toMatch(/password|resetTokenHash|resetExpires|tokenVersion|phone|deadbeef/)
  })

  it('forbids reading someone else', async () => {
    const res = await request(app).get(`/api/user/${bob.user._id}`).set('Cookie', alice.cookie)
    expect(res.status).toBe(403)
  })

  it('lets an admin read anyone', async () => {
    const res = await request(app).get(`/api/user/${alice.user._id}`).set('Cookie', admin.cookie)
    expect(res.status).toBe(200)
    expect(Object.keys(res.body).sort()).toEqual(SAFE_KEYS)
  })

  it('404s for unknown or malformed ids', async () => {
    const missing = new mongoose.Types.ObjectId().toString()
    expect((await request(app).get(`/api/user/${missing}`).set('Cookie', admin.cookie)).status).toBe(404)
    expect((await request(app).get('/api/user/not-an-id').set('Cookie', admin.cookie)).status).toBe(404)
  })
})

describe('PUT /api/user', () => {
  const edit = (who, body) => request(app).put('/api/user').set('Cookie', who.cookie).send(body)

  it('lets a user edit themselves', async () => {
    const res = await edit(alice, {
      id: alice.user._id,
      fName: 'Alicia',
      lName: 'Smith',
      email: alice.email,
    })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ fName: 'Alicia', lName: 'Smith', email: alice.email, role: 'User' })
    expect(Object.keys(res.body).sort()).toEqual(SAFE_KEYS)
  })

  it('normalizes the email the same way as sign-in', async () => {
    const res = await edit(alice, {
      id: alice.user._id,
      fName: 'Alicia',
      lName: 'Smith',
      email: alice.email.toUpperCase(),
    })
    expect(res.status).toBe(200)
    expect(res.body.email).toBe(alice.email)
    const signIn = await request(app).post('/api/auth/sign-in').send({ email: alice.email, password: alice.password })
    expect(signIn.status).toBe(200)
  })

  it('forbids a non-admin from changing their own role', async () => {
    const res = await edit(alice, {
      id: alice.user._id,
      fName: 'Alicia',
      lName: 'Smith',
      email: alice.email,
      role: 'Admin',
    })
    expect(res.status).toBe(403)
    const stored = await db().collection('users').findOne({ _id: oid(alice.user._id) })
    expect(stored.role).toBe('User')
  })

  it('allows a non-admin to send their unchanged role', async () => {
    const res = await edit(alice, {
      id: alice.user._id,
      fName: 'Alicia',
      lName: 'Smith',
      email: alice.email,
      role: 'User',
    })
    expect(res.status).toBe(200)
  })

  it('rejects an invalid role', async () => {
    const res = await edit(admin, {
      id: bob.user._id,
      fName: 'Bob',
      lName: 'B',
      email: bob.email,
      role: 'Superuser',
    })
    expect(res.status).toBe(422)
  })

  it('forbids editing someone else', async () => {
    const res = await edit(alice, { id: bob.user._id, fName: 'Hacked', lName: 'Hacked', email: bob.email })
    expect(res.status).toBe(403)
    const stored = await db().collection('users').findOne({ _id: oid(bob.user._id) })
    expect(stored.fName).toBe('Bob')
  })

  it('returns 409 when the email is taken', async () => {
    const res = await edit(alice, { id: alice.user._id, fName: 'Alicia', lName: 'Smith', email: bob.email })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ message: 'Email already in use' })
  })

  it('lets an admin edit others and change roles', async () => {
    const res = await edit(admin, {
      id: bob.user._id,
      fName: 'Robert',
      lName: 'B',
      email: bob.email,
      role: 'Admin',
    })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ fName: 'Robert', role: 'Admin' })

    // Role change takes effect immediately on the next request
    expect((await request(app).get('/api/user').set('Cookie', bob.cookie)).status).toBe(200)
  })

  it('404s for an unknown user (admin)', async () => {
    const res = await edit(admin, {
      id: new mongoose.Types.ObjectId().toString(),
      fName: 'X',
      lName: 'Y',
      email: 'xy@example.com',
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/user/:id', () => {
  it('is admin only', async () => {
    const res = await request(app).delete(`/api/user/${admin.user._id}`).set('Cookie', alice.cookie)
    expect(res.status).toBe(403)
  })

  it('stops an admin deleting themselves', async () => {
    const res = await request(app).delete(`/api/user/${admin.user._id}`).set('Cookie', admin.cookie)
    expect(res.status).toBe(400)
  })

  it('deletes the user and all of their data', async () => {
    const victim = await createUser({ fName: 'Victim' })
    const session = await request(app).post('/api/session').set('Cookie', victim.cookie).send({
      venue: 'Online',
      type: 'Tournament',
      game: 'NL',
      name: 'MTT',
      buyin: 10,
      cashout: 20,
      start: new Date().toISOString(),
    })
    expect(session.status).toBe(201)
    await request(app).post('/api/transaction').set('Cookie', victim.cookie).send({ type: 'Purchase', amount: 50 })
    await request(app).post('/api/player-notes').set('Cookie', victim.cookie).send({ name: 'Villain' })

    const victimId = oid(victim.user._id)
    expect(await db().collection('transactions').countDocuments({ user: victimId })).toBe(3)

    const res = await request(app).delete(`/api/user/${victim.user._id}`).set('Cookie', admin.cookie)
    expect(res.status).toBe(200)
    expect(JSON.stringify(res.body)).not.toMatch(/password/)

    expect(await db().collection('users').countDocuments({ _id: victimId })).toBe(0)
    expect(await db().collection('sessions').countDocuments({ user: victimId })).toBe(0)
    expect(await db().collection('transactions').countDocuments({ user: victimId })).toBe(0)
    expect(await db().collection('playernotes').countDocuments({ user: victimId })).toBe(0)

    // Their cookie no longer works
    expect((await request(app).get('/api/auth/me').set('Cookie', victim.cookie)).status).toBe(401)
    // Second delete is a 404
    expect((await request(app).delete(`/api/user/${victim.user._id}`).set('Cookie', admin.cookie)).status).toBe(404)
  })
})

describe('removed endpoints', () => {
  it('POST /api/user no longer exists', async () => {
    const res = await request(app)
      .post('/api/user')
      .set('Cookie', admin.cookie)
      .send({ email: 'new@example.com', fName: 'N', lName: 'U' })
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ message: 'Not found' })
  })
})
