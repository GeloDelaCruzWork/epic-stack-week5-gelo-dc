import { test, expect } from '@playwright/test'

/**
 * EXERCISE 5: Advanced Playwright Features
 *
 * Learn Playwright's advanced features that Selenium doesn't have
 *
 * TASK: Use advanced features like network mocking, screenshots, and mobile testing
 * TIME: 20 minutes (impossible in Selenium without external tools!)
 */

test.describe('Exercise 5: Advanced Features', () => {
	test('network interception and mocking', async ({ page }) => {
		// TODO 1: Mock API responses
		// await page.route('**/api/notes', async route => {
		//   await route.fulfill({
		//     status: 200,
		//     body: JSON.stringify([
		//       { id: 1, title: 'Mocked Note', content: 'This is mocked!' }
		//     ])
		//   })
		// })
		// TODO 2: Navigate and verify mocked data
		// await page.goto('http://localhost:3000/users/kody/notes')
		// await expect(page.locator('text=Mocked Note')).toBeVisible()
	})

	test('visual regression testing', async ({ page }) => {
		// TODO 3: Take screenshots for comparison
		// await page.goto('http://localhost:3000')
		// await expect(page).toHaveScreenshot('homepage.png')
		// This will fail the first time (creating baseline)
		// Then pass on subsequent runs if nothing changed!
	})

	test('mobile viewport testing', async ({ page }) => {
		// TODO 4: Set mobile viewport
		// await page.setViewportSize({ width: 375, height: 667 }) // iPhone size
		// TODO 5: Test mobile responsiveness
		// await page.goto('http://localhost:3000')
		// Check if mobile menu appears, desktop menu hidden, etc.
	})

	test('accessibility testing', async ({ page }) => {
		// TODO 6: Check accessibility
		// await page.goto('http://localhost:3000')
		// const accessibilitySnapshot = await page.accessibility.snapshot()
		// console.log(accessibilitySnapshot)
	})

	test('performance metrics', async ({ page }) => {
		// TODO 7: Measure performance
		// await page.goto('http://localhost:3000')
		// const metrics = await page.evaluate(() => JSON.stringify(window.performance.timing))
		// console.log('Performance metrics:', metrics)
	})
})

/**
 * SELENIUM LIMITATIONS:
 *
 * Network Mocking: Requires BrowserMob Proxy or similar
 * Visual Testing: Requires additional libraries
 * Mobile Testing: Requires Appium or mobile drivers
 * Accessibility: No built-in support
 * Performance: Limited metrics available
 *
 * PLAYWRIGHT ADVANTAGES:
 * All features built-in, no external dependencies!
 */
