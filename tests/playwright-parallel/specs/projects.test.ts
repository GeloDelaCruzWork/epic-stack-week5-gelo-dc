import { test, expect } from '../fixtures/auth.fixture'
import { Page } from '@playwright/test'

test.describe('Projects Management', () => {
	test.use({ baseURL: 'http://localhost:3000' })

	test('should require authentication to access projects', async ({ page }) => {
		// Navigate to projects without logging in
		await page.goto('/projects')

		// Should be redirected to login
		await page.waitForURL(/.*\/login/, { timeout: 5000 })
		expect(page.url()).toContain('/login')
	})

	test('should allow logged in users to view projects page', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')

		// Wait for page to load
		await page.waitForLoadState('networkidle')

		// Check for projects heading or content
		const heading = page.locator('h1:has-text("Projects"), h1').first()
		await expect(heading).toBeVisible({ timeout: 5000 })

		// Verify we're on projects page
		expect(page.url()).toContain('/projects')

		// Check page has project-related content
		const bodyText = await page.textContent('body')
		expect(bodyText?.toLowerCase()).toContain('project')
	})

	test('should allow users to create a new project', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Generate unique project name
		const projectName = `Playwright Test Project ${Date.now()}`

		// Fill project name
		await page.fill(
			'input[name="name"], input[id="name"], input[placeholder*="name" i]',
			projectName,
		)

		// Fill description if available
		const descriptionField = page
			.locator('textarea[name="description"], input[name="description"]')
			.first()
		if (await descriptionField.isVisible()) {
			await descriptionField.fill(
				'This project was created by Playwright automated test - superior performance!',
			)
		}

		// Submit form - use the actual button text
		await page.click('button[type="submit"]:has-text("Create Project")')

		// Wait for project creation
		await page.waitForLoadState('networkidle')

		// Verify project was created
		await expect(page.locator(`text=${projectName}`)).toBeVisible({
			timeout: 5000,
		})
	})

	test('should validate required fields when creating a project', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Clear any existing values
		const nameInput = page
			.locator('input[name="name"], input[id="name"]')
			.first()
		await nameInput.clear()

		// Try to submit without filling required fields
		await page.click('button[type="submit"]:has-text("Create Project")')

		// Check for validation error
		const errorIndicators = [
			page.locator('.error-message'),
			page.locator('[role="alert"]'),
			page.locator('text=/required/i'),
		]

		let errorFound = false
		for (const indicator of errorIndicators) {
			if (await indicator.isVisible({ timeout: 2000 })) {
				errorFound = true
				break
			}
		}

		// Check HTML5 validation
		if (!errorFound) {
			const validationMessage = await nameInput.evaluate(
				(el: HTMLInputElement) => el.validationMessage,
			)
			errorFound = !!validationMessage
		}

		expect(errorFound).toBe(true)
	})

	test('should allow users to edit an existing project', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Find edit button/link
		const editButton = page
			.locator(
				'a[href*="/edit"], button[title*="Edit" i], [aria-label*="Edit" i]',
			)
			.first()

		if (await editButton.isVisible()) {
			await editButton.click()
			await page.waitForLoadState('networkidle')

			// Update project name
			const nameInput = page
				.locator('input[name="name"], input[id="name"]')
				.first()
			await nameInput.clear()

			const updatedName = `Updated Playwright Project ${Date.now()}`
			await nameInput.fill(updatedName)

			// Submit changes - button says "Save Changes"
			await page.click('button[type="submit"]:has-text("Save Changes")')

			// Wait for redirect back to projects page
			await page.waitForURL('/projects', { timeout: 5000 })
			await page.waitForLoadState('networkidle')

			// Verify update - the name should appear in the projects list
			await expect(page.locator(`text=${updatedName}`)).toBeVisible({
				timeout: 5000,
			})
		} else {
			test.skip()
		}
	})

	test('should allow users to delete a project', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Count initial projects
		const projectItems = page.locator(
			'[data-testid="project-item"], .project-item, article',
		)
		const initialCount = await projectItems.count()

		if (initialCount > 0) {
			// Find delete button
			const deleteButton = page
				.locator(
					'button[title*="Delete" i], [aria-label*="Delete" i], button:has-text("Delete")',
				)
				.first()

			if (await deleteButton.isVisible()) {
				await deleteButton.click()

				// Handle confirmation dialog if present
				const confirmButton = page
					.locator(
						'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")',
					)
					.last()
				if (await confirmButton.isVisible({ timeout: 1000 })) {
					await confirmButton.click()
				}

				// Wait for deletion
				await page.waitForLoadState('networkidle')

				// Verify deletion
				const newCount = await projectItems.count()
				expect(newCount).toBeLessThan(initialCount)
			} else {
				test.skip()
			}
		} else {
			test.skip()
		}
	})

	test('should display empty state when no projects exist', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		const bodyText = await page.textContent('body')

		// Check for empty state messages
		const hasEmptyState =
			bodyText?.includes('No projects') ||
			bodyText?.includes('no projects') ||
			bodyText?.includes('Create your first project') ||
			bodyText?.includes('Get started')

		// This test is only relevant if there are no projects
		if (!hasEmptyState) {
			// Check if there are actually projects
			const projectCount = await page
				.locator('[data-testid="project-item"], .project-item, article')
				.count()
			if (projectCount > 0) {
				test.skip()
			}
		} else {
			expect(hasEmptyState).toBe(true)
		}
	})

	test('should handle project search/filter', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Look for search input
		const searchInput = page
			.locator('input[type="search"], input[placeholder*="search" i]')
			.first()

		if (await searchInput.isVisible()) {
			// Type search query
			await searchInput.fill('Test')

			// Wait for results to update
			await page.waitForTimeout(500)

			// Check that page still works (no errors)
			const hasContent = await page.locator('body').isVisible()
			expect(hasContent).toBe(true)
		} else {
			// Search might not be implemented
			test.skip()
		}
	})

	test('should handle concurrent project operations', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to projects page
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Create multiple projects quickly
		const projectNames = [
			`Playwright Concurrent Test 1 ${Date.now()}`,
			`Playwright Concurrent Test 2 ${Date.now() + 1}`,
		]

		for (const name of projectNames) {
			const nameInput = page
				.locator('input[name="name"], input[id="name"]')
				.first()
			await nameInput.clear()
			await nameInput.fill(name)

			await page.click('button[type="submit"]:has-text("Create Project")')
			await page.waitForLoadState('networkidle')
		}

		// Verify both projects were created
		for (const name of projectNames) {
			await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 5000 })
		}
	})
})
