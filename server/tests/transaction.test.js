import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import mongoose from 'mongoose'
import { startTestApp, stopTestApp, createUser } from './setup.js'

let app
let me

const post = body => request(app).post('/api/transaction').set('Cookie', me.cookie).send(body)
const put = (id, body) => request(app).put(`/api/transaction/${id}`).set('Cookie', me.cookie).send(body)
const del = id => request(app).delete(`/api/transaction/${id}`).set('Cookie', me.cookie)

beforeAll(async () => {
  app = await startTestApp()
  me = await createUser()
})

afterAll(stopTestApp)

describe('POST /api/transaction', () => {
  it('requires auth', async () => {
    expect((await request(app).post('/api/transaction').send({ type: 'Purchase', amount: 1 })).status).toBe(401)
  })

  it.each(['Buy-in', 'Cash-out'])('rejects session-owned type %s with 422', async type => {
    const res = await post({ type, amount: 10 })
    expect(res.status).toBe(422)
    expect(res.body.message).toBe('Session transactions are managed by sessions')
    expect(Array.isArray(res.body.errors)).toBe(true)
  })

  it('rejects legacy / unknown types', async () => {
    expect((await post({ type: 'Deposit', amount: 10 })).status).toBe(422)
    expect((await post({ type: { $ne: null }, amount: 10 })).status).toBe(422)
  })

  it('Purchase defaults cost to amount', async () => {
    const res = await post({ type: 'Purchase', amount: 100 })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ type: 'Purchase', amount: 100, cost: 100 })
    expect(res.body.status).toBeUndefined()
    expect(res.body.user).toBe(me.user._id)
  })

  it('Purchase keeps an explicit cost (including 0) and rounds to cents', async () => {
    let res = await post({ type: 'Purchase', amount: 105.556, cost: '19.999' })
    expect(res.status).toBe(201)
    expect(res.body.amount).toBe(105.56)
    expect(res.body.cost).toBe(20)

    res = await post({ type: 'Purchase', amount: 10, cost: 0 })
    expect(res.status).toBe(201)
    expect(res.body.cost).toBe(0)
  })

  it('Redemption defaults to Pending and strips cost', async () => {
    const res = await post({ type: 'Redemption', amount: 50, cost: 5 })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ type: 'Redemption', amount: 50, status: 'Pending' })
    expect(res.body.cost).toBeUndefined()
  })

  it('Redemption accepts an explicit status', async () => {
    const res = await post({ type: 'Redemption', amount: 50, status: 'Completed' })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('Completed')
  })

  it('Promo strips cost and status', async () => {
    const res = await post({ type: 'Promo', amount: 5, cost: 1, status: 'Completed', note: 'Daily bonus' })
    expect(res.status).toBe(201)
    expect(res.body.cost).toBeUndefined()
    expect(res.body.status).toBeUndefined()
    expect(res.body.note).toBe('Daily bonus')
  })

  it('never accepts sessionId from the client', async () => {
    const res = await post({ type: 'Promo', amount: 5, sessionId: new mongoose.Types.ObjectId().toString() })
    expect(res.status).toBe(201)
    expect(res.body.sessionId).toBeUndefined()
  })

  it('accepts an ISO date', async () => {
    const res = await post({ type: 'Purchase', amount: 5, date: '2026-01-02T03:04:05.000Z' })
    expect(res.status).toBe(201)
    expect(res.body.date).toBe('2026-01-02T03:04:05.000Z')
  })

  it.each([
    [{ type: 'Purchase', amount: 0 }],
    [{ type: 'Purchase', amount: -1 }],
    [{ type: 'Purchase', amount: 'abc' }],
    [{ type: 'Purchase', amount: 10000001 }],
    [{ type: 'Purchase' }],
    [{ type: 'Purchase', amount: 10, cost: -1 }],
    [{ type: 'Redemption', amount: 10, status: 'Lost' }],
    [{ type: 'Purchase', amount: 10, note: 'x'.repeat(501) }],
    [{ type: 'Purchase', amount: 10, note: { $gt: '' } }],
    [{ type: 'Purchase', amount: 10, date: 'yesterday' }],
  ])('rejects %j with 422', async body => {
    const res = await post(body)
    expect(res.status).toBe(422)
    expect(typeof res.body.message).toBe('string')
  })
})

describe('PUT /api/transaction/:id', () => {
  it('updates a Redemption status to Completed', async () => {
    const created = await post({ type: 'Redemption', amount: 75 })
    const res = await put(created.body._id, { status: 'Completed' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'Completed', amount: 75 })
  })

  it('updates Purchase amount / cost / note / date', async () => {
    const created = await post({ type: 'Purchase', amount: 100 })
    const res = await put(created.body._id, {
      amount: 200,
      cost: 150,
      note: 'Bundle',
      date: '2026-02-02T00:00:00.000Z',
    })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ amount: 200, cost: 150, note: 'Bundle', date: '2026-02-02T00:00:00.000Z' })
  })

  it('validates fields', async () => {
    const created = await post({ type: 'Purchase', amount: 100 })
    expect((await put(created.body._id, { amount: 0 })).status).toBe(422)
    expect((await put(created.body._id, { status: 'Nope' })).status).toBe(422)
  })

  it('refuses to edit session-owned transactions', async () => {
    const session = await request(app).post('/api/session').set('Cookie', me.cookie).send({
      venue: 'Online',
      type: 'Tournament',
      game: 'NL',
      name: 'MTT',
      buyin: 10,
      cashout: 20,
      start: new Date().toISOString(),
    })
    const list = await request(app).get('/api/transaction').set('Cookie', me.cookie)
    const owned = list.body.filter(t => t.sessionId === session.body._id)
    expect(owned).toHaveLength(2)

    for (const txn of owned) {
      const edit = await put(txn._id, { amount: 1 })
      expect(edit.status).toBe(400)
      expect(edit.body).toEqual({ message: 'Edit the session instead' })

      const remove = await del(txn._id)
      expect(remove.status).toBe(400)
      expect(remove.body).toEqual({ message: 'Delete the session instead' })
    }
  })

  it('404s for unknown / malformed ids', async () => {
    expect((await put(new mongoose.Types.ObjectId().toString(), { amount: 1 })).status).toBe(404)
    expect((await put('nope', { amount: 1 })).status).toBe(404)
  })
})

describe('DELETE /api/transaction/:id and listing', () => {
  it('deletes a manual transaction', async () => {
    const created = await post({ type: 'Promo', amount: 3 })
    const res = await del(created.body._id)
    expect(res.status).toBe(200)
    expect(res.body._id).toBe(created.body._id)
    expect((await del(created.body._id)).status).toBe(404)
  })

  it('lists own transactions sorted by date desc', async () => {
    const res = await request(app).get('/api/transaction').set('Cookie', me.cookie)
    expect(res.status).toBe(200)
    const dates = res.body.map(t => new Date(t.date).getTime())
    expect([...dates].sort((a, b) => b - a)).toEqual(dates)
    expect(res.body.every(t => t.user === me.user._id)).toBe(true)
  })
})
