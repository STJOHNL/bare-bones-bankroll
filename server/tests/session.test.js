import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import mongoose from 'mongoose'
import { startTestApp, stopTestApp, createUser } from './setup.js'

const START = '2026-03-01T18:00:00.000Z'
const END = '2026-03-01T21:00:00.000Z'

let app
let me

const db = () => mongoose.connection.db
const oid = id => new mongoose.Types.ObjectId(id)

const cashSession = (overrides = {}) => ({
  venue: 'Online',
  type: 'Cash',
  game: 'NL',
  name: 'NL10',
  buyin: 10,
  start: START,
  ...overrides,
})

const tournament = (overrides = {}) => ({
  venue: 'Live',
  type: 'Tournament',
  game: 'NL',
  name: 'Sunday MTT',
  buyin: 100,
  start: START,
  ...overrides,
})

const create = body => request(app).post('/api/session').set('Cookie', me.cookie).send(body)
const edit = body => request(app).put('/api/session').set('Cookie', me.cookie).send(body)
const ledger = sessionId =>
  db()
    .collection('transactions')
    .find({ sessionId: oid(sessionId) })
    .toArray()
const ledgerByType = async sessionId => Object.fromEntries((await ledger(sessionId)).map(t => [t.type, t]))

beforeAll(async () => {
  app = await startTestApp()
  me = await createUser()
})

afterAll(stopTestApp)

describe('auth & listing', () => {
  it('requires auth', async () => {
    expect((await request(app).get('/api/session')).status).toBe(401)
    expect((await request(app).post('/api/session').send(cashSession())).status).toBe(401)
  })

  it('lists own sessions sorted by start desc', async () => {
    const user = await createUser()
    const post = body => request(app).post('/api/session').set('Cookie', user.cookie).send(body)
    await post(cashSession({ start: '2026-01-01T00:00:00.000Z' }))
    await post(cashSession({ start: '2026-02-01T00:00:00.000Z' }))
    const res = await request(app).get('/api/session').set('Cookie', user.cookie)
    expect(res.status).toBe(200)
    expect(res.body.map(s => s.start)).toEqual(['2026-02-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'])
  })

  it('404s for malformed ids', async () => {
    expect((await request(app).get('/api/session/nope').set('Cookie', me.cookie)).status).toBe(404)
    expect((await request(app).delete('/api/session/nope').set('Cookie', me.cookie)).status).toBe(404)
  })
})

describe('POST /api/session', () => {
  it('creates a cash session, keeps the stake name and writes a Buy-in', async () => {
    const res = await create(cashSession())
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ name: 'NL10', buyin: 10, cashout: 0 })
    expect(res.body.user).toBe(me.user._id)

    const txns = await ledger(res.body._id)
    expect(txns).toHaveLength(1)
    expect(txns[0]).toMatchObject({ type: 'Buy-in', amount: 10, note: 'NL10' })
    expect(txns[0].user.toString()).toBe(me.user._id)
    expect(txns[0].date.toISOString()).toBe(START)
  })

  it('writes a Cash-out when cashout > 0 (dated at end)', async () => {
    const res = await create(cashSession({ cashout: 25.5, end: END }))
    expect(res.status).toBe(201)
    const byType = await ledgerByType(res.body._id)
    expect(byType['Buy-in'].amount).toBe(10)
    expect(byType['Cash-out'].amount).toBe(25.5)
    expect(byType['Cash-out'].date.toISOString()).toBe(END)
  })

  it('rounds money to cents', async () => {
    const res = await create(cashSession({ buyin: 10.123, cashout: 5.678 }))
    expect(res.status).toBe(201)
    expect(res.body.buyin).toBe(10.12)
    expect(res.body.cashout).toBe(5.68)
  })

  it('ignores client-sent user / _id', async () => {
    const otherId = new mongoose.Types.ObjectId().toString()
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await create(cashSession({ user: otherId, _id: fakeId }))
    expect(res.status).toBe(201)
    expect(res.body.user).toBe(me.user._id)
    expect(res.body._id).not.toBe(fakeId)
  })

  it('rejects end before start with 422', async () => {
    const res = await create(cashSession({ end: '2026-03-01T17:00:00.000Z' }))
    expect(res.status).toBe(422)
    expect(res.body).toEqual({ message: 'End time must be after start time' })
  })

  it('requires a tournament name', async () => {
    const missing = await create(tournament({ name: '' }))
    expect(missing.status).toBe(422)
    expect(missing.body.message).toBe('Tournament name is required')

    const res = await create(tournament())
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Sunday MTT')
  })

  it('rejects invalid enums and negative buy-ins with 422', async () => {
    expect((await create(cashSession({ venue: 'Moon' }))).status).toBe(422)
    expect((await create(cashSession({ buyin: -50 }))).status).toBe(422)
    expect((await create(cashSession({ buyin: { $gt: 0 } }))).status).toBe(422)
  })
})

