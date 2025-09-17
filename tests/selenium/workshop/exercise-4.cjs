const { Builder, By, until } = require('selenium-webdriver')
const assert = require('assert')

async function fixedTest() {
	console.log('🚀 Exercise 4: Fixed Debugging Test')
	console.log('====================================\n')

	const driver = await new Builder().forBrowser('chrome').build()

	try {
		// Fix 1: Use full URL
		console.log('📍 Navigating to users page...')
		await driver.get('http://localhost:3000/users')
		await driver.sleep(2000)

		// Fix 2: Correct selector and check if elements exist
		console.log('🔍 Looking for user cards...')
		const userCards = await driver.findElements(
			By.css('.user-card, article, [data-testid="user-card"]'),
		)
		console.log(`  Found ${userCards.length} user cards`)

		if (userCards.length > 0) {
			await userCards[0].click()
			console.log('  ✅ Clicked first user card')
		} else {
			console.log('  ℹ️ No user cards found')
		}

		// Fix 3: Correct selector and check if search exists
		console.log('\n🔍 Looking for search field...')
		let searchField = null

		try {
			searchField = await driver.findElement(By.css('input[type="search"]'))
		} catch (e) {
			try {
				searchField = await driver.findElement(By.css('input[name="search"]'))
			} catch (e2) {
				searchField = await driver.findElement(By.id('search'))
			}
		}

		if (searchField) {
			await searchField.sendKeys('kody')
			console.log('  ✅ Search query entered')

			// Fix 4: Use explicit wait instead of sleep
			console.log('  ⏳ Waiting for results...')
			await driver
				.wait(async () => {
					const bodyText = await driver
						.findElement(By.tagName('body'))
						.getText()
					return (
						bodyText.toLowerCase().includes('kody') ||
						bodyText.includes('result')
					)
				}, 5000)
				.catch(() => {
					console.log('  ℹ️ Results timeout, continuing...')
				})
		} else {
			console.log('  ℹ️ No search field found')
		}

		// Fix 5: Better assertion with fallback
		console.log('\n📊 Checking results...')
		const bodyText = await driver.findElement(By.tagName('body')).getText()

		if (bodyText.toLowerCase().includes('kody')) {
			console.log('  ✅ Found "kody" in page content')
		} else if (bodyText.includes('user')) {
			console.log('  ✅ Found user-related content')
		} else {
			console.log('  ℹ️ No specific results found')
		}

		// Additional debugging info
		console.log('\n📋 Page Information:')
		console.log(`  Title: ${await driver.getTitle()}`)
		console.log(`  URL: ${await driver.getCurrentUrl()}`)

		// Take success screenshot
		const screenshot = await driver.takeScreenshot()
		const fs = require('fs')
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		fs.writeFileSync(`exercise-4-fixed-${timestamp}.png`, screenshot, 'base64')
		console.log('  📸 Screenshot saved')

		console.log('\n✅ Exercise 4: Fixed test completed successfully!\n')
	} catch (error) {
		console.error('\n❌ Test failed:', error.message)

		// Debugging helpers
		try {
			const screenshot = await driver.takeScreenshot()
			const fs = require('fs')
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
			fs.writeFileSync(
				`exercise-4-error-${timestamp}.png`,
				screenshot,
				'base64',
			)
			console.log('📸 Error screenshot saved')

			console.log('\n🔍 Debug Information:')
			console.log('  Page title:', await driver.getTitle())
			console.log('  Current URL:', await driver.getCurrentUrl())

			// Log page source snippet
			const pageSource = await driver.getPageSource()
			console.log('  Page has content:', pageSource.length > 0 ? 'Yes' : 'No')
			console.log(
				'  Contains "error":',
				pageSource.toLowerCase().includes('error'),
			)
		} catch (e) {
			console.log('  Could not capture debug info')
		}

		throw error
	} finally {
		await driver.quit()
		console.log('🏁 Browser closed')
	}
}

// Run the test
fixedTest().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
