/**
 * Cross-user isolation: user B must never read or modify user A's data.
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import mongoose from 'mongoose'
import { startTestApp, stopTestApp, createUser, createAdmin, mailer } from './setup.js'

let app
let alice
let bob
let admin
const ids = {}

const db = () => mongoose.connection.db
const as = user => ({
  get: url => request(app).get(url).set('Cookie', user.cookie),
  post: (url, body) => request(app).post(url).set('Cookie', user.cookie).send(body),
  put: (url, body) => request(app).put(url).set('Cookie', user.cookie).send(body),
  delete: url => request(app).delete(url).set('Cookie', user.cookie),
})

beforeAll(async () => {
  app = await startTestApp()
  alice = await createUser({ fName: 'Alice' })
  bob = await createUser({ fName: 'Bob' })
  admin = await createAdmin()

  const session = await as(alice).post('/api/session', {
    venue: 'Online',
    type: 'Cash',
    game: 'NL',
    name: 'NL10',
    buyin: 10,
    cashout: 15,
    start: new Date().toISOString(),
  })
  ids.session = session.body._id

  const txn = await as(alice).post('/api/transaction', { type: 'Purchase', amount: 100 })
  ids.transaction = txn.body._id

  const note = await as(alice).post('/api/player-notes', { name: 'Villain', notes: 'Overbluffs river' })
  ids.note = note.body._id

  const ticket = await as(alice).post('/api/support', { category: 'Bug', message: 'Chart is broken' })
  ids.ticket = ticket.body._id
})

afterAll(stopTestApp)

describe('sessions', () => {
  it("B cannot read, edit or delete A's session", async () => {
    expect((await as(bob).get(`/api/session/${ids.session}`)).status).toBe(404)
    expect((await as(bob).put('/api/session', { id: ids.session, cashout: 0 })).status).toBe(404)
    expect((await as(bob).delete(`/api/session/${ids.session}`)).status).toBe(404)
    expect((await as(bob).get('/api/session')).body).toEqual([])

    const res = await as(alice).get(`/api/session/${ids.session}`)
    expect(res.status).toBe(200)
    expect(res.body.cashout).toBe(15)
  })

  it("A's ledger is intact after B's attempts", async () => {
    expect(await db().collection('transactions').countDocuments({ sessionId: new mongoose.Types.ObjectId(ids.session) })).toBe(2)
  })
})

describe('transactions', () => {
  it("B cannot see, edit or delete A's transactions", async () => {
    expect((await as(bob).get('/api/transaction')).body).toEqual([])
    expect((await as(bob).put(`/api/transaction/${ids.transaction}`, { amount: 1 })).status).toBe(404)
    expect((await as(bob).delete(`/api/transaction/${ids.transaction}`)).status).toBe(404)

    const list = await as(alice).get('/api/transaction')
    expect(list.body.find(t => t._id === ids.transaction).amount).toBe(100)
  })
})

describe('player notes', () => {
  it("B cannot see, edit or delete A's notes", async () => {
    expect((await as(bob).get('/api/player-notes')).body).toEqual([])
    expect((await as(bob).put(`/api/player-notes/${ids.note}`, { name: 'Hacked' })).status).toBe(404)
    expect((await as(bob).delete(`/api/player-notes/${ids.note}`)).status).toBe(404)

    const list = await as(alice).get('/api/player-notes')
    expect(list.body).toHaveLength(1)
    expect(list.body[0].name).toBe('Villain')
  })

  it('A can update and delete their own note', async () => {
    const updated = await as(alice).put(`/api/player-notes/${ids.note}`, { name: '  Villain 2  ', notes: 'Updated' })
    expect(updated.status).toBe(200)
    expect(updated.body).toMatchObject({ name: 'Villain 2', notes: 'Updated' })

    const keepNotes = await as(alice).put(`/api/player-notes/${ids.note}`, { name: 'Villain 3' })
    expect(keepNotes.body.notes).toBe('Updated')

    const extra = await as(alice).post('/api/player-notes', { name: 'Temp' })
    expect(extra.status).toBe(201)
    expect(extra.body.notes).toBe('')
    expect((await as(alice).delete(`/api/player-notes/${extra.body._id}`)).status).toBe(200)
  })

  it('validates note input', async () => {
    expect((await as(alice).post('/api/player-notes', {})).status).toBe(422)
    expect((await as(alice).post('/api/player-notes', { name: '   ' })).status).toBe(422)
    expect((await as(alice).post('/api/player-notes', { name: 'x'.repeat(101) })).status).toBe(422)
    expect((await as(alice).post('/api/player-notes', { name: 'ok', notes: 'x'.repeat(5001) })).status).toBe(422)
    expect((await as(alice).post('/api/player-notes', { name: { $ne: null } })).status).toBe(422)
    expect((await as(alice).put('/api/player-notes/nope', { name: 'x' })).status).toBe(404)
  })
})

describe('support tickets', () => {
  it('server sets identity and status, ignoring client values', async () => {
    mailer.sendMessageSent.mockClear()
    mailer.sendMessageReceived.mockClear()

    const res = await as(alice).post('/api/support', {
      category: 'Feedback',
      message: 'Love it',
      userEmail: 'evil@example.com',
      userName: 'Evil',
      status: 'Completed',
      user: bob.user._id,
    })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      category: 'Feedback',
      message: 'Love it',
      status: 'Pending',
      userEmail: alice.email,
      userName: `Alice ${alice.user.lName}`,
      user: alice.user._id,
    })

    expect(mailer.sendMessageSent).toHaveBeenCalledTimes(1)
    expect(mailer.sendMessageSent.mock.calls[0][0].recipient).toBe(alice.email)
    expect(mailer.sendMessageReceived).toHaveBeenCalledTimes(1)
    expect(mailer.sendMessageReceived.mock.calls[0][0].recipient).toEqual(['admin-inbox@example.com'])
    expect(mailer.sendMessageReceived.mock.calls[0][0].reply).toBe(alice.email)
  })

  it('validates category and message', async () => {
    expect((await as(alice).post('/api/support', { category: 'Rant', message: 'x' })).status).toBe(422)
    expect((await as(alice).post('/api/support', { category: 'Bug', message: '' })).status).toBe(422)
    expect((await as(alice).post('/api/support', { category: 'Bug', message: 'x'.repeat(5001) })).status).toBe(422)
    expect((await as(alice).post('/api/support', { category: 'Bug', message: ['a'] })).status).toBe(422)
  })

  it("B cannot read, edit or delete A's ticket", async () => {
    expect((await as(bob).get(`/api/support/${ids.ticket}`)).status).toBe(404)
    expect((await as(bob).put('/api/support', { id: ids.ticket, status: 'Completed' })).status).toBe(403)
    expect((await as(bob).delete(`/api/support/${ids.ticket}`)).status).toBe(403)
    expect((await as(bob).get('/api/support')).body).toEqual([])
  })

  it('owners see their own tickets including legacy email-only ones', async () => {
    await db().collection('messages').insertOne({
      category: 'Other',
      message: 'Legacy ticket',
      status: 'Pending',
      userEmail: alice.email,
      userName: 'Alice',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    const list = await as(alice).get('/api/support')
    expect(list.status).toBe(200)
    expect(list.body.map(m => m.message)).toEqual(expect.arrayContaining(['Chart is broken', 'Love it', 'Legacy ticket']))
    expect((await as(alice).get(`/api/support/${ids.ticket}`)).status).toBe(200)
  })

  it('owners cannot edit or delete their own ticket (admin only)', async () => {
    expect((await as(alice).put('/api/support', { id: ids.ticket, status: 'Completed' })).status).toBe(403)
    expect((await as(alice).delete(`/api/support/${ids.ticket}`)).status).toBe(403)
  })

  it('admins can list, read, edit and delete any ticket', async () => {
    const list = await as(admin).get('/api/support')
    expect(list.body.length).toBeGreaterThanOrEqual(3)
    expect((await as(admin).get(`/api/support/${ids.ticket}`)).status).toBe(200)

    const edited = await as(admin).put('/api/support', { id: ids.ticket, status: 'Planned' })
    expect(edited.status).toBe(200)
    expect(edited.body).toMatchObject({ status: 'Planned', category: 'Bug', message: 'Chart is broken' })

    expect((await as(admin).put('/api/support', { id: ids.ticket, status: 'Bogus' })).status).toBe(422)
    const missing = new mongoose.Types.ObjectId().toString()
    expect((await as(admin).put('/api/support', { id: missing, status: 'Planned' })).status).toBe(404)

    expect((await as(admin).delete(`/api/support/${ids.ticket}`)).status).toBe(200)
    expect((await as(admin).get(`/api/support/${ids.ticket}`)).status).toBe(404)
    expect((await as(admin).delete(`/api/support/${ids.ticket}`)).status).toBe(404)
  })
})
