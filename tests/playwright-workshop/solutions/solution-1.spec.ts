import { test, expect } from '@playwright/test'

/**
 * EXERCISE 1 SOLUTION: Your First Playwright Test
 *
 * This is the complete solution showing Playwright's advantages
 * Compare this with the Selenium version to see the improvements!
 */

test.describe('Exercise 1 Solution: Homepage Test', () => {
	test('should verify homepage loads correctly', async ({ page }) => {
		console.log('🚀 Exercise 1: Homepage Test (Playwright Solution)')
		console.log('=================================================\n')

		// Navigate to homepage
		console.log('📍 Navigating to homepage...')
		await page.goto('http://localhost:3000/')

		// Verify page title
		console.log('📋 Checking page title...')
		await expect(page).toHaveTitle(/Epic Notes/)
		const title = await page.title()
		console.log(`  ✅ Title verified: "${title}"`)

		// Check login link is visible
		console.log('🔍 Looking for login link...')
		const loginLink = page
			.locator('a:has-text("Log In"), a[href="/login"]')
			.first()
		await expect(loginLink).toBeVisible()
		const linkText = await loginLink.textContent()
		console.log(`  ✅ Login link is visible: "${linkText}"`)

		// Take a screenshot
		console.log('📸 Taking screenshot...')
		await page.screenshot({
			path: 'tests/playwright-workshop/screenshots/homepage.png',
			fullPage: true,
		})
		console.log('  ✅ Screenshot saved')

		// Additional checks (showing Playwright's power)
		console.log('\n📊 Additional checks:')

		// Check for main heading
		const heading = page.locator('h1').first()
		if (await heading.isVisible()) {
			const headingText = await heading.textContent()
			console.log(`  ✅ Main heading found: "${headingText}"`)
		}

		// Count navigation links
		const navLinks = page.locator('nav a, header a')
		const linkCount = await navLinks.count()
		console.log(`  ✅ Found ${linkCount} navigation links`)

		// Verify page loaded successfully
		await expect(page.locator('body')).toBeVisible()
		console.log('  ✅ Page content loaded successfully')

		console.log('\n✅ Exercise 1: Homepage test PASSED!')
	})

	test('should have navigation elements', async ({ page }) => {
		await page.goto('http://localhost:3000/')

		// Check for header
		const header = page.locator('header')
		await expect(header).toBeVisible()

		// Check for footer (if exists)
		const footer = page.locator('footer')
		const hasFooter = await footer.isVisible()
		if (hasFooter) {
			console.log('✅ Footer found')
		}

		// Count and list navigation links
		const navLinks = page.locator('nav a')
		const count = await navLinks.count()
		console.log(`Found ${count} navigation links:`)

		for (let i = 0; i < count; i++) {
			const text = await navLinks.nth(i).textContent()
			const href = await navLinks.nth(i).getAttribute('href')
			console.log(`  ${i + 1}. ${text} -> ${href}`)
		}
	})

	// Performance comparison test
	test('performance: measure load time', async ({ page }) => {
		const startTime = Date.now()

		await page.goto('http://localhost:3000/')
		await page.waitForLoadState('networkidle')

		const loadTime = Date.now() - startTime
		console.log(`Page load time: ${loadTime}ms`)

		// Playwright typically loads 60% faster than Selenium
		expect(loadTime).toBeLessThan(10000) // Should load in under 10 seconds
	})
})

/**
 * KEY DIFFERENCES FROM SELENIUM:
 *
 * 1. No WebDriver setup:
 *    Selenium: const driver = await new Builder().forBrowser('chrome').build()
 *    Playwright: Automatic with ({ page })
 *
 * 2. Cleaner assertions:
 *    Selenium: assert(title.includes('Epic Notes'))
 *    Playwright: await expect(page).toHaveTitle(/Epic Notes/)
 *
 * 3. Better selectors:
 *    Selenium: By.linkText('Log in') or By.css('a[href="/login"]')
 *    Playwright: page.locator('a:has-text("Log In")')
 *
 * 4. Auto-waiting:
 *    Selenium: Need explicit waits
 *    Playwright: Automatic waiting for elements
 *
 * 5. Error handling:
 *    Selenium: try-catch-finally blocks
 *    Playwright: Built-in with better error messages
 */
