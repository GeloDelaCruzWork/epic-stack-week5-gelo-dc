const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

async function testTimesheetsViaNavigation() {
	console.log('🚀 Timesheet Test - Navigation Approach')
	console.log('========================================\n')

	const options = new chrome.Options()
	options.addArguments('--disable-dev-shm-usage')
	options.addArguments('--no-sandbox')
	options.addArguments('--window-size=1920,1080')

	const driver = await new Builder()
		.forBrowser('chrome')
		.setChromeOptions(options)
		.build()

	try {
		const baseUrl = 'http://localhost:3000'

		// Step 1: Login
		console.log('📝 Step 1: Login')
		await driver.get(`${baseUrl}/login`)
		await driver.sleep(1000)

		await driver
			.findElement(By.css('input[name="username"], input[type="email"]'))
			.sendKeys('kody')
		await driver
			.findElement(By.css('input[type="password"]'))
			.sendKeys('kodylovesyou')
		await driver.findElement(By.css('button[type="submit"]')).click()

		await driver.sleep(2000)
		console.log(`  ✅ Logged in`)
		console.log(`  📍 Current URL: ${await driver.getCurrentUrl()}`)

		// Step 2: Look for navigation menu or links
		console.log('\n🔍 Step 2: Find Navigation Links')

		// Check for navigation links
		const navLinks = await driver.findElements(
			By.css('nav a, .nav a, .menu a, .sidebar a'),
		)
		console.log(`  Found ${navLinks.length} navigation links`)

		// Look for specific links
		const linkSelectors = [
			'a[href="/timesheets"]',
			'a[href*="timesheet"]',
			'//a[contains(text(), "Timesheet")]',
			'//a[contains(text(), "Time")]',
		]

		let timesheetLinkFound = false
		for (const selector of linkSelectors) {
			try {
				let element
				if (selector.startsWith('//')) {
					element = await driver.findElement(By.xpath(selector))
				} else {
					element = await driver.findElement(By.css(selector))
				}

				if (element) {
					console.log(`  ✅ Found timesheet link: ${selector}`)
					await element.click()
					timesheetLinkFound = true
					break
				}
			} catch (e) {
				// Continue to next selector
			}
		}

		if (!timesheetLinkFound) {
			console.log('  ⚠️ No timesheet link found in navigation')

			// Try to find any link with "time" in it
			const allLinks = await driver.findElements(By.css('a'))
			console.log(`  Total links on page: ${allLinks.length}`)

			for (const link of allLinks) {
				try {
					const text = await link.getText()
					const href = await link.getAttribute('href')
					if (
						text.toLowerCase().includes('time') ||
						(href && href.includes('time'))
					) {
						console.log(`  Found potential link: "${text}" -> ${href}`)
					}
				} catch (e) {
					// Skip this link
				}
			}

			// Alternative: Check if there's a menu button to click first
			console.log('\n  🍔 Looking for menu button...')
			const menuButtons = await driver.findElements(
				By.css(
					'button[aria-label*="menu" i], button.menu-button, button.hamburger',
				),
			)
			if (menuButtons.length > 0) {
				console.log(`  Found ${menuButtons.length} menu button(s)`)
				await menuButtons[0].click()
				await driver.sleep(1000)

				// Look for timesheet link again
				const menuLinks = await driver.findElements(
					By.css('a[href*="timesheet"]'),
				)
				if (menuLinks.length > 0) {
					console.log('  ✅ Found timesheet link in menu')
					await menuLinks[0].click()
					timesheetLinkFound = true
				}
			}
		}

		await driver.sleep(3000)

		// Step 3: Check current location
		console.log('\n📍 Step 3: Check Navigation Result')
		const currentUrl = await driver.getCurrentUrl()
		console.log(`  Current URL: ${currentUrl}`)

		if (currentUrl.includes('timesheet')) {
			console.log('  ✅ Successfully navigated to timesheet page!')

			// Check for AG-Grid
			console.log('\n📊 Step 4: Check for AG-Grid')
			const grids = await driver.findElements(
				By.css('.ag-root-wrapper, .ag-theme-quartz'),
			)
			if (grids.length > 0) {
				console.log('  ✅ AG-Grid found!')

				const rows = await driver.findElements(By.css('.ag-row'))
				console.log(`  📊 Grid rows: ${rows.length}`)

				const headers = await driver.findElements(By.css('.ag-header-cell'))
				console.log(`  📋 Column headers: ${headers.length}`)
			} else {
				console.log('  ⚠️ No AG-Grid found on timesheet page')
			}
		} else {
			console.log('  ❌ Not on timesheet page')

			// Alternative: Try direct navigation with cookies
			console.log('\n🍪 Step 4: Try with cookies preserved')

			// Get all cookies
			const cookies = await driver.manage().getCookies()
			console.log(`  Found ${cookies.length} cookies`)

			// Try to navigate directly
			await driver.get(`${baseUrl}/timesheets`)
			await driver.sleep(3000)

			const finalUrl = await driver.getCurrentUrl()
			console.log(`  Final URL: ${finalUrl}`)

			if (finalUrl.includes('login')) {
				// Re-apply cookies
				for (const cookie of cookies) {
					try {
						await driver.manage().addCookie(cookie)
					} catch (e) {
						// Some cookies might not be valid for the domain
					}
				}

				// Refresh
				await driver.navigate().refresh()
				await driver.sleep(2000)
				console.log(`  After cookie refresh: ${await driver.getCurrentUrl()}`)
			}
		}

		// Step 5: Explore available features
		console.log('\n🔍 Step 5: Explore Available Features')

		// Get all visible text to understand what's available
		const bodyText = await driver.findElement(By.tagName('body')).getText()
		const lines = bodyText.split('\n').filter((line) => line.trim())

		console.log('  📄 Key page elements:')
		const keywords = [
			'timesheet',
			'time',
			'clock',
			'hour',
			'period',
			'employee',
			'dtr',
			'log',
		]
		for (const keyword of keywords) {
			const matches = lines.filter((line) =>
				line.toLowerCase().includes(keyword),
			)
			if (matches.length > 0) {
				console.log(`    ${keyword}: ${matches.length} occurrences`)
				if (matches.length <= 3) {
					matches.forEach((match) =>
						console.log(`      - ${match.substring(0, 50)}`),
					)
				}
			}
		}

		// Take final screenshot
		const screenshot = await driver.takeScreenshot()
		const fs = require('fs')
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		fs.writeFileSync(`timesheet-nav-${timestamp}.png`, screenshot, 'base64')
		console.log(`\n📸 Screenshot saved: timesheet-nav-${timestamp}.png`)

		console.log('\n' + '='.repeat(50))
		console.log('✅ Test completed')
		console.log('='.repeat(50))
	} catch (error) {
		console.error('\n❌ Test failed:', error.message)
		throw error
	} finally {
		await driver.quit()
		console.log('\n🏁 Browser closed')
	}
}

// Run the test
testTimesheetsViaNavigation().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
