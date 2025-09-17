import { test, expect } from '@playwright/test'

/**
 * EXERCISE 7: Visual Testing & Screenshots
 *
 * Visual regression testing that's impossible in Selenium without external tools!
 * Playwright has everything built-in.
 *
 * TASK: Implement visual testing and screenshot comparison
 * TIME: 25 minutes (would take hours to setup in Selenium)
 *
 * ADVANTAGES:
 * - Built-in screenshot comparison
 * - Automatic baseline generation
 * - Cross-browser visual testing
 * - Element-level screenshots
 * - PDF generation capabilities
 * - Full page screenshots with auto-scrolling
 */

test.describe('Exercise 7: Visual Testing', () => {
	// TODO 1: Basic screenshot capture
	test('capture homepage screenshot', async ({ page }) => {
		// await page.goto('http://localhost:3000')

		// TODO 2: Take a full page screenshot
		// await page.screenshot({
		//   path: 'tests/playwright-workshop/screenshots/homepage.png',
		//   fullPage: true
		// })

		// TODO 3: Take element-specific screenshot
		// const header = page.locator('header')
		// await header.screenshot({ path: 'tests/playwright-workshop/screenshots/header.png' })

		console.log('📸 Screenshots captured!')
	})

	// TODO 4: Visual regression testing
	test('visual regression test', async ({ page }) => {
		// await page.goto('http://localhost:3000')
		// TODO 5: Use toHaveScreenshot for automatic comparison
		// This will:
		// 1. Create baseline on first run
		// 2. Compare against baseline on subsequent runs
		// 3. Fail if differences exceed threshold
		// await expect(page).toHaveScreenshot('homepage-baseline.png', {
		//   maxDiffPixels: 100,
		//   threshold: 0.2 // 20% difference threshold
		// })
		// TODO 6: Test specific component visual regression
		// const loginForm = page.locator('#login-form')
		// await expect(loginForm).toHaveScreenshot('login-form.png')
	})

	// TODO 7: Cross-browser visual testing
	test('cross-browser visual consistency', async ({ page, browserName }) => {
		// await page.goto('http://localhost:3000/login')
		// TODO 8: Take browser-specific screenshots
		// await page.screenshot({
		//   path: `tests/playwright-workshop/screenshots/login-${browserName}.png`,
		//   fullPage: true
		// })
		// TODO 9: Compare against browser-specific baselines
		// await expect(page).toHaveScreenshot(`login-baseline-${browserName}.png`)
	})

	// TODO 10: Advanced visual testing scenarios
	test('visual testing with animations disabled', async ({ page }) => {
		// TODO 11: Disable animations for consistent screenshots
		// await page.addStyleTag({
		//   content: `
		//     *, *::before, *::after {
		//       animation-duration: 0s !important;
		//       animation-delay: 0s !important;
		//       transition-duration: 0s !important;
		//       transition-delay: 0s !important;
		//     }
		//   `
		// })
		// await page.goto('http://localhost:3000')
		// await expect(page).toHaveScreenshot('no-animations.png')
	})

	// TODO 12: Mobile viewport screenshots
	test('responsive design visual testing', async ({ page }) => {
		// const viewports = [
		//   { width: 375, height: 667, name: 'iphone' },
		//   { width: 768, height: 1024, name: 'ipad' },
		//   { width: 1920, height: 1080, name: 'desktop' }
		// ]
		// for (const viewport of viewports) {
		//   await page.setViewportSize({ width: viewport.width, height: viewport.height })
		//   await page.goto('http://localhost:3000')
		//   await page.screenshot({
		//     path: `tests/playwright-workshop/screenshots/homepage-${viewport.name}.png`,
		//     fullPage: true
		//   })
		// }
	})

	// TODO 13: PDF generation (Chromium only)
	test('generate PDF report', async ({ page, browserName }) => {
		// test.skip(browserName !== 'chromium', 'PDF generation only works in Chromium')
		// await page.goto('http://localhost:3000/users/kody/notes')
		// await page.pdf({
		//   path: 'tests/playwright-workshop/reports/notes.pdf',
		//   format: 'A4',
		//   printBackground: true
		// })
	})

	// TODO 14: Visual testing with masks
	test('visual testing with dynamic content masked', async ({ page }) => {
		// await page.goto('http://localhost:3000')
		// Mask dynamic content like timestamps
		// await expect(page).toHaveScreenshot('masked-homepage.png', {
		//   mask: [page.locator('.timestamp'), page.locator('.dynamic-content')],
		//   maskColor: '#FF00FF'
		// })
	})
})

/**
 * SELENIUM COMPARISON:
 *
 * Visual Testing in Selenium requires:
 * - Percy ($599/month), Applitools ($$$), or BackstopJS (complex)
 * - 2-4 hours of setup and configuration
 * - Multiple dependencies and tools
 * - Separate test runs for visual tests
 * - Complex CI/CD integration
 * - Manual baseline management
 *
 * Playwright provides everything built-in and FREE:
 * - Zero setup visual regression testing
 * - Automatic baseline management
 * - Cross-browser visual testing
 * - Built-in diff viewer
 * - GitHub Actions integration
 * - PDF generation
 * - Multiple screenshot formats
 *
 * Cost savings: $7,200/year (Percy subscription)
 * Time savings: 4 hours setup + 2 hours/month maintenance
 *
 * REAL WORLD EXAMPLE:
 * Company X was paying $1,200/month for Applitools
 * Switched to Playwright's built-in visual testing
 * Result: $14,400 annual savings, better integration
 */
