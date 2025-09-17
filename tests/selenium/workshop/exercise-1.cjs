const { Builder, By, until } = require('selenium-webdriver')
const assert = require('assert')

async function testHomepage() {
	console.log('🚀 Exercise 1: Homepage Test')
	console.log('============================\n')

	const driver = await new Builder().forBrowser('chrome').build()

	try {
		// Navigate to homepage
		console.log('📍 Navigating to homepage...')
		await driver.get('http://localhost:3000/')

		// Verify page title
		console.log('📋 Checking page title...')
		const title = await driver.getTitle()
		assert(
			title.includes('Epic Notes'),
			`Title should contain "Epic Notes", got: ${title}`,
		)
		console.log(`  ✅ Title verified: "${title}"`)

		// Check login link is visible
		console.log('🔍 Looking for login link...')
		let loginLink
		try {
			// Try different selectors for login link
			loginLink = await driver.findElement(
				By.xpath(
					'//a[contains(text(), "Log") or contains(text(), "Sign") or @href="/login"]',
				),
			)
		} catch (e) {
			// Fallback to CSS selector
			loginLink = await driver.findElement(By.css('a[href="/login"]'))
		}
		const isVisible = await loginLink.isDisplayed()
		assert(isVisible, 'Login link should be visible')
		const linkText = await loginLink.getText()
		console.log(`  ✅ Login link is visible: "${linkText}"`)

		// Additional checks
		console.log('\n📊 Additional checks:')

		// Check for main heading
		try {
			const heading = await driver.findElement(By.css('h1'))
			const headingText = await heading.getText()
			console.log(`  ✅ Main heading found: "${headingText}"`)
		} catch (e) {
			console.log('  ℹ️ No h1 heading found')
		}

		// Check for navigation elements
		const navLinks = await driver.findElements(By.css('nav a, header a'))
		console.log(`  ✅ Found ${navLinks.length} navigation links`)

		// Check page loaded successfully
		const bodyText = await driver.findElement(By.tagName('body')).getText()
		assert(bodyText.length > 0, 'Page should have content')
		console.log('  ✅ Page content loaded successfully')

		console.log('\n✅ Exercise 1: Homepage test PASSED!\n')
	} catch (error) {
		console.error('\n❌ Test failed:', error.message)

		// Take screenshot for debugging
		try {
			const screenshot = await driver.takeScreenshot()
			const fs = require('fs')
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
			fs.writeFileSync(
				`exercise-1-error-${timestamp}.png`,
				screenshot,
				'base64',
			)
			console.log('📸 Error screenshot saved')
		} catch (e) {
			// Ignore screenshot errors
		}

		throw error
	} finally {
		await driver.quit()
		console.log('🏁 Browser closed')
	}
}

// Run the test
testHomepage().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
