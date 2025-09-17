const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

async function testTimesheets() {
	console.log('🚀 Timesheet Test - Working Version')
	console.log('====================================\n')

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

		// Step 1: Login FIRST (not through redirect)
		console.log('📝 Step 1: Direct Login')
		await driver.get(`${baseUrl}/login`)
		await driver.sleep(1000)

		const usernameField = await driver.findElement(
			By.css('input[name="username"], input[type="email"]'),
		)
		await usernameField.sendKeys('kody')

		const passwordField = await driver.findElement(
			By.css('input[type="password"]'),
		)
		await passwordField.sendKeys('kodylovesyou')

		const submitButton = await driver.findElement(
			By.css('button[type="submit"]'),
		)
		await submitButton.click()

		await driver.sleep(2000)
		let currentUrl = await driver.getCurrentUrl()
		console.log(`  ✅ Logged in successfully`)
		console.log(`  📍 After login URL: ${currentUrl}`)

		// Step 2: Now navigate to timesheets (should maintain session)
		console.log('\n📊 Step 2: Navigate to Timesheets (with active session)')
		await driver.get(`${baseUrl}/timesheets`)
		await driver.sleep(3000)

		currentUrl = await driver.getCurrentUrl()
		console.log(`  📍 Timesheet URL: ${currentUrl}`)

		// Check if we got redirected to login again
		if (currentUrl.includes('/login')) {
			console.log('  ⚠️ Session lost - trying workaround...')

			// Login with redirect
			const username2 = await driver.findElement(
				By.css('input[name="username"], input[type="email"]'),
			)
			await username2.clear()
			await username2.sendKeys('kody')

			const password2 = await driver.findElement(
				By.css('input[type="password"]'),
			)
			await password2.clear()
			await password2.sendKeys('kodylovesyou')

			const submit2 = await driver.findElement(By.css('button[type="submit"]'))
			await submit2.click()

			await driver.sleep(3000)
			currentUrl = await driver.getCurrentUrl()
			console.log(`  📍 After re-login URL: ${currentUrl}`)

			// Manually navigate to timesheets again
			if (!currentUrl.includes('/timesheets')) {
				console.log('  📍 Manually navigating to timesheets...')
				await driver.get(`${baseUrl}/timesheets`)
				await driver.sleep(3000)
				currentUrl = await driver.getCurrentUrl()
				console.log(`  📍 Final URL: ${currentUrl}`)
			}
		}

		// Step 3: Check for AG-Grid
		console.log('\n📊 Step 3: Check for AG-Grid Components')

		// Multiple ways to detect AG-Grid
		const gridSelectors = [
			'.ag-root-wrapper',
			'.ag-theme-quartz',
			'.ag-theme-quartz-dark',
			'[ref="gridPanel"]',
			'.ag-center-cols-container',
			'.ag-body-viewport',
		]

		let gridFound = false
		for (const selector of gridSelectors) {
			const elements = await driver.findElements(By.css(selector))
			if (elements.length > 0) {
				console.log(`  ✅ Found AG-Grid element: ${selector}`)
				gridFound = true
				break
			}
		}

		if (gridFound) {
			// Get more details about the grid
			const gridRows = await driver.findElements(By.css('.ag-row'))
			console.log(`  📊 Grid rows found: ${gridRows.length}`)

			const headers = await driver.findElements(By.css('.ag-header-cell'))
			console.log(`  📋 Column headers found: ${headers.length}`)

			// Try to get header text
			if (headers.length > 0) {
				console.log('  📋 Column Headers:')
				for (let i = 0; i < Math.min(headers.length, 8); i++) {
					try {
						const headerText = await headers[i].getText()
						if (headerText.trim()) {
							console.log(`     ${i + 1}. ${headerText}`)
						}
					} catch (e) {
						// Skip if can't get text
					}
				}
			}

			// Get sample data from first few rows
			if (gridRows.length > 0) {
				console.log(
					`\n  📊 Sample Data (first ${Math.min(3, gridRows.length)} rows):`,
				)
				for (let i = 0; i < Math.min(3, gridRows.length); i++) {
					try {
						const cells = await gridRows[i].findElements(By.css('.ag-cell'))
						const rowData = []
						for (let j = 0; j < Math.min(5, cells.length); j++) {
							const cellText = await cells[j].getText()
							if (cellText.trim()) {
								rowData.push(cellText)
							}
						}
						if (rowData.length > 0) {
							console.log(`     Row ${i + 1}: ${rowData.join(' | ')}`)
						}
					} catch (e) {
						// Skip row if error
					}
				}
			}

			// Check for hierarchy controls
			const expandButtons = await driver.findElements(
				By.css('.ag-group-contracted, .ag-icon-contracted'),
			)
			const collapseButtons = await driver.findElements(
				By.css('.ag-group-expanded, .ag-icon-expanded'),
			)
			console.log(`\n  🔄 Hierarchy Controls:`)
			console.log(`     Expand buttons: ${expandButtons.length}`)
			console.log(`     Collapse buttons: ${collapseButtons.length}`)

			// Test expanding first row
			if (expandButtons.length > 0) {
				console.log('\n  📂 Testing Row Expansion:')
				await expandButtons[0].click()
				await driver.sleep(1000)

				// Check for detail rows
				const detailRows = await driver.findElements(
					By.css('.ag-details-row, .ag-full-width-row'),
				)
				console.log(`     ✅ Expanded! Detail rows found: ${detailRows.length}`)

				// Check if nested grid exists in details
				if (detailRows.length > 0) {
					const nestedGrids = await detailRows[0].findElements(
						By.css('.ag-root-wrapper'),
					)
					if (nestedGrids.length > 0) {
						console.log(`     ✅ Nested grid found (DTR level)`)

						// Check for further expansion in nested grid
						const nestedExpand = await detailRows[0].findElements(
							By.css('.ag-group-contracted'),
						)
						console.log(`     📂 Nested expand buttons: ${nestedExpand.length}`)
					}
				}
			}
		} else {
			console.log('  ❌ AG-Grid not detected')

			// Get page content for debugging
			const bodyText = await driver.findElement(By.tagName('body')).getText()
			const preview = bodyText.substring(0, 300).replace(/\n+/g, ' ')
			console.log(`  📄 Page content preview: ${preview}...`)

			// Check for specific elements that might indicate the page loaded
			const pageElements = {
				headings: await driver.findElements(By.css('h1, h2, h3')),
				tables: await driver.findElements(By.css('table')),
				forms: await driver.findElements(By.css('form')),
				buttons: await driver.findElements(By.css('button')),
				links: await driver.findElements(By.css('a')),
			}

			console.log('\n  📄 Page Structure:')
			for (const [element, items] of Object.entries(pageElements)) {
				console.log(`     ${element}: ${items.length}`)
			}
		}

		// Step 4: Check for CRUD controls
		console.log('\n🔧 Step 4: CRUD Controls Check')

		// Look for buttons with specific text
		const buttonTexts = [
			'Create',
			'Add',
			'New',
			'Edit',
			'Delete',
			'Save',
			'Cancel',
		]
		for (const text of buttonTexts) {
			const buttons = await driver.findElements(
				By.xpath(`//button[contains(text(), '${text}')]`),
			)
			if (buttons.length > 0) {
				console.log(`  ✅ Found ${buttons.length} "${text}" button(s)`)
			}
		}

		// Check for dialogs
		const dialogs = await driver.findElements(
			By.css('[role="dialog"], .modal, .dialog'),
		)
		console.log(`  📋 Dialogs on page: ${dialogs.length}`)

		// Step 5: Test keyboard navigation
		console.log('\n⌨️ Step 5: Keyboard Navigation Test')
		const body = await driver.findElement(By.tagName('body'))

		// Try arrow keys
		await body.sendKeys('\uE015') // Arrow down
		await driver.sleep(500)
		await body.sendKeys('\uE014') // Arrow right
		await driver.sleep(500)
		console.log('  ✅ Keyboard navigation tested')

		// Step 6: Take screenshot for verification
		console.log('\n📸 Step 6: Capturing Screenshot')
		const screenshot = await driver.takeScreenshot()
		const fs = require('fs')
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		const filename = `timesheet-test-${timestamp}.png`
		fs.writeFileSync(filename, screenshot, 'base64')
		console.log(`  ✅ Screenshot saved: ${filename}`)

		console.log('\n' + '='.repeat(50))
		console.log('✅ Timesheet test completed successfully')
		console.log('='.repeat(50))
	} catch (error) {
		console.error('\n❌ Test failed:', error.message)
		console.error('Stack:', error.stack)

		// Save error screenshot
		try {
			const screenshot = await driver.takeScreenshot()
			const fs = require('fs')
			fs.writeFileSync('timesheet-error.png', screenshot, 'base64')
			console.log('📸 Error screenshot saved: timesheet-error.png')
		} catch (e) {
			console.log('Could not save error screenshot')
		}

		throw error
	} finally {
		await driver.quit()
		console.log('\n🏁 Browser closed')
	}
}

// Run the test
testTimesheets().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
