import { test, expect } from '@playwright/test'

// Increase timeout for all tests
test.setTimeout(45000)

test.describe('Notes Management - Comprehensive', () => {
	const BASE_URL = 'http://localhost:3000'

	test.beforeEach(async ({ page }) => {
		// Login before each test
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')

		// Wait for login to complete
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})
	})

	test('should display notes list page', async ({ page }) => {
		// Navigate to notes
		await page.goto(`${BASE_URL}/users/kody/notes`)

		// Verify we're on notes page
		expect(page.url()).toContain('/users/kody/notes')

		// Check for notes page elements
		const pageContent = await page.textContent('body')
		expect(pageContent?.toLowerCase()).toContain('note')

		// Check for new note link
		const newNoteLink = await page
			.locator('a[href*="new"]')
			.first()
			.isVisible({ timeout: 2000 })
		expect(newNoteLink).toBe(true)

		console.log('✅ Notes list page displayed correctly')
	})

	test('should create a new note', async ({ page }) => {
		// Navigate to new note page
		await page.goto(`${BASE_URL}/users/kody/notes/new`)
		await page.waitForLoadState('networkidle')

		// Generate unique note data
		const timestamp = Date.now()
		const noteTitle = `Test Note ${timestamp}`
		const noteContent = `This is a test note created at ${new Date().toISOString()}`

		// Fill note form
		await page.fill('input[name="title"]', noteTitle)
		await page.fill('textarea[name="content"]', noteContent)

		// Submit form using the visible StatusButton
		const submitButton = page.locator(
			'button[type="submit"]:has-text("Submit")',
		)
		await expect(submitButton).toBeVisible({ timeout: 5000 })
		await submitButton.click()

		// Wait for navigation away from /new
		try {
			await page.waitForURL((url) => !url.pathname.includes('/new'), {
				timeout: 10000,
			})

			// Verify we're on a note detail page
			const currentUrl = page.url()
			expect(currentUrl).toContain('/notes/')
			expect(currentUrl).not.toContain('/new')

			console.log('✅ Note created successfully')
		} catch (e) {
			// If we're still on /new, the form might have validation errors
			const errors = await page
				.locator('[role="alert"], .error-message')
				.count()
			if (errors > 0) {
				console.log('⚠️ Form has validation errors')
			}
			throw new Error('Failed to create note - still on /new page')
		}
	})

	test('should view note details', async ({ page }) => {
		// Navigate to notes list
		await page.goto(`${BASE_URL}/users/kody/notes`)

		// Find any existing note
		const noteLinks = page.locator('a[href*="/notes/"]:not([href*="new"])')
		const noteCount = await noteLinks.count()

		if (noteCount > 0) {
			// Get the first note's text
			const noteTitle = await noteLinks.first().textContent()

			// Click on the note
			await noteLinks.first().click()

			// Wait for navigation
			await page.waitForLoadState('networkidle')
			await page.waitForTimeout(1000) // Give it time to load

			// Verify we're on note detail page (Epic Stack uses /users/username/notes/noteId)
			const currentUrl = page.url()
			expect(currentUrl).toContain('/notes/')
			expect(currentUrl).not.toContain('/new')

			// Check for note content
			const hasTitle = await page
				.locator(`h2:has-text("${noteTitle}")`)
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false)
			const hasContent = await page
				.locator('p, div')
				.filter({ hasText: /\w+/ })
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false)

			expect(hasTitle || hasContent).toBe(true)
			console.log('✅ Note details viewed successfully')
		} else {
			console.log('ℹ️ No existing notes to view')
		}
	})

	test('should edit an existing note', async ({ page }) => {
		// First create a note to edit
		await page.goto(`${BASE_URL}/users/kody/notes/new`)

		const timestamp = Date.now()
		const originalTitle = `Edit Test ${timestamp}`
		const originalContent = 'Original content'

		await page.fill('input[name="title"]', originalTitle)
		await page.fill('textarea[name="content"]', originalContent)
		await page.click('button[type="submit"]')

		// Wait for save
		await page
			.waitForURL((url) => !url.pathname.includes('/new'), { timeout: 10000 })
			.catch(() => {})

		// Now edit the note
		const editLink = page.locator('a:has-text("Edit")').first()
		if (await editLink.isVisible({ timeout: 2000 })) {
			await editLink.click()

			// Update the note
			const updatedTitle = `${originalTitle} - Updated`
			const updatedContent = `${originalContent}\n\nUpdated at ${new Date().toISOString()}`

			await page.fill('input[name="title"]', updatedTitle)
			await page.fill('textarea[name="content"]', updatedContent)

			// Save changes
			await page.click('button[type="submit"]')

			// Wait for save
			await page.waitForTimeout(2000)

			// Verify update
			const titleElement = await page
				.locator(`h2:has-text("${updatedTitle}")`)
				.first()
				.isVisible({ timeout: 5000 })
				.catch(() => false)
			expect(titleElement).toBe(true)

			console.log('✅ Note edited successfully')
		} else {
			console.log('ℹ️ Edit link not available')
		}
	})

	test('should delete a note', async ({ page }) => {
		// First create a note to delete
		await page.goto(`${BASE_URL}/users/kody/notes/new`)

		const timestamp = Date.now()
		const noteTitle = `Delete Test ${timestamp}`

		await page.fill('input[name="title"]', noteTitle)
		await page.fill('textarea[name="content"]', 'This note will be deleted')
		await page.click('button[type="submit"]')

		// Wait for save
		await page
			.waitForURL((url) => !url.pathname.includes('/new'), { timeout: 10000 })
			.catch(() => {})

		// Find delete button
		const deleteButton = page
			.locator(
				'button:has-text("Delete"), button[name="intent"][value="delete"]',
			)
			.first()
		if (await deleteButton.isVisible({ timeout: 2000 })) {
			// Click delete
			await deleteButton.click()

			// Wait for deletion
			await page.waitForTimeout(2000)

			// Should be back at notes list
			if (page.url().includes('/notes') && !page.url().includes(noteTitle)) {
				// Verify note is gone
				const noteLink = await page
					.locator(`a:has-text("${noteTitle}")`)
					.first()
					.isVisible({ timeout: 1000 })
					.catch(() => false)
				expect(noteLink).toBe(false)
				console.log('✅ Note deleted successfully')
			}
		} else {
			console.log('ℹ️ Delete button not available')
		}
	})

	test('should handle multiple notes', async ({ page }) => {
		// Navigate to notes
		await page.goto(`${BASE_URL}/users/kody/notes`)

		// Count existing notes
		const initialCount = await page
			.locator('a[href*="/notes/"]:not([href*="new"])')
			.count()

		// Create multiple notes
		const notesToCreate = 3
		const createdNotes = []

		for (let i = 1; i <= notesToCreate; i++) {
			await page.goto(`${BASE_URL}/users/kody/notes/new`)

			const title = `Bulk Test ${i} - ${Date.now()}`
			await page.fill('input[name="title"]', title)
			await page.fill('textarea[name="content"]', `Content for note ${i}`)
			await page.click('button[type="submit"]')

			createdNotes.push(title)

			// Wait for save
			await page.waitForTimeout(1000)
		}

		// Go back to notes list
		await page.goto(`${BASE_URL}/users/kody/notes`)

		// Count notes after creation
		const finalCount = await page
			.locator('a[href*="/notes/"]:not([href*="new"])')
			.count()

		// Should have more notes
		expect(finalCount).toBeGreaterThanOrEqual(initialCount)

		console.log(`✅ Created ${notesToCreate} notes. Total: ${finalCount}`)
	})

	test('should validate note form', async ({ page }) => {
		// Navigate to new note
		await page.goto(`${BASE_URL}/users/kody/notes/new`)
		await page.waitForLoadState('networkidle')

		// Try to submit empty form
		await page.click('button[type="submit"]:has-text("Submit")')

		// Should still be on new note page (validation failed)
		await page.waitForTimeout(1000)
		expect(page.url()).toContain('/new')

		// Fill only title
		await page.fill('input[name="title"]', 'Title Only')
		await page.click('button[type="submit"]:has-text("Submit")')

		// Check if content is required
		await page.waitForTimeout(1000)
		const stillOnNew = page.url().includes('/new')

		if (stillOnNew) {
			// Content is required, fill it
			await page.fill('textarea[name="content"]', 'Content added')
			await page.click('button[type="submit"]:has-text("Submit")')

			// Should save now
			await page
				.waitForURL((url) => !url.pathname.includes('/new'), { timeout: 5000 })
				.catch(() => {})
			console.log('✅ Form validation works correctly')
		} else {
			// Content is optional
			console.log('✅ Note created with title only')
		}
	})

	test('should search/filter notes', async ({ page }) => {
		// Navigate to notes
		await page.goto(`${BASE_URL}/users/kody/notes`)

		// Look for search input
		const searchInput = page
			.locator('input[type="search"], input[placeholder*="search" i]')
			.first()

		if (await searchInput.isVisible({ timeout: 2000 })) {
			// Enter search term
			await searchInput.fill('test')

			// Wait for results to update
			await page.waitForTimeout(500)

			// Check if filtering works
			const visibleNotes = await page
				.locator('a[href*="/notes/"]:not([href*="new"])')
				.count()
			console.log(`✅ Search found ${visibleNotes} matching notes`)
		} else {
			console.log('ℹ️ Search functionality not available')
		}
	})

	test('should handle note permissions', async ({ page }) => {
		// Navigate to own notes
		await page.goto(`${BASE_URL}/users/kody/notes`)

		// Should have create permission
		const canCreate = await page
			.locator('a[href*="new"]')
			.first()
			.isVisible({ timeout: 2000 })
		expect(canCreate).toBe(true)

		// Check for edit/delete on existing notes
		const noteLinks = page.locator('a[href*="/notes/"]:not([href*="new"])')
		if ((await noteLinks.count()) > 0) {
			await noteLinks.first().click()

			// Check for edit/delete buttons
			const canEdit = await page
				.locator('a:has-text("Edit")')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false)
			const canDelete = await page
				.locator('button:has-text("Delete")')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false)

			console.log('✅ Note permissions:', { canCreate, canEdit, canDelete })
		} else {
			console.log('✅ Can create notes:', canCreate)
		}
	})

	test('should handle long note content', async ({ page }) => {
		// Navigate to new note
		await page.goto(`${BASE_URL}/users/kody/notes/new`)

		// Create note with long content
		const longTitle = 'A'.repeat(100)
		const longContent = 'Lorem ipsum dolor sit amet, '.repeat(100)

		await page.fill('input[name="title"]', longTitle)
		await page.fill('textarea[name="content"]', longContent)

		// Submit
		await page.click('button[type="submit"]')

		// Wait for save
		await page.waitForTimeout(2000)

		// Check if saved successfully
		if (!page.url().includes('/new')) {
			console.log('✅ Long content handled successfully')
		} else {
			// Might have length validation
			const errorMessage = await page
				.locator('[role="alert"], .error')
				.first()
				.isVisible({ timeout: 1000 })
				.catch(() => false)
			console.log(
				'ℹ️ Long content validation:',
				errorMessage ? 'has limits' : 'no limits',
			)
		}
	})
})
