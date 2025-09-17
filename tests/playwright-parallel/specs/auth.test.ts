import { test, expect } from '@playwright/test'
import { AuthHelpers } from '../helpers/auth-helpers'

test.describe('Authentication', () => {
	let authHelpers: AuthHelpers

	test.beforeEach(async ({ page }) => {
		authHelpers = new AuthHelpers(page)
	})

	test('should successfully login with valid credentials', async ({ page }) => {
		await page.goto('/login')

		// Fill login form using the actual form IDs
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')

		// Submit form - use the specific login button
		await page.click('button[type="submit"]:has-text("Log in")')

		// Wait for redirect after successful login
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})

		// Verify we're no longer on login page - successful login redirects
		const currentUrl = page.url()
		expect(currentUrl).not.toContain('/login')

		// Verify we can see user-specific content (user profile page)
		await expect(page.locator('text=/kody/i').first()).toBeVisible({
			timeout: 5000,
		})
	})

	test('should show error with invalid credentials', async ({ page }) => {
		await page.goto('/login')

		// Fill with invalid credentials
		await page.fill('#login-form-username', 'invalid')
		await page.fill('#login-form-password', 'wrongpassword')

		// Submit form
		await page.click('button[type="submit"]:has-text("Log in")')

		// Wait for error message - use more specific selector to avoid multiple matches
		const errorMessage = page
			.locator(
				'.text-foreground-destructive:has-text("Invalid username or password")',
			)
			.first()
		await expect(errorMessage).toBeVisible({ timeout: 5000 })

		// Should still be on login page
		await expect(page).toHaveURL(/.*\/login/)
	})

	test('should successfully logout', async ({ page }) => {
		// First login
		await authHelpers.login()

		// Verify we're logged in by checking URL
		expect(page.url()).not.toContain('/login')

		// Navigate to a page that should have logout
		await page.goto('/users/kody')

		// Look for logout form or navigate to logout
		const logoutForm = page.locator('form[action="/logout"]')
		if (await logoutForm.isVisible()) {
			await logoutForm.locator('button[type="submit"]').click()
		} else {
			// Try direct logout
			await page.goto('/logout', { waitUntil: 'networkidle' })
		}

		// Should redirect to home or login
		await page.waitForTimeout(1000)
		const url = page.url()
		expect(url.includes('/login') || url === 'http://localhost:3000/').toBe(
			true,
		)
	})

	test('should allow access to public notes without login', async ({
		page,
	}) => {
		// Notes page is actually public
		await page.goto('/users/kody/notes')

		// Should be able to see notes
		await expect(page.locator('text=/Kody.*Notes/i')).toBeVisible()

		// But shouldn't see edit/delete buttons without login
		const editButtons = page.locator(
			'button:has-text("Edit"), a:has-text("Edit")',
		)
		await expect(editButtons).toHaveCount(0)
	})

	test('should persist login state across page navigation', async ({
		page,
	}) => {
		// Login
		await authHelpers.login()

		// After login, Epic Stack redirects to home page (/) not /users/kody
		// This is the expected behavior
		const currentUrl = page.url()
		expect(currentUrl).not.toContain('/login')

		// Navigate to notes - should maintain session
		await page.goto('/users/kody/notes')
		expect(page.url()).toContain('/notes')

		// Verify we can see the notes page content (not redirected to login)
		await expect(
			page.locator('h1:has-text("Kody\'s Notes")').first(),
		).toBeVisible({ timeout: 5000 })

		// Navigate to home - should maintain session
		await page.goto('/')
		await page.waitForLoadState('networkidle')

		// Verify still logged in by checking for user-specific content
		await expect(page.locator('text=/kody/i').first()).toBeVisible({
			timeout: 5000,
		})
	})

	test('should handle login form validation', async ({ page }) => {
		await page.goto('/login')

		// Epic Stack uses HTML5 validation which requires interaction
		// Fill username but leave password empty
		await page.fill('#login-form-username', 'testuser')

		// Clear username to trigger validation
		await page.fill('#login-form-username', '')

		// Try to submit with empty username
		await page.click('button[type="submit"]:has-text("Log in")')

		// Should stay on login page due to validation
		await page.waitForTimeout(500)
		expect(page.url()).toContain('/login')

		// Now test with empty password
		await page.fill('#login-form-username', 'testuser')
		await page.fill('#login-form-password', '')
		await page.click('button[type="submit"]:has-text("Log in")')

		// Should still be on login page
		await page.waitForTimeout(500)
		expect(page.url()).toContain('/login')

		// Verify the form exists and fields are still there (form wasn't submitted)
		await expect(page.locator('#login-form-username')).toBeVisible()
		await expect(page.locator('#login-form-password')).toBeVisible()
	})
})
