/**
 * Hand log: logging hands played, validation and ownership.
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { startTestApp, stopTestApp, createUser } from './setup.js'

let app
let me
let other

const as = user => ({
  get: () => request(app).get('/api/hands').set('Cookie', user.cookie),
  post: body => request(app).post('/api/hands').set('Cookie', user.cookie).send(body),
  delete: id => request(app).delete(`/api/hands/${id}`).set('Cookie', user.cookie),
})

beforeAll(async () => {
  app = await startTestApp()
  me = await createUser()
  other = await createUser()
})

afterAll(stopTestApp)

describe('hand log', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/hands')).status).toBe(401)
    expect((await request(app).post('/api/hands').send({ hands: 100 })).status).toBe(401)
  })

  it('logs hands, defaulting the date to now', async () => {
    const before = Date.now()
    const res = await as(me).post({ hands: '2500', note: '  Sunday grind  ' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ hands: 2500, note: 'Sunday grind' })
    expect(new Date(res.body.date).getTime()).toBeGreaterThanOrEqual(before - 1000)
  })

  it('lists entries oldest first', async () => {
    await as(me).post({ hands: 1000, date: '2025-01-01T12:00:00.000Z' })
    await as(me).post({ hands: 3000, date: '2025-06-01T12:00:00.000Z' })
    const res = await as(me).get()
    expect(res.status).toBe(200)
    expect(res.body.map(l => l.hands)).toEqual([1000, 3000, 2500])
  })

  it('rejects invalid hand counts, dates and notes', async () => {
    for (const hands of [0, -5, 1.5, 'abc', null, true, 10000001]) {
      expect((await as(me).post({ hands })).status).toBe(422)
    }
    expect((await as(me).post({ hands: 10, date: 'not-a-date' })).status).toBe(422)
    expect((await as(me).post({ hands: 10, note: 'x'.repeat(201) })).status).toBe(422)
  })

  it('deletes only your own entries', async () => {
    const created = await as(me).post({ hands: 50 })
    expect((await as(other).delete(created.body._id)).status).toBe(404)
    expect((await as(other).get()).body).toEqual([])

    expect((await as(me).delete(created.body._id)).status).toBe(200)
    expect((await as(me).delete(created.body._id)).status).toBe(404)
    expect((await as(me).delete('not-an-id')).status).toBe(404)
  })
})
