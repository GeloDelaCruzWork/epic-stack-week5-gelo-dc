import { test, expect } from '@playwright/test'

test.describe('Authenticated User Flow Examples', () => {
	test.describe.configure({ mode: 'serial' })

	test('complete login flow with default credentials', async ({ page }) => {
		await page.goto('/login')

		await page.getByLabel(/username/i).fill('kody')
		await page.getByLabel(/password/i).fill('kodylovesyou')

		await page.getByRole('button', { name: /log in/i }).click()

		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
			waitUntil: 'networkidle',
		})

		const userMenuButton = page
			.getByRole('button', { name: /kody/i })
			.or(page.getByRole('button').filter({ has: page.getByText('kody') }))

		await expect(userMenuButton).toBeVisible({ timeout: 10000 })
	})

	test('access user menu and navigate to profile', async ({ page }) => {
		await page.goto('/login')
		await page.getByLabel(/username/i).fill('kody')
		await page.getByLabel(/password/i).fill('kodylovesyou')
		await page.getByRole('button', { name: /log in/i }).click()

		await page.waitForURL((url) => !url.pathname.includes('/login'))

		const userMenuButton = page
			.getByRole('button', { name: /kody/i })
			.or(page.getByRole('button').filter({ has: page.getByText('kody') }))
		await userMenuButton.click()

		const profileLink = page.getByRole('link', { name: /profile/i })
		if (await profileLink.isVisible()) {
			await profileLink.click()
			await expect(page).toHaveURL(/\/settings\/profile/)
		}
	})

	test('logout flow', async ({ page }) => {
		await page.goto('/login')
		await page.getByLabel(/username/i).fill('kody')
		await page.getByLabel(/password/i).fill('kodylovesyou')
		await page.getByRole('button', { name: /log in/i }).click()

		await page.waitForURL((url) => !url.pathname.includes('/login'))

		const userMenuButton = page
			.getByRole('button', { name: /kody/i })
			.or(page.getByRole('button').filter({ has: page.getByText('kody') }))
		await userMenuButton.click()

		const logoutButton = page
			.getByRole('button', { name: /logout/i })
			.or(page.getByRole('menuitem', { name: /logout/i }))

		if (await logoutButton.isVisible()) {
			await logoutButton.click()

			await page.waitForURL('/login', { timeout: 10000 })
			await expect(page).toHaveURL('/login')
		}
	})
})
