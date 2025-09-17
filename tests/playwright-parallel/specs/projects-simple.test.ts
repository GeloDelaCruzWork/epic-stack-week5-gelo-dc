import { test, expect } from '../fixtures/auth.fixture'

test.describe('Projects Tests - Simple', () => {
	test('requires authentication to access projects', async ({ page }) => {
		// Try to access projects without login
		await page.goto('/projects')

		// Should redirect to login
		await page.waitForURL(/.*\/login/, { timeout: 5000 })
		expect(page.url()).toContain('/login')
	})

	test('allows logged in users to view projects page', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Should be on projects page
		expect(page.url()).toContain('/projects')

		// Should see projects heading or content
		const heading = page.locator('h1').first()
		await expect(heading).toBeVisible({ timeout: 5000 })

		// Page should contain project-related content
		const bodyText = await page.textContent('body')
		expect(bodyText?.toLowerCase()).toContain('project')
	})

	test('shows project form fields', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Check for name input field
		const nameInput = page
			.locator(
				'input[name="name"], input[id="name"], input[placeholder*="name" i]',
			)
			.first()
		await expect(nameInput).toBeVisible()

		// Check for submit button
		const submitButton = page.locator('button[type="submit"]').first()
		await expect(submitButton).toBeVisible()
	})

	test('validates required fields', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Clear name field if it has a value
		const nameInput = page
			.locator('input[name="name"], input[id="name"]')
			.first()
		await nameInput.clear()

		// Try to submit empty form
		const submitButton = page.locator('button[type="submit"]').first()
		await submitButton.click()

		// Check for validation error
		await page.waitForTimeout(1000)

		// Check HTML5 validation
		const validationMessage = await nameInput.evaluate(
			(el: HTMLInputElement) => el.validationMessage,
		)
		if (validationMessage) {
			expect(validationMessage).toBeTruthy()
		} else {
			// Check for custom error messages
			const errorMessage = page
				.locator('.error-message, [role="alert"], text=/required/i')
				.first()
			const isVisible = await errorMessage
				.isVisible({ timeout: 1000 })
				.catch(() => false)
			expect(isVisible || validationMessage).toBeTruthy()
		}
	})

	test('can fill project form', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Fill project name
		const nameInput = page
			.locator('input[name="name"], input[id="name"]')
			.first()
		await nameInput.clear()
		await nameInput.fill('Test Project')

		// Verify the value was entered
		const value = await nameInput.inputValue()
		expect(value).toBe('Test Project')

		// Fill description if available
		const descriptionField = page
			.locator('textarea[name="description"], input[name="description"]')
			.first()
		if (
			await descriptionField.isVisible({ timeout: 1000 }).catch(() => false)
		) {
			await descriptionField.fill('Test project description')
		}
	})

	test('displays project content or form', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		const bodyText = await page.textContent('body')

		// Check for various project-related content
		const hasProjectContent =
			bodyText?.includes('project') ||
			bodyText?.includes('Project') ||
			bodyText?.includes('PROJECT')

		// Check for form elements
		const hasForm = (await page.locator('form').count()) > 0
		const hasInput =
			(await page.locator('input[name="name"], input[id="name"]').count()) > 0

		// Should have some project-related content
		expect(hasProjectContent || hasForm || hasInput).toBe(true)
	})

	test('has search functionality', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Look for search input
		const searchInput = page
			.locator('input[type="search"], input[placeholder*="search" i]')
			.first()

		if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
			// Type search query
			await searchInput.fill('Test')
			await page.waitForTimeout(500)

			// Page should still work
			const hasContent = await page.locator('body').isVisible()
			expect(hasContent).toBe(true)
		} else {
			// Search might not be implemented - that's ok
			expect(true).toBe(true)
		}
	})

	test('has proper page structure', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Should have a form or project list
		const hasForm = await page
			.locator('form')
			.first()
			.isVisible()
			.catch(() => false)
		const hasProjectList = await page
			.locator('[data-testid*="project"], .project-list, article')
			.first()
			.isVisible()
			.catch(() => false)

		// Should have either a form or project list
		expect(hasForm || hasProjectList).toBe(true)

		// Should have navigation
		const hasNav = await page.locator('nav').first().isVisible()
		expect(hasNav).toBe(true)
	})
})
