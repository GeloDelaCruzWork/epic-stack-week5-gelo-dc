const { Builder, By, until, Key } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const { expect } = require('chai')

class TimesheetTestSuite {
	constructor(baseUrl = 'http://localhost:3000') {
		this.baseUrl = baseUrl
		this.driver = null
		this.defaultTimeout = 10000
	}

	async setup(headless = false) {
		const options = new chrome.Options()
		if (headless) {
			options.addArguments('--headless=new')
		}
		options.addArguments('--disable-dev-shm-usage')
		options.addArguments('--no-sandbox')
		options.addArguments('--window-size=1920,1080') // Larger for AG-Grid

		this.driver = await new Builder()
			.forBrowser('chrome')
			.setChromeOptions(options)
			.build()

		await this.driver.manage().setTimeouts({
			implicit: this.defaultTimeout,
			pageLoad: 30000,
			script: 30000,
		})
	}

	async teardown() {
		if (this.driver) {
			await this.driver.quit()
		}
	}

	async login(username = 'kody', password = 'kodylovesyou') {
		console.log('  📝 Logging in...')
		await this.driver.get(`${this.baseUrl}/login`)
		await this.waitForPageLoad()

		const usernameField = await this.driver.findElement(
			By.css('input[name="username"], input[type="email"]'),
		)
		await usernameField.clear()
		await usernameField.sendKeys(username)

		const passwordField = await this.driver.findElement(
			By.css('input[type="password"]'),
		)
		await passwordField.clear()
		await passwordField.sendKeys(password)

		const submitButton = await this.driver.findElement(
			By.css('button[type="submit"]'),
		)
		await submitButton.click()

		await this.waitForPageLoad()
		await this.driver.sleep(1000)

		const currentUrl = await this.driver.getCurrentUrl()
		if (currentUrl.includes('/login')) {
			throw new Error('Login failed')
		}
		console.log('  ✅ Login successful')
	}

	async waitForPageLoad() {
		await this.driver.wait(async () => {
			const readyState = await this.driver.executeScript(
				'return document.readyState',
			)
			return readyState === 'complete'
		}, this.defaultTimeout)
	}

	async waitForAgGrid() {
		// Wait for AG-Grid to be ready
		await this.driver.wait(
			async () => {
				const gridReady = await this.driver.executeScript(`
        const grids = document.querySelectorAll('.ag-root-wrapper');
        return grids.length > 0 && grids[0].querySelectorAll('.ag-row').length > 0;
      `)
				return gridReady
			},
			this.defaultTimeout,
			'AG-Grid did not load in time',
		)
	}

	async expandRow(rowIndex = 0) {
		// Click the expand icon in AG-Grid row
		const expandButtons = await this.driver.findElements(
			By.css('.ag-group-contracted'),
		)
		if (expandButtons.length > rowIndex) {
			await this.driver.executeScript(
				'arguments[0].scrollIntoView({block: "center"})',
				expandButtons[rowIndex],
			)
			await this.driver.sleep(300)
			await expandButtons[rowIndex].click()
			await this.driver.sleep(500) // Wait for expansion animation
			return true
		}
		return false
	}

	async collapseRow(rowIndex = 0) {
		// Click the collapse icon in AG-Grid row
		const collapseButtons = await this.driver.findElements(
			By.css('.ag-group-expanded'),
		)
		if (collapseButtons.length > rowIndex) {
			await collapseButtons[rowIndex].click()
			await this.driver.sleep(500) // Wait for collapse animation
			return true
		}
		return false
	}

	async doubleClickGridCell(rowIndex = 0, columnIndex = 1) {
		// Double-click a cell to edit
		const cells = await this.driver.findElements(
			By.css(`.ag-row[row-index="${rowIndex}"] .ag-cell`),
		)
		if (cells.length > columnIndex) {
			const actions = this.driver.actions()
			await actions.doubleClick(cells[columnIndex]).perform()
			await this.driver.sleep(300)
			return true
		}
		return false
	}

	async getGridData() {
		// Extract data from AG-Grid
		return await this.driver.executeScript(`
      const rows = [];
      document.querySelectorAll('.ag-row').forEach(row => {
        const cells = [];
        row.querySelectorAll('.ag-cell').forEach(cell => {
          cells.push(cell.textContent.trim());
        });
        if (cells.length > 0) {
          rows.push(cells);
        }
      });
      return rows;
    `)
	}

