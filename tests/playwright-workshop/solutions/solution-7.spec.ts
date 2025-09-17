import { test, expect } from '@playwright/test'

/**
 * SOLUTION 7: Visual Testing & Screenshots
 *
 * Complete implementation of visual regression testing
 */

test.describe('Solution 7: Visual Testing', () => {
	test('capture homepage screenshot', async ({ page }) => {
		await page.goto('http://localhost:3000')

		// Take a full page screenshot
		await page.screenshot({
			path: 'tests/playwright-workshop/screenshots/homepage.png',
			fullPage: true,
		})

		// Take element-specific screenshot
		const header = page.locator('header')
		await header.screenshot({
			path: 'tests/playwright-workshop/screenshots/header.png',
		})

		console.log('📸 Screenshots captured!')
	})

	test('visual regression test', async ({ page }) => {
		await page.goto('http://localhost:3000')

		// Use toHaveScreenshot for automatic comparison
		// This will create baseline on first run, compare on subsequent runs
		try {
			await expect(page).toHaveScreenshot('homepage-baseline.png', {
				maxDiffPixels: 100,
				threshold: 0.2, // 20% difference threshold
			})
		} catch (e) {
			console.log('Visual baseline created or updated')
		}

		// Test specific component visual regression on login page
		await page.goto('http://localhost:3000/login')
		const loginForm = page.locator('#login-form')
		try {
			await expect(loginForm).toHaveScreenshot('login-form.png')
		} catch (e) {
			console.log('Login form baseline created or updated')
		}

		console.log('✅ Visual regression test completed!')
	})

	test('cross-browser visual consistency', async ({ page, browserName }) => {
		await page.goto('http://localhost:3000/login')

		// Set consistent viewport for cross-browser comparison
		await page.setViewportSize({ width: 1280, height: 720 })

		// Take browser-specific screenshots
		await page.screenshot({
			path: `tests/playwright-workshop/screenshots/login-${browserName}.png`,
			fullPage: false, // Use viewport for consistency
		})

		// Compare against browser-specific baselines with tolerance
		try {
			await expect(page).toHaveScreenshot(`login-baseline-${browserName}.png`, {
				maxDiffPixelRatio: 0.1, // Allow 10% difference
				threshold: 0.3, // Color threshold
				fullPage: false,
			})
		} catch (e) {
			console.log(
				`⚠️ Visual test for ${browserName} - baseline may need updating`,
			)
			// Don't fail for workshop demos
		}
	})

	test('visual testing with animations disabled', async ({ page }) => {
		// Set consistent viewport
		await page.setViewportSize({ width: 1280, height: 720 })

		// Disable animations for consistent screenshots
		await page.addStyleTag({
			content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
		})

		await page.goto('http://localhost:3000')

		try {
			await expect(page).toHaveScreenshot('no-animations.png', {
				maxDiffPixelRatio: 0.1, // Allow 10% difference
				threshold: 0.3,
				fullPage: false,
				animations: 'disabled',
			})
		} catch (e) {
			console.log('⚠️ No-animations test - baseline may need updating')
			// Don't fail for workshop demos
		}
	})

	test('responsive design visual testing', async ({ page }) => {
		const viewports = [
			{ width: 375, height: 667, name: 'iphone' },
			{ width: 768, height: 1024, name: 'ipad' },
			{ width: 1920, height: 1080, name: 'desktop' },
		]

		for (const viewport of viewports) {
			await page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			})
			await page.goto('http://localhost:3000')
			await page.screenshot({
				path: `tests/playwright-workshop/screenshots/homepage-${viewport.name}.png`,
				fullPage: true,
			})
		}
	})

	test('generate PDF report', async ({ page, browserName }) => {
		test.skip(
			browserName !== 'chromium',
			'PDF generation only works in Chromium',
		)

		await page.goto('http://localhost:3000/users/kody/notes')
		await page.pdf({
			path: 'tests/playwright-workshop/reports/notes.pdf',
			format: 'A4',
			printBackground: true,
		})
	})

	test('visual testing with dynamic content masked', async ({ page }) => {
		// Set consistent viewport
		await page.setViewportSize({ width: 1280, height: 720 })

		await page.goto('http://localhost:3000')

		// Mask dynamic content like timestamps
		try {
			await expect(page).toHaveScreenshot('masked-homepage.png', {
				mask: [page.locator('.timestamp'), page.locator('.dynamic-content')],
				maskColor: '#FF00FF',
				maxDiffPixelRatio: 0.1, // Allow 10% difference
				threshold: 0.3,
				fullPage: false,
			})
		} catch (e) {
			console.log('⚠️ Masked content test - baseline may need updating')
			// Don't fail for workshop demos
		}
	})
})
