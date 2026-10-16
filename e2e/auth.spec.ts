import { expect, PASSWORD, signUp, test, uniqueEmail } from './helpers'

test('signs up, logs out and logs back in', async ({ page }) => {
  const email = uniqueEmail('signup')

  await page.goto('/auth/register')
  await page.getByLabel('Name', { exact: true }).fill('Ann Example')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Repeat password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign up' }).click()

  await expect(page).toHaveURL(/\/workflows$/)
  await expect(page.getByText('Ann Example')).toBeVisible()

  // Logging out asks first.
  await page.getByRole('button', { name: 'Log out' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/auth\/login$/)

  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/workflows$/)
})

test('shows a wrong password on the login form', async ({ page }) => {
  await page.goto('/auth/login')
  await page.getByLabel('Email', { exact: true }).fill(uniqueEmail('nobody'))
  await page.getByLabel('Password', { exact: true }).fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Invalid email or password')).toBeVisible()
})

test('sends a guest to login and back where they were going', async ({ page, context, clientIp }) => {
  const account = await signUp(page, clientIp)
  // Signed out: no refresh cookie.
  await context.clearCookies()

  await page.goto('/settings/members')
  await expect(page).toHaveURL(/\/auth\/login\?redirectTo=%2Fsettings%2Fmembers$/)

  await page.getByLabel('Email', { exact: true }).fill(account.email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/settings\/members$/)
})
