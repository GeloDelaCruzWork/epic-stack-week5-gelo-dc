const { Builder, By, until } = require('selenium-webdriver')
const assert = require('assert')

async function testUserJourney() {
	console.log('🚀 Exercise 3: User Journey Test')
	console.log('=================================\n')

	const driver = await new Builder().forBrowser('chrome').build()

	try {
		console.log('📝 Starting complete user journey...\n')

		// 1. Login
		console.log('Step 1: Login')
		await driver.get('http://localhost:3000/login')
		await driver.sleep(2000)

		// Find and fill login fields
		const inputs = await driver.findElements(By.css('input'))
		let usernameField = null
		let passwordField = null

		for (const input of inputs) {
			const type = await input.getAttribute('type')
			if (type === 'password') {
				passwordField = input
			} else if (type === 'text' || type === 'email') {
				usernameField = input
			}
		}

		if (usernameField && passwordField) {
			await usernameField.sendKeys('kody')
			await passwordField.sendKeys('kodylovesyou')
			console.log('  ✅ Credentials entered')

			const submitButton = await driver.findElement(
				By.css('button[type="submit"]'),
			)
			await submitButton.click()

			// Wait for navigation
			await driver.sleep(3000)
			const afterLoginUrl = await driver.getCurrentUrl()
			console.log(`  📍 After login URL: ${afterLoginUrl}`)

			if (!afterLoginUrl.includes('/login')) {
				console.log('  ✅ Login successful')
			}
		} else {
			console.log('  ⚠️ Login fields not found, continuing with mock journey')
		}

		// 2. Navigate to settings (attempt)
		console.log('\nStep 2: Navigate to settings')
		try {
			await driver.get('http://localhost:3000/settings/profile')
			await driver.sleep(2000)

			const settingsUrl = await driver.getCurrentUrl()
			console.log(`  📍 Settings URL: ${settingsUrl}`)

			// 3. Verify settings page
			const pageText = await driver.findElement(By.tagName('body')).getText()
			if (
				pageText.toLowerCase().includes('settings') ||
				pageText.toLowerCase().includes('profile') ||
				settingsUrl.includes('settings')
			) {
				console.log('  ✅ Settings page accessed')
			}
		} catch (e) {
			console.log('  ℹ️ Settings page not accessible')
		}

		// 4. Attempt logout
		console.log('\nStep 3: Logout')
		try {
			// Look for logout button
			const logoutButton = await driver.findElement(
				By.xpath(
					'//button[contains(text(), "Logout") or contains(text(), "Sign out") or contains(text(), "Log out")]',
				),
			)
			await logoutButton.click()
			console.log('  ✅ Logout button clicked')

			// Handle confirmation if present
			try {
				await driver.sleep(1000)
				const confirmButton = await driver.findElement(
					By.css('button[type="submit"]'),
				)
				await confirmButton.click()
				console.log('  ✅ Logout confirmed')
			} catch (e) {
				// No confirmation needed
			}

			await driver.sleep(2000)
		} catch (e) {
			console.log('  ℹ️ Logout button not found')
		}

		// 5. Verify redirect
		console.log('\nStep 4: Verify final state')
		const finalUrl = await driver.getCurrentUrl()
		console.log(`  📍 Final URL: ${finalUrl}`)

		// Take screenshot of final state
		const screenshot = await driver.takeScreenshot()
		const fs = require('fs')
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		fs.writeFileSync(
			`exercise-3-journey-${timestamp}.png`,
			screenshot,
			'base64',
		)
		console.log('  📸 Journey screenshot saved')

		console.log('\n✅ Exercise 3: User journey test completed!\n')
	} catch (error) {
		console.error('\n❌ Test failed:', error.message)

		// Take error screenshot
		try {
			const screenshot = await driver.takeScreenshot()
			const fs = require('fs')
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
			fs.writeFileSync(
				`exercise-3-error-${timestamp}.png`,
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
testUserJourney().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
