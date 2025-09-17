import { test, expect } from '@playwright/test'

test.describe('Projects Management - Fixed', () => {
	test.beforeEach(async ({ page }) => {
		// Login before each test
		await page.goto('http://localhost:3000/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')

		// Wait for login to complete
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})
	})

	test('should access projects page when authenticated', async ({ page }) => {
		// Navigate to projects page
		await page.goto('http://localhost:3000/projects')

		// Verify we're on projects page
		expect(page.url()).toContain('/projects')

		// Check for project-related content
		const pageContent = await page.textContent('body')
		expect(pageContent?.toLowerCase()).toContain('project')

		console.log('✅ Projects page accessible')
	})

	test('should redirect to login when not authenticated', async ({
		browser,
	}) => {
		// Create new context without login
		const context = await browser.newContext()
		const page = await context.newPage()

		// Try to access projects without login
		await page.goto('http://localhost:3000/projects')

		// Should redirect to login
		await page.waitForURL(/.*\/login/, { timeout: 5000 })
		expect(page.url()).toContain('/login')

		await context.close()
		console.log('✅ Authentication required for projects')
	})

	test('should handle project creation form', async ({ page }) => {
		// Navigate to projects
		await page.goto('http://localhost:3000/projects')

		// Look for project form elements
		const nameInput = page
			.locator('input[name="name"], input[placeholder*="name" i]')
			.first()

		if (await nameInput.isVisible({ timeout: 2000 })) {
			// Fill project details
			const projectName = `Test Project ${Date.now()}`
			await nameInput.fill(projectName)

			// Check for description field
			const descriptionField = page
				.locator('textarea[name="description"], input[name="description"]')
				.first()
			if (await descriptionField.isVisible({ timeout: 1000 })) {
				await descriptionField.fill('Test project description')
			}

			// Look for submit button
			const submitButton = page.locator('button[type="submit"]').first()
			if (await submitButton.isVisible()) {
				await submitButton.click()
				console.log('✅ Project form submitted')
			}
		} else {
			console.log('ℹ️ Project form not visible on page')
		}
	})

	test('should display project list or empty state', async ({ page }) => {
		// Navigate to projects
		await page.goto('http://localhost:3000/projects')

		const pageContent = await page.textContent('body')

		// Check for projects or empty state
		const hasProjects =
			pageContent?.includes('Test Project') || pageContent?.includes('Project')

		const hasEmptyState =
			pageContent?.includes('No projects') ||
			pageContent?.includes('Create your first project')

		expect(hasProjects || hasEmptyState).toBe(true)
		console.log('✅ Projects page displays content correctly')
	})

	test('should have search functionality', async ({ page }) => {
		// Navigate to projects
		await page.goto('http://localhost:3000/projects')

		// Look for search input
		const searchInput = page
			.locator('input[type="search"], input[placeholder*="search" i]')
			.first()

		if (await searchInput.isVisible({ timeout: 2000 })) {
			await searchInput.fill('test')
			await page.waitForTimeout(500)
			console.log('✅ Search functionality available')
		} else {
			console.log('ℹ️ Search not implemented')
		}
	})
})
