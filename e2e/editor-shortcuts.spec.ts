import type { Page } from '@playwright/test'
import { api, expect, link, node, signUp, test } from './helpers'

const graph = {
  nodes: [
    node('t', 'Manual Trigger', 'core.manualTrigger', [0, 0]),
    node('a', 'Fetch', 'core.set', [260, 0]),
    node('b', 'Use', 'core.set', [520, 0], {
      assignments: [{ name: 'x', type: 'string', value: `{{ $('Fetch').item.json.x }}` }],
    }),
  ],
  connections: [link('t', 'a'), link('a', 'b')],
}

const nodeNames = (page: Page) => page.locator('.react-flow__node p:first-of-type').allInnerTexts()

async function open(page: Page, clientIp: string) {
  const account = await signUp(page, clientIp)
  const id = await api(page.request, account).createWorkflow('Shortcuts', graph)
  await page.goto(`/workflows/${id}`)
  await expect(page.locator('.react-flow__node')).toHaveCount(3)
  return { account, id }
}

/** Ctrl/Cmd+click adds to the selection. */
async function select(page: Page, ...ids: string[]) {
  await page.locator(`.react-flow__node[data-id="${ids[0]}"]`).click()
  for (const id of ids.slice(1)) {
    await page.locator(`.react-flow__node[data-id="${id}"]`).click({ modifiers: ['ControlOrMeta'] })
  }
}

test('copies and pastes nodes, then undoes and redoes the paste', async ({ page, context, clientIp }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await open(page, clientIp)

  await select(page, 'a', 'b')
  await page.keyboard.press('ControlOrMeta+c')
  await page.keyboard.press('ControlOrMeta+v')

  await expect(page.locator('.react-flow__node')).toHaveCount(5)
  expect(await nodeNames(page)).toEqual(expect.arrayContaining(['Fetch1', 'Use1']))
  // The pasted pair stays connected, and is what's selected now.
  await expect(page.locator('.react-flow__edge')).toHaveCount(3)
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(2)

  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator('.react-flow__node')).toHaveCount(3)
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expect(page.locator('.react-flow__node')).toHaveCount(5)

  // The toolbar buttons do the same.
  await page.getByRole('button', { name: /^Undo/ }).click()
  await expect(page.locator('.react-flow__node')).toHaveCount(3)
  await page.getByRole('button', { name: /^Redo/ }).click()
  await expect(page.locator('.react-flow__node')).toHaveCount(5)
})

test('cuts and duplicates nodes', async ({ page, clientIp }) => {
  await open(page, clientIp)

  await select(page, 'b')
  await page.keyboard.press('ControlOrMeta+d')
  await expect(page.locator('.react-flow__node')).toHaveCount(4)
  expect(await nodeNames(page)).toContain('Use1')

  await select(page, 'a')
  await page.keyboard.press('ControlOrMeta+x')
  await expect(page.locator('.react-flow__node')).toHaveCount(3)
  expect(await nodeNames(page)).not.toContain('Fetch')
  // Its connections went with it.
  await expect(page.locator('.react-flow__edge')).toHaveCount(0)

  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator('.react-flow__node')).toHaveCount(4)
  await expect(page.locator('.react-flow__edge')).toHaveCount(2)
})

test('leaves Ctrl+Z inside a field to the field', async ({ page, clientIp }) => {
  await open(page, clientIp)
  await page.locator('.react-flow__node[data-id="a"]').dblclick()
  const name = page.getByRole('textbox', { name: 'Node name' })
  await name.fill('Renamed')
  await name.press('ControlOrMeta+z')
  // The field undid its own typing; the graph kept all its nodes.
  await expect(name).not.toHaveValue('Renamed')
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
  await expect(page.locator('.react-flow__node')).toHaveCount(3)
})

test('undoes a whole drag in one step', async ({ page, clientIp }) => {
  await open(page, clientIp)
  const target = page.locator('.react-flow__node[data-id="b"]')
  const before = (await target.boundingBox())!

  await page.mouse.move(before.x + 40, before.y + 40)
  await page.mouse.down()
  await page.mouse.move(before.x + 240, before.y + 200, { steps: 20 })
  await page.mouse.up()
  await expect.poll(async () => (await target.boundingBox())!.x).toBeGreaterThan(before.x + 150)

  await page.keyboard.press('ControlOrMeta+z')
  await expect.poll(async () => Math.round((await target.boundingBox())!.x)).toBe(Math.round(before.x))
})

test('selects nodes with a Shift+drag box, deletes them, and brings them back', async ({ page, clientIp }) => {
  await open(page, clientIp)
  const a = (await page.locator('.react-flow__node[data-id="a"]').boundingBox())!
  const b = (await page.locator('.react-flow__node[data-id="b"]').boundingBox())!

  // A box around Fetch and Use, from empty canvas.
  await page.keyboard.down('Shift')
  await page.mouse.move(a.x - 30, a.y - 30)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width + 30, b.y + b.height + 60, { steps: 10 })
  await page.mouse.up()
  await page.keyboard.up('Shift')
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(2)

  await page.keyboard.press('Delete')
  await expect(page.locator('.react-flow__node')).toHaveCount(1)
  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator('.react-flow__node')).toHaveCount(3)
  await expect(page.locator('.react-flow__edge')).toHaveCount(2)
})
