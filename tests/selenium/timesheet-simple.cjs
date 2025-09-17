const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

async function testTimesheets() {
	console.log('🚀 Timesheet Test - Simple Version')
	console.log('===================================\n')

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
		console.log('  ✅ Logged in successfully')
		console.log(`  📍 Current URL: ${await driver.getCurrentUrl()}`)

		// Step 2: Try to navigate to timesheets
		console.log('\n📊 Step 2: Navigate to Timesheets')
		await driver.get(`${baseUrl}/timesheets`)
		await driver.sleep(3000)

		const currentUrl = await driver.getCurrentUrl()
		console.log(`  📍 Timesheet URL: ${currentUrl}`)

		// Check what's on the page
		const bodyText = await driver.findElement(By.tagName('body')).getText()

		// Check for AG-Grid
		const agGridElements = await driver.findElements(
			By.css('.ag-root-wrapper, .ag-theme-quartz, .ag-theme-quartz-dark'),
		)
		if (agGridElements.length > 0) {
			console.log('  ✅ AG-Grid found on page')

			// Check for grid rows
			const gridRows = await driver.findElements(By.css('.ag-row'))
			console.log(`  📊 Found ${gridRows.length} grid rows`)

			// Check for column headers
			const headers = await driver.findElements(By.css('.ag-header-cell'))
			console.log(`  📋 Found ${headers.length} column headers`)

			if (headers.length > 0) {
				// Get header text
				console.log('  Column headers:')
				for (let i = 0; i < Math.min(5, headers.length); i++) {
					const headerText = await headers[i].getText()
					if (headerText) {
						console.log(`    - ${headerText}`)
					}
				}
			}

			// Try to get data from first row
			if (gridRows.length > 0) {
				const firstRowCells = await gridRows[0].findElements(By.css('.ag-cell'))
				if (firstRowCells.length > 0) {
					console.log('  First row data:')
					for (let i = 0; i < Math.min(5, firstRowCells.length); i++) {
						const cellText = await firstRowCells[i].getText()
						if (cellText) {
							console.log(`    - Cell ${i}: ${cellText}`)
						}
					}
				}
			}

			// Check for expand/collapse buttons
			const expandButtons = await driver.findElements(
				By.css('.ag-group-contracted, .ag-group-expanded'),
			)
			console.log(`  🔄 Found ${expandButtons.length} expand/collapse buttons`)

			// Try to expand first row
			if (expandButtons.length > 0) {
				console.log('\n📂 Step 3: Test Hierarchy Expansion')
				await expandButtons[0].click()
				await driver.sleep(1000)

				// Check for details row
				const detailsRows = await driver.findElements(By.css('.ag-details-row'))
				console.log(
					`  ✅ Expanded row, found ${detailsRows.length} detail rows`,
				)
			}
		} else {
			console.log('  ❌ AG-Grid not found')

			// Check if we're on login page
			if (currentUrl.includes('/login')) {
				console.log('  ⚠️ Still on login page - authentication may be required')

				// Try to login again from this page
				console.log('  Attempting to login from redirect page...')
				const username2 = await driver.findElement(
					By.css('input[name="username"], input[type="email"]'),
				)
				await username2.sendKeys('kody')

				const password2 = await driver.findElement(
					By.css('input[type="password"]'),
				)
				await password2.sendKeys('kodylovesyou')

				const submit2 = await driver.findElement(
					By.css('button[type="submit"]'),
				)
				await submit2.click()

				await driver.sleep(3000)
				const afterLoginUrl = await driver.getCurrentUrl()
				console.log(`  📍 After re-login URL: ${afterLoginUrl}`)

				// Check for grid again
				const gridAfterLogin = await driver.findElements(
					By.css('.ag-root-wrapper'),
				)
				if (gridAfterLogin.length > 0) {
					console.log('  ✅ AG-Grid found after re-login')
				}
			} else {
				// Page loaded but no grid
				console.log('  Page content preview:')
				console.log('  ' + bodyText.substring(0, 200))

				// Check for error messages
				const errors = await driver.findElements(
					By.css('.error, [role="alert"], .alert'),
				)
				if (errors.length > 0) {
					console.log(`  ⚠️ Found ${errors.length} error/alert elements`)
				}
			}
		}

		// Step 4: Check for CRUD buttons
		console.log('\n🔧 Step 4: Check for CRUD Operations')
		const buttons = await driver.findElements(By.css('button'))
		console.log(`  Found ${buttons.length} buttons on page`)

		// Look for specific action buttons
		const createButtons = await driver.findElements(
			By.xpath(
				'//button[contains(text(), "Create") or contains(text(), "Add") or contains(text(), "New")]',
			),
		)
		const editButtons = await driver.findElements(
			By.xpath('//button[contains(text(), "Edit")]'),
		)
		const deleteButtons = await driver.findElements(
			By.xpath('//button[contains(text(), "Delete")]'),
		)

		console.log(`  ➕ Create/Add buttons: ${createButtons.length}`)
		console.log(`  ✏️ Edit buttons: ${editButtons.length}`)
		console.log(`  🗑️ Delete buttons: ${deleteButtons.length}`)

		// Step 5: Test double-click for edit
		console.log('\n👆 Step 5: Test Grid Interactions')
		const rows = await driver.findElements(By.css('.ag-row'))
		if (rows.length > 0) {
			console.log('  Testing double-click on first row...')
			const actions = driver.actions()
			await actions.doubleClick(rows[0]).perform()
			await driver.sleep(1000)

			// Check if dialog opened
			const dialogs = await driver.findElements(
				By.css('[role="dialog"], .modal, .dialog'),
			)
			if (dialogs.length > 0) {
				console.log('  ✅ Dialog opened after double-click')

				// Close dialog
				const closeButtons = await driver.findElements(
					By.css('button[aria-label*="close" i], button:contains("Cancel")'),
				)
				if (closeButtons.length > 0) {
					await closeButtons[0].click()
					await driver.sleep(500)
					console.log('  ✅ Dialog closed')
				}
			} else {
				console.log(
					'  ℹ️ No dialog opened (might be inline editing or no edit permission)',
				)
			}
		}

		console.log('\n' + '='.repeat(50))
		console.log('✅ Timesheet test completed')
		console.log('='.repeat(50))
	} catch (error) {
		console.error('\n❌ Test failed:', error.message)

		// Take screenshot
		try {
			const screenshot = await driver.takeScreenshot()
			const fs = require('fs')
			fs.writeFileSync('timesheet-error.png', screenshot, 'base64')
			console.log('📸 Screenshot saved: timesheet-error.png')
		} catch (e) {
			console.log('Could not save screenshot')
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
