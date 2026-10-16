import type { Page } from '@playwright/test'
import { api, expect, node, signUp, test } from './helpers'

async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Actions' }).first().click()
  await page.getByRole('menuitem', { name: 'Workflow settings' }).click()
  return page.getByRole('dialog')
}

test('sets a timeout and creates an error workflow', async ({ page, clientIp }) => {
  const account = await signUp(page, clientIp)
  const client = api(page.request, account)
  const id = await client.createWorkflow('Orders', {
    nodes: [node('w', 'Webhook', 'core.webhook', [0, 0], { path: `orders-${Date.now()}` })],
    connections: [],
  })
  await page.goto(`/workflows/${id}`)
  await expect(page.locator('.react-flow__node')).toHaveCount(1)

  let dialog = await openSettings(page)
  await dialog.getByRole('button', { name: 'Create one' }).click()
  await expect(dialog.getByRole('combobox', { name: 'Error workflow' })).toHaveValue('Orders — errors')

  await dialog.getByText('Limit execution time').click()
  await dialog.getByRole('spinbutton', { name: 'Timeout' }).fill('2')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Workflow settings saved')).toBeVisible()

  const saved = await client.getWorkflow(id)
  expect(saved.settings.timeoutSeconds).toBe(120)
  const errorWorkflow = await client.getWorkflow(saved.settings.errorWorkflowId)
  expect(errorWorkflow.name).toBe('Orders — errors')
  expect(errorWorkflow.graph.nodes.map((n: { type: string }) => n.type)).toEqual(['core.errorTrigger'])

  // Reopened, the settings read back as saved.
  dialog = await openSettings(page)
  await expect(dialog.getByRole('combobox', { name: 'Error workflow' })).toHaveValue('Orders — errors')
  await expect(dialog.getByRole('spinbutton', { name: 'Timeout' })).toHaveValue('2')
  await expect(dialog.getByRole('combobox', { name: 'Unit' })).toHaveText('minutes')
})

test('refuses an error workflow without an Error Trigger', async ({ page, clientIp }) => {
  const account = await signUp(page, clientIp)
  const client = api(page.request, account)
  await client.createWorkflow('Plain workflow', { nodes: [node('t', 'Manual Trigger', 'core.manualTrigger', [0, 0])], connections: [] })
  const id = await client.createWorkflow('Main', { nodes: [], connections: [] })
  await page.goto(`/workflows/${id}`)

  const dialog = await openSettings(page)
  await dialog.getByRole('combobox', { name: 'Error workflow' }).fill('Plain')
  await page.getByRole('option', { name: 'Plain workflow' }).click()
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog.getByRole('alert')).toContainText('Error Trigger')
  expect((await client.getWorkflow(id)).settings.errorWorkflowId).toBeUndefined()
})
