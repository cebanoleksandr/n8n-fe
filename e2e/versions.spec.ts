import { api, expect, link, node, signUp, test, waitForSaved } from './helpers'

const trigger = node('t', 'Manual Trigger', 'core.manualTrigger', [0, 0])
const set = (value: string) =>
  node('s', 'Set', 'core.set', [300, 0], { assignments: [{ name: 'greeting', type: 'string', value }] })

test('moving nodes keeps the version; an old version can be viewed and restored', async ({ page, clientIp }) => {
  const account = await signUp(page, clientIp)
  const client = api(page.request, account)
  const id = await client.createWorkflow('History', { nodes: [trigger, set('Hello')], connections: [link('t', 's')] })
  // Version 2: a different greeting.
  const put = await page.request.put(`/api/workflows/${id}`, {
    headers: { authorization: `Bearer ${account.token}`, 'x-workspace-id': account.workspaceId },
    data: { graph: { nodes: [trigger, set('Bye')], connections: [link('t', 's')] } },
  })
  expect((await put.json()).version).toBe(2)

  await page.goto(`/workflows/${id}`)
  await expect(page.locator('.react-flow__node')).toHaveCount(2)

  // Dragging a node is saved, but is not a new version.
  const box = (await page.locator('.react-flow__node[data-id="s"]').boundingBox())!
  await page.mouse.move(box.x + 40, box.y + 40)
  await page.mouse.down()
  await page.mouse.move(box.x + 140, box.y + 120, { steps: 10 })
  await page.mouse.up()
  await waitForSaved(page)
  expect((await client.getWorkflow(id)).version).toBe(2)

  await page.getByRole('button', { name: 'Version history' }).click()
  const panel = page.locator('aside')
  await expect(panel.getByRole('button', { name: /Version \d/ })).toHaveCount(2)
  await expect(panel.getByRole('button', { name: /Version 2/ })).toContainText('Current')

  // Version 1, read only: no editing tools.
  await panel.getByRole('button', { name: /Version 1/ }).click()
  await expect(page.getByText(/Version 1 from .* — read only/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Execute workflow' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Add node' })).toBeHidden()

  await page.getByRole('button', { name: 'Restore this version' }).click()
  await expect(page.getByText('Version 1 restored as version 3')).toBeVisible()
  await expect(page.getByText(/read only/)).toBeHidden()
  await expect(panel.getByRole('button', { name: /Version 3/ })).toContainText('Current')

  const restored = await client.getWorkflow(id)
  expect(restored.version).toBe(3)
  expect(restored.graph.nodes.find((n: { id: string }) => n.id === 's').parameters.assignments[0].value).toBe('Hello')
})
