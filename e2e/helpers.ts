import { type APIRequestContext, test as base, expect, type Page } from '@playwright/test'

export { expect }

/**
 * `test` that fails on any error in the browser console or an uncaught page
 * error (React warnings included). Failed HTTP responses are expected in some
 * tests (a wrong password is a 401), so "Failed to load resource" is ignored.
 */
/** A made-up client address for one test (TEST-NET-2, never routed). */
function testIp() {
  const byte = () => Math.floor(Math.random() * 254) + 1
  return `198.51.${byte()}.${byte()}`
}

export const test = base.extend<{ clientIp: string; consoleErrors: void }>({
  // Every API request of the test comes "from" its own address, so the
  // backend's per-IP sign-up limit (10 an hour) applies per test. Only /api:
  // third parties (Google Fonts) would refuse the extra header on CORS.
  clientIp: [
    async ({ context }, use) => {
      const ip = testIp()
      await context.route('**/api/**', (route) =>
        route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': ip } }),
      )
      await use(ip)
    },
    { auto: true },
  ],
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
          errors.push(message.text())
        }
      })
      page.on('pageerror', (error) => errors.push(error.message))
      await use()
      expect(errors, 'errors in the browser console').toEqual([])
    },
    { auto: true },
  ],
})

export const PASSWORD = 'password123'

export interface Account {
  email: string
  name: string
  token: string
  workspaceId: string
}

let counter = 0

/** A fresh email, unique across parallel workers and runs. */
export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${process.pid}-${++counter}@e2e.test`
}

/**
 * Signs up through the API. page.request shares the browser context's
 * cookies, so the page is signed in afterwards (refresh cookie).
 */
export async function signUp(
  page: Page,
  clientIp: string,
  name = 'E2E User',
  workspaceName?: string,
): Promise<Account> {
  const email = uniqueEmail('user')
  // page.request does not go through context.route: send the address here.
  const res = await page.request.post('/api/auth/register', {
    headers: { 'x-forwarded-for': clientIp },
    data: { email, name, password: PASSWORD, ...(workspaceName && { workspaceName }) },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  const { accessToken } = await res.json()
  const me = await (await page.request.get('/api/auth/me', { headers: { authorization: `Bearer ${accessToken}` } })).json()
  return { email, name, token: accessToken, workspaceId: me.workspaces[0].workspaceId }
}

/** Authorized API calls as `account`, for setting up data quickly. */
export function api(request: APIRequestContext, account: Account) {
  const headers = { authorization: `Bearer ${account.token}`, 'x-workspace-id': account.workspaceId }
  return {
    async createWorkflow(name: string, graph: unknown): Promise<string> {
      const res = await request.post('/api/workflows', { headers, data: { name, graph } })
      expect(res.ok(), await res.text()).toBeTruthy()
      return (await res.json()).id
    },
    async getWorkflow(id: string) {
      return (await request.get(`/api/workflows/${id}`, { headers })).json()
    },
  }
}

export const node = (id: string, name: string, type: string, position: [number, number], parameters = {}) => ({
  id,
  name,
  type,
  typeVersion: 1,
  position,
  parameters,
})

export const link = (from: string, to: string) => ({
  from: { nodeId: from, index: 0 },
  to: { nodeId: to, index: 0 },
})

/** The editor's save status shows "Saved" once autosave has caught up. */
export async function waitForSaved(page: Page) {
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible({ timeout: 10_000 })
}
