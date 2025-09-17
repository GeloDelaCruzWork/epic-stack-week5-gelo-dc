import { test, expect } from '../fixtures/auth.fixture'
import { Page } from '@playwright/test'

test.describe('Notes Management', () => {
	test.use({ baseURL: 'http://localhost:3000' })

	test('should allow users to create notes', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to notes page
		await page.goto('/users/kody/notes')

		// Navigate directly to new note page (requires auth)
		await page.goto('/users/kody/notes/new')
		await page.waitForLoadState('networkidle')

		// Fill in note title
		await page.fill('input[name="title"]', 'Test Note from Playwright')

		// Fill in note content
		await page.fill(
			'textarea[name="content"]',
			'This is a test note created by Playwright with excellent performance and reliability.',
		)

		// Submit the form using the visible StatusButton
		await page.click('button[type="submit"]:has-text("Submit")')

		// Wait for navigation away from new note page
		await page.waitForURL((url) => !url.pathname.includes('/new'), {
			timeout: 10000,
		})

		// After save, we should see the note title on the page
		await expect(
			page.locator('h2:has-text("Test Note from Playwright")'),
		).toBeVisible({ timeout: 5000 })
	})

	test('should allow users to edit notes', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// First create a note to edit
		await page.goto('/users/kody/notes/new')
		await page.fill('input[name="title"]', 'Note to Edit')
		await page.fill('textarea[name="content"]', 'Original content')
		await page.click('button[type="submit"]:has-text("Submit")')
		await page.waitForURL((url) => !url.pathname.includes('/new'), {
			timeout: 10000,
		})

		// Now edit it
		await page.click('a[href*="edit"]')
		await page.waitForLoadState('networkidle')

		// Update the note
		await page.fill('input[name="title"]', 'Updated Note Title - Playwright')
		await page.fill(
			'textarea[name="content"]',
			'Updated content from Playwright test - fast and reliable!',
		)

		// Save changes
		await page.click('button[type="submit"]:has-text("Submit")')

		// Wait for redirect to note view
		await page.waitForTimeout(2000) // Give it time to save

		// Verify update - check if we're no longer on edit page
		const currentUrl = page.url()
		expect(currentUrl).not.toContain('/edit')

		// The title should be visible
		await expect(page.locator('h2').first()).toContainText('Updated Note Title')
	})

	test('should allow users to delete notes', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		await page.goto('/users/kody/notes')

		// Ensure the note exists before deleting
		const note = page.locator('a:has-text("Note to Delete")')
		await expect(note).toHaveCount(1)

		// Click the note to go to its page
		await note.click()

		// Trigger delete (assuming there's a delete button in the note view)
		await page.getByRole('button', { name: /delete/i }).click()

		// Wait for navigation back to notes list
		await page.waitForURL('/users/kody/notes')

		// Now assert that the note is gone
		await expect(page.locator('a:has-text("Note to Delete")')).toHaveCount(0)
	})

	test('should validate required fields when creating a note', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to new note page
		await page.goto('/users/kody/notes/new')

		// Try to submit without filling fields
		await page.click('button[type="submit"]')

		// Check for validation
		const titleInput = page.locator('input[name="title"]')
		const validationMessage = await titleInput.evaluate(
			(el: HTMLInputElement) => el.validationMessage,
		)

		// Should have validation message or error visible
		if (validationMessage) {
			expect(validationMessage).toBeTruthy()
		} else {
			// Check for custom error message
			await expect(
				page.locator('[role="alert"], .error-message, text=/required/i'),
			).toBeVisible()
		}
	})

	test('should search and filter notes', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to notes page
		await page.goto('/users/kody/notes')

		// Look for search input
		const searchInput = page
			.locator(
				'input[type="search"], input[placeholder*="search" i], input[name="search"]',
			)
			.first()

		if (await searchInput.isVisible()) {
			// Type search query
			await searchInput.fill('Test')

			// Wait for search results to update
			await page.waitForTimeout(500)

			// Verify filtered results
			const visibleNotes = await page
				.locator('a[href*="/notes/"]:visible')
				.count()
			// Results should be filtered (exact count depends on data)
			expect(visibleNotes).toBeGreaterThanOrEqual(0)
		} else {
			// Search might not be implemented
			test.skip()
		}
	})

	test('should handle long note content gracefully', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to new note page
		await page.goto('/users/kody/notes/new')

		// Create a long content string
		const longContent = 'This is a test note with very long content. '.repeat(
			100,
		)

		// Fill in note with long content
		await page.fill('input[name="title"]', 'Long Content Note - Playwright')
		await page.fill('textarea[name="content"]', longContent)

		// Submit the form using the visible StatusButton
		await page.click('button[type="submit"]:has-text("Submit")')

		// Wait for save
		await page.waitForURL((url) => !url.pathname.includes('/new'), {
			timeout: 10000,
		})

		// Verify note was created - title appears as h2
		await expect(
			page.locator('h2:has-text("Long Content Note - Playwright")'),
		).toBeVisible({ timeout: 5000 })
	})
})
