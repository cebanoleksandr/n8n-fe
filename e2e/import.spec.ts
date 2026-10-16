import type { Page } from '@playwright/test'
import { api, expect, link, node, signUp, test } from './helpers'

/** Picks `content` as "<name>" in the file chooser that `open` brings up. */
async function chooseFile(page: Page, open: () => Promise<void>, name: string, content: string) {
  const chooser = page.waitForEvent('filechooser')
  await open()
  await (await chooser).setFiles({ name, mimeType: 'application/json', buffer: Buffer.from(content) })
}

const openImport = (page: Page) => async () => {
  await page.getByRole('button', { name: 'More ways to create' }).click()
  await page.getByRole('menuitem', { name: 'Import from file' }).click()
}

test('imports an exported workflow and says which credentials are missing', async ({ page, clientIp }) => {
  const account = await signUp(page, clientIp)
  const client = api(page.request, account)
  const id = await client.createWorkflow('Original', {
    nodes: [
      node('t', 'Manual Trigger', 'core.manualTrigger', [0, 0]),
      {
        ...node('h', 'Call API', 'core.httpRequest', [300, 0], { url: 'https://example.com', authentication: 'httpBearerAuth' }),
        // A credential of another workspace: the import leaves it out.
        credentials: { httpBearerAuth: crypto.randomUUID() },
      },
    ],
    connections: [link('t', 'h')],
  })
  const exported = await (
    await page.request.get(`/api/workflows/${id}/export`, {
      headers: { authorization: `Bearer ${account.token}`, 'x-workspace-id': account.workspaceId },
    })
  ).json()

  await page.goto('/workflows')
  await chooseFile(page, openImport(page), 'original.json', JSON.stringify({ ...exported, name: 'Imported copy' }))

  await expect(page.getByText('1 credential is not in this workspace')).toBeVisible()
  await expect(page).toHaveURL(/\/workflows\/(?!.*\/)/)
  await expect(page.locator('.react-flow__node')).toHaveCount(2)
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Call API' })).toBeVisible()
  await expect(page.getByText('Imported copy')).toBeVisible()
})

test('explains files that are not workflow exports', async ({ page, clientIp }) => {
  await signUp(page, clientIp)
  await page.goto('/workflows')

  await chooseFile(page, openImport(page), 'notes.json', 'not json at all')
  await expect(page.getByText('notes.json is not a JSON file.')).toBeVisible()

  // E.g. an n8n export: a different shape.
  await chooseFile(page, openImport(page), 'n8n.json', JSON.stringify({ nodes: [], connections: {} }))
  await expect(page.getByText(/n8n\.json is not a workflow export/)).toBeVisible()
  await expect(page).toHaveURL(/\/workflows$/)
})
