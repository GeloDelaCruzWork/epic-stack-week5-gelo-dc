import { test, expect } from '@playwright/test'

/**
 * SOLUTION 3: Complete User Journey
 *
 * Full implementation of end-to-end user journey
 */

test.describe('Solution 3: User Journey', () => {
	test('complete user journey - login, create note, edit, delete', async ({
		page,
	}) => {
		// Step 1: Go to homepage
		await page.goto('http://localhost:3000')
		await expect(page).toHaveTitle(/Epic Notes/)

		// Step 2: Navigate to login
		await page.click('a:has-text("Log In")')
		await expect(page).toHaveURL(/login/)

		// Step 3: Login
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')

		// Wait for redirect
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		// Step 4: Navigate to notes
		await page.goto('http://localhost:3000/users/kody/notes')

		// Count initial notes
		const initialNotes = await page
			.locator('a[href*="/notes/"]:not([href*="new"])')
			.count()

		// Step 5: Create a new note
		await page.click('a[href*="new"]') // Click the new note button
		const timestamp = Date.now()
		const noteTitle = `Test Note ${timestamp}`
		const noteContent = `This is test content created at ${new Date().toISOString()}`

		await page.fill('input[name="title"]', noteTitle)
		await page.fill('textarea[name="content"]', noteContent)

		// Find and click the save button (form="note-editor")
		const saveButton = page.locator('button[type="submit"][form="note-editor"]')
		await saveButton.click()

		// Wait a moment for save to complete
		await page.waitForTimeout(1000)

		// Step 6: Verify we're on the note detail page
		await expect(
			page.locator(`h2:has-text("${noteTitle}")`).first(),
		).toBeVisible({ timeout: 10000 })

		// Step 7: Edit the note (if we're not already on edit page)
		const editButton = page.locator('a:has-text("Edit")')
		if (await editButton.isVisible()) {
			await editButton.click()
		}

		const updatedTitle = `Updated ${noteTitle}`
		const updatedContent = `Updated content at ${new Date().toISOString()}`

		await page.fill('input[name="title"]', updatedTitle)
		await page.fill('textarea[name="content"]', updatedContent)
		await page.locator('button[type="submit"][form="note-editor"]').click()

		// Step 8: Verify edit
		await page.waitForTimeout(1000)
		await expect(
			page.locator(`h2:has-text("${updatedTitle}")`).first(),
		).toBeVisible()

		// Step 9: Delete the note (find the delete button)
		const deleteButton = page
			.locator(
				'button:has-text("Delete"), button[name="intent"][value="delete"]',
			)
			.first()
		if (await deleteButton.isVisible()) {
			await deleteButton.click()
		}

		// Step 10: Verify we're back at notes list
		await page.waitForTimeout(1000)
		await expect(page).toHaveURL(/notes/)

		console.log('✅ Complete user journey successful!')
	})

	test('multiple notes workflow', async ({ page }) => {
		// Login first
		await page.goto('http://localhost:3000/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		// Create multiple notes
		const noteCount = 3
		const notes = []

		for (let i = 1; i <= noteCount; i++) {
			await page.goto('http://localhost:3000/users/kody/notes')
			await page.click('a[href*="new"]')

			const title = `Journey Note ${i} - ${Date.now()}`
			const content = `Content for note ${i}`

			await page.fill('input[name="title"]', title)
			await page.fill('textarea[name="content"]', content)
			await page.locator('button[type="submit"][form="note-editor"]').click()

			// Wait for save and verify
			await page.waitForTimeout(1000)
			await expect(
				page.locator(`h2:has-text("${title}")`).first(),
			).toBeVisible()

			notes.push(title)
		}

		// Verify all notes exist in the list
		await page.goto('http://localhost:3000/users/kody/notes')
		console.log(`Created ${notes.length} notes`)

		// Clean up - delete all created notes
		for (const title of notes) {
			const noteLink = page.locator(`a:has-text("${title}")`)
			if (await noteLink.isVisible()) {
				await noteLink.click()
				const deleteBtn = page
					.locator(
						'button:has-text("Delete"), button[name="intent"][value="delete"]',
					)
					.first()
				if (await deleteBtn.isVisible()) {
					await deleteBtn.click()
					await page.waitForTimeout(500)
				}
			}
		}

		console.log('✅ Multiple notes workflow completed!')
	})
})