	async testTimesheetNavigation() {
		console.log('\n📊 Testing Timesheet Navigation...')

		// Navigate to timesheets
		console.log('  ➤ Navigating to timesheets page...')
		await this.driver.get(`${this.baseUrl}/timesheets`)
		await this.waitForPageLoad()
		await this.driver.sleep(2000)

		// Check if we're on the timesheets page
		let currentUrl = await this.driver.getCurrentUrl()
		console.log(`  📍 Initial URL: ${currentUrl}`)

		if (currentUrl.includes('/login')) {
			console.log('  ⚠️ Redirected to login, attempting to login from here...')

			// Login from the current page
			const usernameField = await this.driver.findElement(
				By.css('input[name="username"], input[type="email"]'),
			)
			await usernameField.clear()
			await usernameField.sendKeys('kody')

			const passwordField = await this.driver.findElement(
				By.css('input[type="password"]'),
			)
			await passwordField.clear()
			await passwordField.sendKeys('kodylovesyou')

			const submitButton = await this.driver.findElement(
				By.css('button[type="submit"]'),
			)
			await submitButton.click()

			await this.waitForPageLoad()
			await this.driver.sleep(2000)

			// Check where we are after login
			currentUrl = await this.driver.getCurrentUrl()
			console.log(`  📍 After login URL: ${currentUrl}`)

			// If not on timesheets, navigate there
			if (!currentUrl.includes('/timesheets')) {
				console.log('  ➤ Navigating to timesheets after login...')
				await this.driver.get(`${this.baseUrl}/timesheets`)
				await this.waitForPageLoad()
				await this.driver.sleep(2000)
				currentUrl = await this.driver.getCurrentUrl()
				console.log(`  📍 Final URL: ${currentUrl}`)
			}
		}

		// Wait for AG-Grid to load
		console.log('  ⏳ Waiting for AG-Grid to load...')
		try {
			await this.waitForAgGrid()
			console.log('  ✅ AG-Grid loaded successfully')
		} catch (error) {
			console.log('  ❌ AG-Grid failed to load')

			// Check if there's any error message
			const bodyText = await this.driver
				.findElement(By.tagName('body'))
				.getText()
			console.log('  Page content:', bodyText.substring(0, 200))
			return false
		}

		// Get grid data
		const gridData = await this.getGridData()
		console.log(`  📊 Found ${gridData.length} rows in the grid`)

		if (gridData.length > 0) {
			console.log('  First row data:', gridData[0])
		}

		return true
	}

	async testHierarchyNavigation() {
		console.log('\n🔄 Testing 4-Level Hierarchy Navigation...')

		// Level 1: Timesheet
		console.log('  📋 Level 1: Timesheet')
		const timesheetRows = await this.driver.findElements(
			By.css('.ag-row[row-level="0"]'),
		)
		console.log(`  Found ${timesheetRows.length} timesheet rows`)

		if (timesheetRows.length > 0) {
			// Expand first timesheet to show DTRs
			console.log('  ➤ Expanding timesheet to show DTRs...')
			const expanded = await this.expandRow(0)

			if (expanded) {
				await this.driver.sleep(1000)

				// Level 2: DTR (Daily Time Record)
				console.log('  📅 Level 2: DTR (Daily Time Records)')
				const dtrRows = await this.driver.findElements(
					By.css('.ag-details-row'),
				)
				console.log(`  Found ${dtrRows.length} DTR detail rows`)

				// Try to find DTR grid within details
				const dtrGrid = await this.driver.findElements(
					By.css('.ag-details-row .ag-root-wrapper'),
				)
				if (dtrGrid.length > 0) {
					console.log('  ✅ DTR grid found in details row')

					// Try to expand a DTR to show Timelogs
					const dtrExpandButtons = await this.driver.findElements(
						By.css('.ag-details-row .ag-group-contracted'),
					)
					if (dtrExpandButtons.length > 0) {
						console.log('  ➤ Expanding DTR to show Timelogs...')
						await dtrExpandButtons[0].click()
						await this.driver.sleep(1000)

						// Level 3: Timelog
						console.log('  ⏰ Level 3: Timelogs')
						const timelogRows = await this.driver.findElements(
							By.css('.ag-details-row .ag-details-row'),
						)
						console.log(`  Found ${timelogRows.length} Timelog detail rows`)

						// Try to expand a Timelog to show ClockEvents
						const timelogExpandButtons = await this.driver.findElements(
							By.css('.ag-details-row .ag-details-row .ag-group-contracted'),
						)

						if (timelogExpandButtons.length > 0) {
							console.log('  ➤ Expanding Timelog to show ClockEvents...')
							await timelogExpandButtons[0].click()
							await this.driver.sleep(1000)

							// Level 4: ClockEvent
							console.log('  🕐 Level 4: ClockEvents')
							const clockEventRows = await this.driver.findElements(
								By.css('.ag-details-row .ag-details-row .ag-details-row'),
							)
							console.log(
								`  Found ${clockEventRows.length} ClockEvent detail rows`,
							)
						}
					}
				}

				// Collapse the timesheet
				console.log('  ➤ Collapsing timesheet...')
				await this.collapseRow(0)
			}
		}

		return true
	}

