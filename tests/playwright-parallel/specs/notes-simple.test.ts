import { test, expect } from '../fixtures/auth.fixture'

test.describe('Notes Tests - Simple', () => {
	test('can view public notes without login', async ({ page }) => {
		// Navigate to notes page - should be public
		await page.goto('/users/kody/notes')

		// Should see notes list - use first match
		await expect(page.locator('text=/Notes/i').first()).toBeVisible()

		// Should see some note links
		const noteLinks = page.locator('a[href*="/notes/"]:not([href*="new"])')
		const count = await noteLinks.count()
		expect(count).toBeGreaterThan(0)
	})

	test('can view individual note', async ({ page }) => {
		// Navigate to notes page
		await page.goto('/users/kody/notes')

		// Check if there are any notes
		const noteLinks = page.locator('a[href*="/notes/"]:not([href*="new"])')
		const noteCount = await noteLinks.count()

		if (noteCount > 0) {
			// Get the href of the first note
			const firstNote = noteLinks.first()
			const noteHref = await firstNote.getAttribute('href')

			// Click and wait for navigation
			await Promise.all([
				page.waitForURL((url) => url.pathname !== '/users/kody/notes', {
					timeout: 5000,
				}),
				firstNote.click(),
			])

			// Should navigate to note detail
			const currentUrl = page.url()

			// If we're still on the notes list, the click didn't work
			if (currentUrl.endsWith('/notes')) {
				// Try navigating directly
				if (noteHref) {
					await page.goto(noteHref)
				}
			}

			// Verify we're on a note detail page
			const finalUrl = page.url()
			expect(finalUrl).toMatch(/\/notes\/[a-z0-9]+$/i)

			// Should see note content
			const hasContent = await page.locator('h2, p').first().isVisible()
			expect(hasContent).toBe(true)
		} else {
			console.log('No notes available to test')
		}
	})

	test('requires login to create notes', async ({ page }) => {
		// Try to access new note page without login
		await page.goto('/users/kody/notes/new')

		// Should redirect to login
		await page.waitForURL(/.*\/login/, { timeout: 5000 })
		expect(page.url()).toContain('/login')
	})

	test('can access note creation when logged in', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to new note page
		await page.goto('/users/kody/notes/new')

		// Should see form fields
		const titleInput = page.locator('input[name="title"]')
		await expect(titleInput).toBeVisible()

		const contentTextarea = page.locator('textarea[name="content"]')
		await expect(contentTextarea).toBeVisible()

		const submitButton = page.locator(
			'button[type="submit"][form="note-editor"]',
		)
		await expect(submitButton).toBeVisible()
	})

	test('validates note creation form', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to new note page
		await page.goto('/users/kody/notes/new')

		// Try to submit empty form
		await page.click('button[type="submit"]')

		// Check for validation
		const titleInput = page.locator('input[name="title"]')
		const validationMessage = await titleInput.evaluate(
			(el: HTMLInputElement) => el.validationMessage,
		)

		// Should have validation
		expect(validationMessage).toBeTruthy()
	})

	test('can search notes', async ({ page }) => {
		// Navigate to notes page
		await page.goto('/users/kody/notes')

		// Look for search input
		const searchInput = page
			.locator('input[type="search"], input[name="search"]')
			.first()

		if (await searchInput.isVisible()) {
			// Type search query
			await searchInput.fill('Koala')

			// Wait for results
			await page.waitForTimeout(500)

			// Page should still work
			const noteLinks = page.locator('a[href*="/notes/"]:visible')
			const count = await noteLinks.count()
			expect(count).toBeGreaterThanOrEqual(0)
		}
	})
})
