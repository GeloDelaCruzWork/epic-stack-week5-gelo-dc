import { test, expect } from '@playwright/test'

/**
 * SOLUTION 2: Form Validation and Interaction
 *
 * Complete implementation showing Playwright's superior form handling
 */

test.describe('Solution 2: Form Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:3000/login')
	})

	test('validate required fields', async ({ page }) => {
		// Click submit without filling fields
		await page.click('button[type="submit"]:has-text("Log in")')

		// Check for validation messages - the form should still be on login page
		await expect(page).toHaveURL(/login/)

		// Check that we're still on the login form (validation prevented submission)
		await expect(page.locator('#login-form-username')).toBeVisible()
		await expect(page.locator('#login-form-password')).toBeVisible()
	})

	test('login with valid credentials', async ({ page }) => {
		// Fill in the form
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')

		// Click remember me (it's a button, not a checkbox in this app)
		await page.click('#login-form-remember')

		// Submit the form
		await page.click('button[type="submit"]:has-text("Log in")')

		// Should redirect away from login
		await expect(page).not.toHaveURL(/login/)

		console.log('✅ Login successful!')
	})

	test('login with invalid credentials', async ({ page }) => {
		// Fill with invalid credentials
		await page.fill('#login-form-username', 'invalid')
		await page.fill('#login-form-password', 'wrongpassword')

		// Submit
		await page.click('button[type="submit"]:has-text("Log in")')

		// Should show error message
		await expect(
			page.locator('text=/invalid|incorrect|error/i').first(),
		).toBeVisible()

		// Should stay on login page
		await expect(page).toHaveURL(/login/)
	})

	test('form interaction behaviors', async ({ page }) => {
		const usernameInput = page.locator('#login-form-username')
		const passwordInput = page.locator('#login-form-password')

		// Test input focus
		await usernameInput.focus()
		await expect(usernameInput).toBeFocused()

		// Test tab navigation
		await page.keyboard.press('Tab')
		await expect(passwordInput).toBeFocused()

		// Test input clearing
		await usernameInput.fill('testuser')
		await expect(usernameInput).toHaveValue('testuser')
		await usernameInput.clear()
		await expect(usernameInput).toHaveValue('')

		// Test form submission with Enter key
		await usernameInput.fill('kody')
		await passwordInput.fill('kodylovesyou')
		await passwordInput.press('Enter')

		// Should submit and redirect
		await expect(page).not.toHaveURL(/login/)
	})
})