describe('PUT /api/session (partial update)', () => {
  let session

  beforeAll(async () => {
    const res = await create(cashSession({ notes: 'table 4' }))
    session = res.body
  })

  it('updates only cashout and keeps everything else, syncing the ledger', async () => {
    const res = await edit({ id: session._id, cashout: 30 })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      venue: 'Online',
      type: 'Cash',
      game: 'NL',
      name: 'NL10',
      buyin: 10,
      cashout: 30,
      notes: 'table 4',
      start: START,
    })
    const byType = await ledgerByType(session._id)
    expect(byType['Cash-out'].amount).toBe(30)
    expect(byType['Cash-out'].date.toISOString()).toBe(START)
  })

  it('updates end + cashout together and dates the Cash-out at end', async () => {
    const res = await edit({ id: session._id, end: END, cashout: 45 })
    expect(res.status).toBe(200)
    const byType = await ledgerByType(session._id)
    expect(byType['Cash-out'].amount).toBe(45)
    expect(byType['Cash-out'].date.toISOString()).toBe(END)
  })

  it('updates the Buy-in when buyin changes', async () => {
    const res = await edit({ id: session._id, buyin: 20 })
    expect(res.status).toBe(200)
    const byType = await ledgerByType(session._id)
    expect(byType['Buy-in'].amount).toBe(20)
  })

  it('removes the Cash-out when cashout goes back to 0', async () => {
    const res = await edit({ id: session._id, cashout: 0 })
    expect(res.status).toBe(200)
    const byType = await ledgerByType(session._id)
    expect(byType['Cash-out']).toBeUndefined()
    expect(byType['Buy-in']).toBeDefined()
    expect(await ledger(session._id)).toHaveLength(1)
  })

  it('clears optional fields with empty values', async () => {
    const res = await edit({ id: session._id, end: '' })
    expect(res.status).toBe(200)
    expect(res.body.end).toBeUndefined()
  })

  it('rejects end before start', async () => {
    const res = await edit({ id: session._id, end: '2026-03-01T10:00:00.000Z' })
    expect(res.status).toBe(422)
    expect(res.body.message).toBe('End time must be after start time')
  })

  it('renames the stake and updates the ledger note', async () => {
    const res = await edit({ id: session._id, name: 'NL25' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('NL25')
    const byType = await ledgerByType(session._id)
    expect(byType['Buy-in'].note).toBe('NL25')
  })

  it('ignores non-whitelisted fields', async () => {
    const otherUser = new mongoose.Types.ObjectId().toString()
    const res = await edit({ id: session._id, user: otherUser, createdAt: '2000-01-01T00:00:00.000Z' })
    expect(res.status).toBe(200)
    expect(res.body.user).toBe(me.user._id)
    expect(res.body.createdAt).not.toBe('2000-01-01T00:00:00.000Z')
  })

  it('validates the id', async () => {
    expect((await edit({ id: 'nope', cashout: 1 })).status).toBe(422)
    expect((await edit({ cashout: 1 })).status).toBe(422)
    expect((await edit({ id: new mongoose.Types.ObjectId().toString(), cashout: 1 })).status).toBe(404)
  })

  it('switching to a tournament keeps the given name', async () => {
    const res = await edit({ id: session._id, type: 'Tournament', name: 'Bounty Builder' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Bounty Builder')
  })
})

describe('POST /api/session/import', () => {
  it('imports valid rows, skips invalid ones and ignores client _id/user', async () => {
    const clientId = new mongoose.Types.ObjectId().toString()
    const otherUser = new mongoose.Types.ObjectId().toString()
    const res = await request(app)
      .post('/api/session/import')
      .set('Cookie', me.cookie)
      .send([
        cashSession({ _id: clientId, user: otherUser, cashout: 15, end: END }),
        cashSession({ start: undefined }),
        tournament({ name: 'Imported MTT', buyin: '55', cashout: '' }),
        'not an object',
        tournament({ name: '' }),
      ])
    expect(res.status).toBe(201)
    expect(res.body.imported).toBe(2)
    expect(res.body.skipped).toEqual([
      { row: 2, reason: 'Start time is required' },
      { row: 4, reason: 'Invalid row' },
      { row: 5, reason: 'Tournament name is required' },
    ])

    expect(await db().collection('sessions').countDocuments({ _id: oid(clientId) })).toBe(0)
    expect(await db().collection('sessions').countDocuments({ user: oid(otherUser) })).toBe(0)

    const imported = await db()
      .collection('sessions')
      .find({ user: oid(me.user._id), name: { $in: ['Imported MTT'] } })
      .toArray()
    expect(imported).toHaveLength(1)
    expect(imported[0].buyin).toBe(55)
    const byType = await ledgerByType(imported[0]._id.toString())
    expect(byType['Buy-in'].amount).toBe(55)
    expect(byType['Cash-out']).toBeUndefined()
  })

  it('creates ledger rows for imported cash sessions', async () => {
    const res = await request(app)
      .post('/api/session/import')
      .set('Cookie', me.cookie)
      .send([cashSession({ buyin: 7, cashout: 9, end: END, start: '2025-12-31T00:00:00.000Z' })])
    expect(res.status).toBe(201)
    const s = await db()
      .collection('sessions')
      .findOne({ user: oid(me.user._id), buyin: 7 })
    const byType = await ledgerByType(s._id.toString())
    expect(byType['Buy-in'].amount).toBe(7)
    expect(byType['Cash-out'].amount).toBe(9)
  })

  it('rejects empty, non-array and oversized payloads', async () => {
    const post = body => request(app).post('/api/session/import').set('Cookie', me.cookie).send(body)
    expect((await post([])).status).toBe(422)
    expect((await post({ venue: 'Online' })).status).toBe(422)
    expect((await post(Array.from({ length: 2001 }, () => ({})))).status).toBe(422)
  })
})

describe('DELETE /api/session/:id', () => {
  it('deletes the session and its transactions', async () => {
    const created = await create(cashSession({ cashout: 12 }))
    expect(await ledger(created.body._id)).toHaveLength(2)

    const res = await request(app).delete(`/api/session/${created.body._id}`).set('Cookie', me.cookie)
    expect(res.status).toBe(200)
    expect(await ledger(created.body._id)).toHaveLength(0)
    expect((await request(app).get(`/api/session/${created.body._id}`).set('Cookie', me.cookie)).status).toBe(404)
  })
})