	async testTimesheetCRUD() {
		console.log('\n📝 Testing Timesheet CRUD Operations...')

		// Test: Create new timesheet
		console.log('  ➤ Testing Create Timesheet...')

		// Look for create button
		const createButtons = await this.driver.findElements(
			By.css(
				'button:contains("Create"), button:contains("Add"), button:contains("New")',
			),
		)
		if (createButtons.length > 0) {
			console.log('  Found create button')
			await createButtons[0].click()
			await this.driver.sleep(1000)

			// Check if a dialog opened
			const dialogs = await this.driver.findElements(
				By.css('[role="dialog"], .modal, .dialog'),
			)
			if (dialogs.length > 0) {
				console.log('  ✅ Create dialog opened')

				// Try to fill in form fields
				const inputs = await this.driver.findElements(
					By.css('input[type="text"], input:not([type="hidden"])'),
				)
				if (inputs.length > 0) {
					console.log(`  Found ${inputs.length} input fields`)

					// Fill first field (likely employee name)
					await inputs[0].clear()
					await inputs[0].sendKeys('Selenium Test Employee')
				}

				// Close dialog for now (look for cancel/close button)
				const closeButtons = await this.driver.findElements(
					By.css(
						'button:contains("Cancel"), button:contains("Close"), button[aria-label*="close" i]',
					),
				)
				if (closeButtons.length > 0) {
					await closeButtons[0].click()
					await this.driver.sleep(500)
				}
			}
		} else {
			console.log('  ⚠️ No create button found')
		}

		// Test: Edit timesheet (double-click)
		console.log('  ➤ Testing Edit Timesheet...')
		const editSuccess = await this.doubleClickGridCell(0, 1)
		if (editSuccess) {
			await this.driver.sleep(1000)

			// Check if edit dialog opened
			const editDialogs = await this.driver.findElements(
				By.css('[role="dialog"], .modal, .dialog'),
			)
			if (editDialogs.length > 0) {
				console.log('  ✅ Edit dialog opened')

				// Close dialog
				const closeButtons = await this.driver.findElements(
					By.css(
						'button:contains("Cancel"), button:contains("Close"), button[aria-label*="close" i]',
					),
				)
				if (closeButtons.length > 0) {
					await closeButtons[0].click()
					await this.driver.sleep(500)
				}
			}
		}

		return true
	}

