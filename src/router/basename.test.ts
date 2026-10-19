import { describe, expect, it, vi } from 'vitest'

async function load(base: string) {
  vi.resetModules()
  vi.stubEnv('BASE_URL', base)
  return import('./basename')
}

describe('basename', () => {
  it('leaves paths alone at the root', async () => {
    const { BASENAME, routePath } = await load('/')
    expect(BASENAME).toBe('')
    expect(routePath('/workflows/1')).toBe('/workflows/1')
  })

  it('strips the base the app is served under', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://me.github.io' } })
    const { BASENAME, routePath, routeUrl } = await load('/n8n-fe/')
    expect(BASENAME).toBe('/n8n-fe')
    expect(routePath('/n8n-fe/workflows/1')).toBe('/workflows/1')
    expect(routePath('/n8n-fe')).toBe('/')
    expect(routePath('/n8n-feed')).toBe('/n8n-feed')
    expect(routeUrl('/auth/invite/x')).toBe('https://me.github.io/n8n-fe/auth/invite/x')
  })
})
