import type { Page } from '@playwright/test'
import { api, expect, link, node, signUp, test } from './helpers'

const graph = {
  nodes: [
    node('t', 'Manual Trigger', 'core.manualTrigger', [0, 0]),
    node('src', 'Source', 'core.set', [260, 0], {
      assignments: [{ name: 'source', type: 'string', value: 'real' }],
      keepOtherFields: false,
    }),
    node('use', 'Use', 'core.set', [520, 0], {
      assignments: [{ name: 'greeting', type: 'string', value: 'Hi {{ $json.source }}' }],
      keepOtherFields: false,
    }),
  ],
  connections: [link('t', 'src'), link('src', 'use')],
}

async function openNode(page: Page, id: string) {
  await page.locator(`.react-flow__node[data-id="${id}"]`).dblclick()
  return page.getByRole('dialog')
}

async function runAndReadGreeting(page: Page) {
  await page.getByRole('button', { name: 'Execute workflow' }).click()
  await expect(page.locator('.react-flow__node [data-testid="CheckIcon"]')).toHaveCount(3, { timeout: 20_000 })
  const dialog = await openNode(page, 'use')
  await dialog.getByRole('button', { name: 'JSON' }).last().click()
  const text = await dialog.locator('.cm-content').last().innerText()
  await dialog.getByRole('button', { name: 'Close' }).click()
  return text
}

test('pinned output replaces the node in test runs, until unpinned', async ({ page, clientIp }) => {
  const account = await signUp(page, clientIp)
  const client = api(page.request, account)
  const id = await client.createWorkflow('Pins', graph)
  await page.goto(`/workflows/${id}`)
  await expect(page.locator('.react-flow__node')).toHaveCount(3)

  // Test data written by hand, before any run.
  let dialog = await openNode(page, 'src')
  await dialog.getByRole('button', { name: 'Set test data' }).click()
  const editor = dialog.locator('.cm-content').last()
  await editor.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText('{"source": "pinned"}')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog.getByText(/Pinned: manual runs use this data/)).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(page.locator('.react-flow__node[data-id="src"] [aria-label="pinned"]')).toBeVisible()
  expect((await client.getWorkflow(id)).pinData).toEqual({ src: [{ source: 'pinned' }] })

  expect(await runAndReadGreeting(page)).toContain('"greeting": "Hi pinned"')

  // Unpinned, the node runs again.
  dialog = await openNode(page, 'src')
  await dialog.getByRole('button', { name: 'Unpin' }).click()
  await expect(page.getByText('Output unpinned')).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(page.locator('.react-flow__node[data-id="src"] [aria-label="pinned"]')).toHaveCount(0)

  expect(await runAndReadGreeting(page)).toContain('"greeting": "Hi real"')

  // Pinning a real run's output keeps exactly that output.
  dialog = await openNode(page, 'src')
  await dialog.getByRole('button', { name: /Pin data/ }).click()
  await expect(page.getByText('Output pinned')).toBeVisible()
  expect((await client.getWorkflow(id)).pinData).toEqual({ src: [{ source: 'real' }] })
})

test('rejects pinned data that is not objects', async ({ page, clientIp }) => {
  const account = await signUp(page, clientIp)
  const id = await api(page.request, account).createWorkflow('Bad pins', graph)
  await page.goto(`/workflows/${id}`)

  const dialog = await openNode(page, 'src')
  await dialog.getByRole('button', { name: 'Set test data' }).click()
  await dialog.locator('.cm-content').last().click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText('[1, 2]')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog.getByText('Enter an object, or an array of objects')).toBeVisible()
})
