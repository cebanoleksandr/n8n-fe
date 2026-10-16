import type { Page } from '@playwright/test'
import { api, expect, link, node, signUp, test, waitForSaved } from './helpers'

const trigger = node('t', 'Manual Trigger', 'core.manualTrigger', [0, 0])
const set = (name = 'Set', position: [number, number] = [300, 0]) =>
  node('s', name, 'core.set', position, {
    assignments: [{ name: 'greeting', type: 'string', value: 'Hello' }],
    keepOtherFields: true,
  })

async function openEditor(page: Page, workflowId: string, nodes: number) {
  await page.goto(`/workflows/${workflowId}`)
  await expect(page.locator('.react-flow__node')).toHaveCount(nodes)
}

/** Drags with real mouse moves, as React Flow needs. */
async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 12 })
  await page.mouse.up()
}

async function center(page: Page, selector: string) {
  const box = (await page.locator(selector).boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test.describe('connections', () => {
  test('connects by dragging the "+" stub onto a node, and keeps it after reload', async ({ page, clientIp }) => {
    const account = await signUp(page, clientIp)
    const id = await api(page.request, account).createWorkflow('Connect', { nodes: [trigger, set()], connections: [] })
    await openEditor(page, id, 2)

    // The stub is the line before the "+" button of the free output.
    const stub = page.locator('.react-flow__node[data-id="t"] button[aria-label="+"]').locator('xpath=preceding-sibling::*[1]')
    const from = (await stub.boundingBox())!
    await drag(page, { x: from.x + from.width / 2, y: from.y + from.height / 2 }, await center(page, '.react-flow__node[data-id="s"]'))

    await expect(page.locator('.react-flow__edge')).toHaveCount(1)
    await waitForSaved(page)
    await page.reload()
    await expect(page.locator('.react-flow__edge')).toHaveCount(1)
  })

  test('removes a connection with the button shown on hover', async ({ page, clientIp }) => {
    const account = await signUp(page, clientIp)
    const id = await api(page.request, account).createWorkflow('Disconnect', {
      nodes: [trigger, set()],
      connections: [link('t', 's')],
    })
    await openEditor(page, id, 2)

    const path = page.locator('.react-flow__edge-path')
    const middle = await path.evaluate((el: SVGPathElement) => {
      const point = el.getPointAtLength(el.getTotalLength() / 2)
      const m = el.getScreenCTM()!
      return { x: point.x * m.a + m.e, y: point.y * m.d + m.f }
    })
    await page.mouse.move(middle.x, middle.y)
    await page.getByRole('button', { name: 'Delete connection' }).click()

    await expect(page.locator('.react-flow__edge')).toHaveCount(0)
  })

  test('removes a connection by dragging its end off the input', async ({ page, clientIp }) => {
    const account = await signUp(page, clientIp)
    const id = await api(page.request, account).createWorkflow('Drag off', {
      nodes: [trigger, set()],
      connections: [link('t', 's')],
    })
    await openEditor(page, id, 2)

    const input = await center(page, '.react-flow__node[data-id="s"] .react-flow__handle.target')
    await drag(page, { x: input.x - 6, y: input.y }, { x: input.x + 120, y: input.y - 200 })

    await expect(page.locator('.react-flow__edge')).toHaveCount(0)
  })
})

test('renames a node in its settings and autosaves the name', async ({ page, clientIp }) => {
  const account = await signUp(page, clientIp)
  const id = await api(page.request, account).createWorkflow('Rename', {
    nodes: [trigger, set()],
    connections: [link('t', 's')],
  })
  await openEditor(page, id, 2)

  await page.locator('.react-flow__node[data-id="s"]').dblclick()
  const name = page.getByRole('textbox', { name: 'Node name' })
  await name.fill('Greet the user')
  await name.press('Enter')
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()

  await expect(page.locator('.react-flow__node[data-id="s"]')).toContainText('Greet the user')
  await waitForSaved(page)
  await page.reload()
  await expect(page.locator('.react-flow__node[data-id="s"]')).toContainText('Greet the user')
})

test('runs the workflow and shows a node’s output as JSON', async ({ page, clientIp }) => {
  const account = await signUp(page, clientIp)
  const id = await api(page.request, account).createWorkflow('Run', {
    nodes: [trigger, set()],
    connections: [link('t', 's')],
  })
  await openEditor(page, id, 2)

  await page.getByRole('button', { name: 'Execute workflow' }).click()
  // Both nodes get the success check.
  await expect(page.locator('.react-flow__node [data-testid="CheckIcon"]')).toHaveCount(2, { timeout: 20_000 })
  // Edge labels live in React Flow's label layer, not in the edge's <g>.
  await expect(page.locator('.react-flow__edgelabel-renderer')).toContainText('1 item')

  await page.locator('.react-flow__node[data-id="s"]').dblclick()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'JSON' }).last().click()
  await expect(dialog.locator('.cm-content').last()).toContainText('"greeting": "Hello"')
})

test('can only activate a workflow with a Webhook or Schedule trigger', async ({ page, clientIp }) => {
  const account = await signUp(page, clientIp)
  const manual = await api(page.request, account).createWorkflow('Manual only', { nodes: [trigger], connections: [] })
  await openEditor(page, manual, 1)
  await expect(page.getByRole('switch')).toBeDisabled()

  const hook = await api(page.request, account).createWorkflow('With webhook', {
    nodes: [node('w', 'Webhook', 'core.webhook', [0, 0], { path: `e2e-${Date.now()}`, method: 'POST' })],
    connections: [],
  })
  await openEditor(page, hook, 1)
  await page.getByRole('switch').click()
  await expect(page.getByText('Active', { exact: true })).toBeVisible()
  expect((await api(page.request, account).getWorkflow(hook)).active).toBe(true)
})
