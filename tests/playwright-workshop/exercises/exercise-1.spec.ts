import { test, expect } from '@playwright/test'

/**
 * EXERCISE 1: Your First Playwright Test
 *
 * This is the Playwright equivalent of Selenium's Exercise 1
 * Notice how much cleaner and simpler the code is!
 *
 * TASK: Complete the TODOs to make the test pass
 * TIME: 20 minutes (vs 45 minutes for Selenium)
 *
 * ADVANTAGES OVER SELENIUM:
 * - No driver setup needed
 * - Auto-waiting for elements
 * - Better assertions with expect()
 * - Cleaner async/await syntax
 */

test.describe('Exercise 1: Homepage Test', () => {
	test('should verify homepage loads correctly', async ({ page }) => {
		console.log('🚀 Exercise 1: Homepage Test (Playwright Version)')
		console.log('================================================\n')

		// TODO 1: Navigate to the homepage
		// HINT: Use page.goto('http://localhost:3000/')
		// await page.goto(...)

		// TODO 2: Verify the page title contains "Epic Notes"
		// HINT: Use expect(page).toHaveTitle(/Epic Notes/)
		// await expect(page).toHaveTitle(...)

		// TODO 3: Check that the login link is visible
		// HINT: Use page.locator('text=Log In') or page.getByRole('link', { name: 'Log In' })
		// const loginLink = page.locator(...)
		// await expect(loginLink).toBeVisible()

		// TODO 4: Take a screenshot (Bonus!)
		// HINT: Use page.screenshot({ path: 'homepage.png' })
		// await page.screenshot(...)

		console.log('✅ Exercise 1: Homepage test completed!')
	})

	// BONUS TEST: Add another test that checks for navigation elements
	test.skip('should have navigation elements', async ({ page }) => {
		// TODO: Write a test that verifies navigation elements exist
		// - Check for header
		// - Check for footer
		// - Count navigation links
	})
})

/**
 * COMPARISON WITH SELENIUM:
 *
 * Selenium version (exercise-1.cjs):
 * - 84 lines of code
 * - Manual driver setup
 * - Try-catch blocks everywhere
 * - Manual waits and assertions
 *
 * Playwright version:
 * - 30-40 lines of code
 * - No setup needed
 * - Built-in error handling
 * - Auto-waiting and retry
 *
 * PERFORMANCE:
 * - Selenium: ~3-5 seconds
 * - Playwright: ~1-2 seconds
 * - 60% faster!
 */
