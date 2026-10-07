import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { startTestApp, stopTestApp } from './setup.js'

let app

beforeAll(async () => {
  app = await startTestApp()
})

afterAll(stopTestApp)

describe('app', () => {
  it('GET /api responds', async () => {
    const res = await request(app).get('/api')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'Bare Bones Bankroll API' })
  })

  it('unknown /api routes return a JSON 404', async () => {
    for (const req of [
      request(app).get('/api/does-not-exist'),
      request(app).post('/api/nope/deeper'),
      request(app).delete('/api/auth/sign-in'),
    ]) {
      const res = await req
      expect(res.status).toBe(404)
      expect(res.headers['content-type']).toMatch(/json/)
      expect(res.body).toEqual({ message: 'Not found' })
    }
  })

  it('sets security headers on every response', async () => {
    for (const path of ['/api', '/api/does-not-exist', '/api/auth/me']) {
      const res = await request(app).get(path)
      expect(res.headers['x-content-type-options']).toBe('nosniff')
      expect(res.headers['referrer-policy']).toBe('same-origin')
      expect(res.headers['x-frame-options']).toBe('DENY')
      expect(res.headers['content-security-policy']).toContain("default-src 'self'")
      expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'")
      expect(res.headers['content-security-policy']).toContain(
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
      )
      expect(res.headers['content-security-policy']).toContain("font-src 'self' data: https://fonts.gstatic.com;")
      expect(res.headers['x-powered-by']).toBeUndefined()
    }
  })

  it('applies the strict auth limiter to credential routes only (not /me or sign-out)', async () => {
    const { default: authRouter } = await import('../routes/auth.js')
    const { authLimiter } = await import('../middleware/rateLimit.js')
    const limited = {}
    for (const layer of authRouter.stack) {
      if (!layer.route) continue
      const method = Object.keys(layer.route.methods)[0].toUpperCase()
      limited[`${method} ${layer.route.path}`] = layer.route.stack.some(l => l.handle === authLimiter)
    }
    expect(limited).toEqual({
      'POST /sign-in': true,
      'POST /sign-up': true,
      'POST /sign-out': false,
      'GET /me': false,
      'POST /forgot-password': true,
      'POST /reset-password': true,
      'PUT /change-password': false,
    })
  })

  it('handles malformed JSON without leaking a stack', async () => {
    const res = await request(app)
      .post('/api/auth/sign-in')
      .set('Content-Type', 'application/json')
      .send('{"email": ')
    expect(res.status).toBe(400)
    expect(res.body.stack).toBeUndefined()
  })

  it('rejects bodies over 2mb', async () => {
    const res = await request(app)
      .post('/api/auth/sign-in')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@example.com', password: 'x'.repeat(2.5 * 1024 * 1024) }))
    expect(res.status).toBe(413)
  })
})