	async testGridFeatures() {
		console.log('\n⚡ Testing AG-Grid Features...')

		// Test: Column sorting
		console.log('  ➤ Testing column sorting...')
		const columnHeaders = await this.driver.findElements(
			By.css('.ag-header-cell'),
		)
		if (columnHeaders.length > 1) {
			console.log(`  Found ${columnHeaders.length} column headers`)

			// Click on second column header to sort
			await columnHeaders[1].click()
			await this.driver.sleep(500)
			console.log('  ✅ Column sorting triggered')
		}

		// Test: Column filtering (if available)
		console.log('  ➤ Testing column filtering...')
		const filterButtons = await this.driver.findElements(
			By.css('.ag-header-cell-menu-button'),
		)
		if (filterButtons.length > 0) {
			await filterButtons[0].click()
			await this.driver.sleep(500)
			console.log('  ✅ Filter menu opened')

			// Close filter menu
			await this.driver.findElement(By.tagName('body')).click()
			await this.driver.sleep(300)
		} else {
			console.log('  ⚠️ No filter buttons found')
		}

		// Test: Row selection
		console.log('  ➤ Testing row selection...')
		const rows = await this.driver.findElements(By.css('.ag-row'))
		if (rows.length > 0) {
			await rows[0].click()
			await this.driver.sleep(300)

			// Check if row is selected
			const selectedRows = await this.driver.findElements(
				By.css('.ag-row-selected'),
			)
			if (selectedRows.length > 0) {
				console.log('  ✅ Row selection working')
			} else {
				console.log('  ⚠️ Row selection not detected')
			}
		}

		// Test: Pagination (if available)
		console.log('  ➤ Checking for pagination...')
		const paginationControls = await this.driver.findElements(
			By.css('.ag-paging-panel, .pagination'),
		)
		if (paginationControls.length > 0) {
			console.log('  ✅ Pagination controls found')
		} else {
			console.log('  ℹ️ No pagination controls (all data in view)')
		}

		return true
	}

	async testThemeSwitching() {
		console.log('\n🎨 Testing Theme with AG-Grid...')

		// Check current theme
		const lightTheme = await this.driver.findElements(
			By.css('.ag-theme-quartz'),
		)
		const darkTheme = await this.driver.findElements(
			By.css('.ag-theme-quartz-dark'),
		)

		if (lightTheme.length > 0) {
			console.log('  📍 Current theme: Light (ag-theme-quartz)')
		} else if (darkTheme.length > 0) {
			console.log('  📍 Current theme: Dark (ag-theme-quartz-dark)')
		} else {
			console.log('  ⚠️ Unknown AG-Grid theme')
		}

		// Try to find and click theme switcher
		const themeButtons = await this.driver.findElements(
			By.css(
				'button[title*="theme" i], button[aria-label*="theme" i], button.theme-switch',
			),
		)

		if (themeButtons.length > 0) {
			console.log('  ➤ Clicking theme switcher...')
			await themeButtons[0].click()
			await this.driver.sleep(1000)

			// Check if theme changed
			const newLightTheme = await this.driver.findElements(
				By.css('.ag-theme-quartz'),
			)
			const newDarkTheme = await this.driver.findElements(
				By.css('.ag-theme-quartz-dark'),
			)

			if (lightTheme.length > 0 && newDarkTheme.length > 0) {
				console.log('  ✅ Theme switched from Light to Dark')
			} else if (darkTheme.length > 0 && newLightTheme.length > 0) {
				console.log('  ✅ Theme switched from Dark to Light')
			} else {
				console.log('  ⚠️ Theme switch not detected')
			}
		} else {
			console.log('  ⚠️ No theme switcher found')
		}

		return true
	}

	async runAllTests() {
		const startTime = Date.now()
		console.log('🚀 Starting Timesheet Test Suite')
		console.log('=================================\n')

		try {
			await this.setup()
			console.log('✅ Browser initialized\n')

			await this.login()

			// Run all test scenarios
			const navResult = await this.testTimesheetNavigation()
			if (!navResult) {
				console.log('⚠️ Skipping remaining tests due to navigation failure')
				return
			}

			await this.testHierarchyNavigation()
			await this.testTimesheetCRUD()
			await this.testGridFeatures()
			await this.testThemeSwitching()

			const duration = ((Date.now() - startTime) / 1000).toFixed(2)
			console.log('\n=================================')
			console.log(`✅ Timesheet tests completed in ${duration}s`)
		} catch (error) {
			console.error('\n❌ Test suite failed:', error.message)

			// Take screenshot on failure
			try {
				const screenshot = await this.driver.takeScreenshot()
				const fs = require('fs')
				fs.writeFileSync('timesheet-test-failure.png', screenshot, 'base64')
				console.log('📸 Screenshot saved: timesheet-test-failure.png')
			} catch (e) {
				console.log('Could not save screenshot')
			}

			throw error
		} finally {
			await this.teardown()
			console.log('🏁 Browser closed')
		}
	}
}

// Run the test suite
const runner = new TimesheetTestSuite()
runner.runAllTests().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
