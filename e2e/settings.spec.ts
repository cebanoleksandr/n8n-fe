import { expect, PASSWORD, signUp, test, uniqueEmail } from './helpers'

test('invites someone, who joins through the link and gets a new role', async ({ page, browser, clientIp }) => {
  await signUp(page, clientIp, 'Olena Owner', 'Acme')
  const inviteeEmail = uniqueEmail('invitee')

  // The owner invites by email and gets a link to share.
  await page.goto('/settings/members')
  await page.getByPlaceholder('colleague@company.com').fill(inviteeEmail)
  await page.getByRole('button', { name: 'Invite' }).click()
  const link = await page.getByRole('dialog').getByRole('textbox').inputValue()
  expect(link).toMatch(/\/auth\/invite\/.+/)
  await page.getByRole('button', { name: 'Done' }).click()
  // Exact: the closing dialog's text mentions the email too.
  await expect(page.getByText(inviteeEmail, { exact: true })).toBeVisible()

  // The invitee, in a browser of their own, creates an account through it.
  const invitee = await (await browser.newContext({ locale: 'en-US' })).newPage()
  await invitee.goto(link)
  await expect(invitee.getByRole('heading', { name: 'Join Acme' })).toBeVisible()
  await invitee.getByLabel('Name', { exact: true }).fill('Bob Builder')
  await invitee.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await invitee.getByLabel('Repeat password', { exact: true }).fill(PASSWORD)
  await invitee.getByRole('button', { name: 'Join workspace' }).click()
  await expect(invitee).toHaveURL(/\/workflows$/)

  // They land in the workspace they were invited to, as an editor.
  await invitee.goto('/settings/workspace')
  const acme = invitee.getByRole('listitem').filter({ hasText: 'Acme' })
  await expect(acme.getByText('Current')).toBeVisible()
  await expect(acme.getByText('Editor')).toBeVisible()
  await invitee.context().close()

  // The owner sees them, and the invitation is gone.
  await page.reload()
  const row = page.getByRole('row').filter({ hasText: 'Bob Builder' })
  await expect(row).toBeVisible()
  await expect(page.getByText('No pending invitations.')).toBeVisible()

  await row.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Viewer' }).click()
  await expect(page.getByText('Role changed')).toBeVisible()
  await expect(row.getByRole('combobox')).toHaveText('Viewer')
})

test('changes the password, rejecting a wrong current one', async ({ page, clientIp }) => {
  const account = await signUp(page, clientIp)
  await page.goto('/settings/profile')

  const current = page.getByLabel('Current password', { exact: true })
  await current.fill('not-my-password')
  await page.getByLabel('New password', { exact: true }).fill('new-password-456')
  await page.getByLabel('Repeat password', { exact: true }).fill('new-password-456')
  await page.getByRole('button', { name: 'Change password' }).click()
  await expect(page.getByText('Wrong password')).toBeVisible()

  await current.fill(PASSWORD)
  await page.getByRole('button', { name: 'Change password' }).click()
  await expect(page.getByText('Password changed')).toBeVisible()
  await expect(current).toHaveValue('')

  const login = await page.request.post('/api/auth/login', {
    data: { email: account.email, password: 'new-password-456' },
  })
  expect(login.ok()).toBeTruthy()
})

test('switches the theme and remembers it', async ({ page, clientIp }) => {
  await signUp(page, clientIp)
  await page.goto('/settings/profile')

  await page.getByRole('button', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.getByRole('button', { name: 'Light' }).click()
  await expect(page.locator('html')).toHaveClass(/light/)
})
