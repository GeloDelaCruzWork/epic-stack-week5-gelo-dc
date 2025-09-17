const { Builder, By } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const { expect } = require('chai')

async function runTest() {
	console.log('Starting Selenium test...')

	// Setup Chrome options
	const options = new chrome.Options()
	options.addArguments('--disable-dev-shm-usage')
	options.addArguments('--no-sandbox')

	// Create driver
	let driver

	try {
		console.log('Creating Chrome driver...')
		driver = await new Builder()
			.forBrowser('chrome')
			.setChromeOptions(options)
			.build()

		console.log('Navigating to application...')
		await driver.get('http://localhost:3000')

		// Wait for page to load
		await driver.sleep(2000)

		console.log('Getting page title...')
		const title = await driver.getTitle()
		console.log('Page title:', title)

		// Try to login
		console.log('Attempting to navigate to login page...')
		await driver.get('http://localhost:3000/login')
		await driver.sleep(1000)

		// Find username field
		console.log('Finding username field...')
		const usernameField = await driver.findElement(
			By.css('input[name="username"], input[type="email"]'),
		)
		await usernameField.sendKeys('kody')

		// Find password field
		console.log('Finding password field...')
		const passwordField = await driver.findElement(
			By.css('input[type="password"]'),
		)
		await passwordField.sendKeys('kodylovesyou')

		// Submit form
		console.log('Submitting login form...')
		const submitButton = await driver.findElement(
			By.css('button[type="submit"]'),
		)
		await submitButton.click()

		// Wait for navigation
		await driver.sleep(3000)

		// Check if logged in
		const currentUrl = await driver.getCurrentUrl()
		console.log('Current URL after login:', currentUrl)

		if (!currentUrl.includes('/login')) {
			console.log('✅ Login successful!')
		} else {
			console.log('❌ Login failed - still on login page')
		}

		// Navigate to notes
		console.log('Navigating to notes page...')
		await driver.get('http://localhost:3000/users/kody/notes')
		await driver.sleep(2000)

		// Check page content
		const bodyText = await driver.findElement(By.tagName('body')).getText()
		if (bodyText.toLowerCase().includes('note')) {
			console.log('✅ Notes page loaded successfully')
		} else {
			console.log('❌ Notes page may not have loaded correctly')
		}

		console.log('Test completed successfully!')
	} catch (error) {
		console.error('Test failed with error:', error.message)
		throw error
	} finally {
		if (driver) {
			console.log('Closing browser...')
			await driver.quit()
		}
	}
}

// Run the test
runTest().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
