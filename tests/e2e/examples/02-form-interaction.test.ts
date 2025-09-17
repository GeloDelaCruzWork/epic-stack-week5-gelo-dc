import { test, expect } from '@playwright/test'

test.describe('Form Interaction Examples', () => {
	test('interact with login form elements', async ({ page }) => {
		await page.goto('/login')

		const usernameInput = page.getByLabel(/username/i)
		await expect(usernameInput).toBeVisible()
		await usernameInput.fill('testuser')
		await expect(usernameInput).toHaveValue('testuser')

		const passwordInput = page.getByLabel(/password/i)
		await expect(passwordInput).toBeVisible()
		await passwordInput.fill('testpassword123')
		await expect(passwordInput).toHaveValue('testpassword123')

		const rememberCheckbox = page.getByRole('checkbox', {
			name: /remember me/i,
		})
		if (await rememberCheckbox.isVisible()) {
			await rememberCheckbox.check()
			await expect(rememberCheckbox).toBeChecked()

			await rememberCheckbox.uncheck()
			await expect(rememberCheckbox).not.toBeChecked()
		}
	})

	test('verify form validation messages', async ({ page }) => {
		await page.goto('/login')

		const submitButton = page.getByRole('button', { name: /log in/i })
		await submitButton.click()

		const usernameError = page
			.locator('text=/username/i')
			.locator('..')
			.locator('text=/required/i')
		const passwordError = page
			.locator('text=/password/i')
			.locator('..')
			.locator('text=/required/i')

		const hasValidation =
			(await usernameError.isVisible()) || (await passwordError.isVisible())
		expect(hasValidation).toBeTruthy()
	})

	test('search form interaction', async ({ page }) => {
		await page.goto('/')

		const searchInput = page
			.getByRole('searchbox')
			.or(page.getByPlaceholder(/search/i))

		if (await searchInput.isVisible()) {
			await searchInput.fill('test search query')
			await searchInput.press('Enter')

			const url = page.url()
			expect(url).toContain('search')
		}
	})
})
