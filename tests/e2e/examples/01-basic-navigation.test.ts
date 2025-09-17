import { test, expect } from '@playwright/test'

test.describe('Basic Navigation Examples', () => {
	test('navigate to homepage and verify elements', async ({ page }) => {
		await page.goto('/')

		await expect(page).toHaveTitle(/Epic Notes/)

		const logoLink = page.locator('a[href="/"]').first()
		await expect(logoLink).toBeVisible()

		const loginLink = page.getByRole('link', { name: /log in/i })
		await expect(loginLink).toBeVisible()
	})

	test('navigate between pages', async ({ page }) => {
		await page.goto('/')

		await page.getByRole('link', { name: /log in/i }).click()
		await expect(page).toHaveURL('/login')

		await page.goBack()
		await expect(page).toHaveURL('/')

		await page.goForward()
		await expect(page).toHaveURL('/login')
	})

	test('verify footer links are present', async ({ page }) => {
		await page.goto('/')

		const footer = page.locator('footer')
		await expect(footer).toBeVisible()

		const footerLinks = footer.locator('a')
		const linkCount = await footerLinks.count()
		expect(linkCount).toBeGreaterThan(0)
	})
})
