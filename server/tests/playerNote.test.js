/**
 * Player notes: categories (colour coding) and pinning.
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { startTestApp, stopTestApp, createUser } from './setup.js'

let app
let me

const post = body => request(app).post('/api/player-notes').set('Cookie', me.cookie).send(body)
const put = (id, body) => request(app).put(`/api/player-notes/${id}`).set('Cookie', me.cookie).send(body)
const list = () => request(app).get('/api/player-notes').set('Cookie', me.cookie)

beforeAll(async () => {
  app = await startTestApp()
  me = await createUser()
})

afterAll(stopTestApp)

describe('player note categories and pinning', () => {
  it('defaults to an unknown, unpinned player', async () => {
    const res = await post({ name: 'NewGuy' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ name: 'NewGuy', notes: '', category: 'unknown', pinned: false })
  })

  it('saves a category and pinned flag on create', async () => {
    const res = await post({ name: 'FishyFred', notes: 'Limps everything', category: 'rec', pinned: true })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ category: 'rec', pinned: true })
  })

  it('updates only the fields sent', async () => {
    const created = await post({ name: 'Grinder', notes: '3-bets light', category: 'reg' })

    const pinned = await put(created.body._id, { pinned: true })
    expect(pinned.status).toBe(200)
    expect(pinned.body).toMatchObject({ name: 'Grinder', notes: '3-bets light', category: 'reg', pinned: true })

    const recategorized = await put(created.body._id, { category: 'nit' })
    expect(recategorized.body).toMatchObject({ name: 'Grinder', category: 'nit', pinned: true })
  })

  it('lists pinned players first', async () => {
    const res = await list()
    expect(res.status).toBe(200)
    const pinnedFlags = res.body.map(n => n.pinned)
    const firstUnpinned = pinnedFlags.indexOf(false)
    expect(firstUnpinned).toBeGreaterThan(0)
    expect(pinnedFlags.slice(firstUnpinned).every(p => p === false)).toBe(true)
  })

  it('rejects unknown categories and non-boolean pins', async () => {
    const created = await post({ name: 'Validate' })
    expect((await post({ name: 'Bad', category: 'shark' })).status).toBe(422)
    expect((await put(created.body._id, { category: 'shark' })).status).toBe(422)
    expect((await put(created.body._id, { pinned: 'yes' })).status).toBe(422)
    expect((await put(created.body._id, { name: '   ' })).status).toBe(422)
  })
})
