import { test, expect } from '@playwright/test'

/**
 * EXERCISE 3: Complete User Journey
 *
 * Playwright equivalent of Selenium's Exercise 3
 * Complete user flow: Login → Create Note → Edit → Delete
 *
 * TASK: Implement the complete user journey
 * TIME: 30 minutes (vs 60 minutes for Selenium)
 *
 * ADVANTAGES:
 * - Page object fixtures
 * - Better navigation handling
 * - Session persistence
 * - Parallel execution capability
 */

test.describe('Exercise 3: User Journey', () => {
	// Helper function for login (you'll implement this)
	async function login(page) {
		// TODO 1: Implement login helper
		// await page.goto('http://localhost:3000/login')
		// await page.fill('#login-form-username', 'kody')
		// await page.fill('#login-form-password', 'kodylovesyou')
		// await page.click('button:has-text("Log in")')
		// await page.waitForURL(url => !url.includes('/login'))
	}

	test('complete note lifecycle', async ({ page }) => {
		// Step 1: Login
		console.log('Step 1: Logging in...')
		// TODO 2: Call the login helper
		// await login(page)

		// Step 2: Navigate to notes
		console.log('Step 2: Navigating to notes...')
		// TODO 3: Go to notes page
		// await page.goto('http://localhost:3000/users/kody/notes')

		// Step 3: Create a new note
		console.log('Step 3: Creating a new note...')
		// TODO 4: Navigate to new note page
		// await page.goto('http://localhost:3000/users/kody/notes/new')

		// TODO 5: Fill in note details
		// await page.fill('input[name="title"]', 'Playwright Workshop Note')
		// await page.fill('textarea[name="content"]', 'This note was created in the Playwright workshop!')

		// TODO 6: Submit the form
		// await page.click('button[type="submit"]')

		// Step 4: Verify note was created
		console.log('Step 4: Verifying note creation...')
		// TODO 7: Navigate back to notes list and verify
		// await page.goto('http://localhost:3000/users/kody/notes')
		// await expect(page.locator('text=Playwright Workshop Note')).toBeVisible()

		// Step 5: Edit the note
		console.log('Step 5: Editing the note...')
		// TODO 8: Click on the note to view it
		// await page.click('text=Playwright Workshop Note')

		// TODO 9: Click edit button (if exists)
		// const editButton = page.locator('a:has-text("Edit"), button:has-text("Edit")').first()
		// if (await editButton.isVisible()) {
		//   await editButton.click()
		//   await page.fill('input[name="title"]', 'Updated Playwright Note')
		//   await page.click('button[type="submit"]')
		// }

		// Step 6: Delete the note
		console.log('Step 6: Deleting the note...')
		// TODO 10: Delete the note
		// Implement deletion logic

		console.log('✅ User journey completed!')
	})

	// BONUS: Test with multiple notes
	test.skip('should handle multiple notes', async ({ page }) => {
		// TODO: Create multiple notes and manage them
	})
})

/**
 * SELENIUM COMPARISON:
 *
 * Session Management:
 * Selenium: Complex cookie/session handling
 * Playwright: Automatic with context persistence
 *
 * Navigation:
 * Selenium: driver.navigate().to() with explicit waits
 * Playwright: page.goto() with auto-waiting
 *
 * Form Interaction:
 * Selenium: findElement + sendKeys + submit
 * Playwright: page.fill() + page.click()
 *
 * Performance:
 * Selenium: ~30-45 seconds for full journey
 * Playwright: ~10-15 seconds (3x faster!)
 */
