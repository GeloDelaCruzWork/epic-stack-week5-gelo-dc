const { Builder, By, until, Actions } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

class RoleAssignmentsTestSuite {
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
		options.addArguments('--window-size=1920,1080')

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
		console.log('  📝 Logging in as admin...')
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

	async navigateToRoleAssignments() {
		console.log('\n📊 Navigating to Role Assignments...')

		// Try direct navigation first
		await this.driver.get(`${this.baseUrl}/admin/role-assignments`)
		await this.waitForPageLoad()
		await this.driver.sleep(2000)

		let currentUrl = await this.driver.getCurrentUrl()
		console.log(`  📍 Current URL: ${currentUrl}`)

		// Check if we need to login from redirect
		if (currentUrl.includes('/login')) {
			console.log('  ⚠️ Redirected to login, attempting authentication...')

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

			currentUrl = await this.driver.getCurrentUrl()
			console.log(`  📍 After login URL: ${currentUrl}`)

			// Navigate to role assignments again
			if (!currentUrl.includes('/admin/role-assignments')) {
				await this.driver.get(`${this.baseUrl}/admin/role-assignments`)
				await this.waitForPageLoad()
				await this.driver.sleep(2000)
				currentUrl = await this.driver.getCurrentUrl()
				console.log(`  📍 Final URL: ${currentUrl}`)
			}
		}

		// Check if we have access
		if (currentUrl.includes('/admin/role-assignments')) {
			console.log('  ✅ Successfully accessed Role Assignments page')
			return true
		} else {
			console.log(
				'  ❌ Could not access Role Assignments - may require admin privileges',
			)
			return false
		}
	}

	async testPageStructure() {
		console.log('\n🏗️ Testing Page Structure...')

		// Check for main components
		const elements = {
			Cards: await this.driver.findElements(By.css('.card, [class*="card"]')),
			'Roles sections': await this.driver.findElements(
				By.css('[role="region"], .role-section'),
			),
			'User avatars': await this.driver.findElements(
				By.css('[class*="avatar"], img[alt*="user"], img[alt*="User"]'),
			),
			Badges: await this.driver.findElements(
				By.css('[class*="badge"], .badge'),
			),
			'Scroll areas': await this.driver.findElements(
				By.css('[class*="scroll"], .scroll-area'),
			),
			Headers: await this.driver.findElements(
				By.css('h1, h2, h3, [class*="title"]'),
			),
		}

		console.log('  📋 Page Components Found:')
		for (const [name, items] of Object.entries(elements)) {
			if (items.length > 0) {
				console.log(`    ✅ ${name}: ${items.length}`)
			}
		}

		// Get page text to understand content
		const bodyText = await this.driver.findElement(By.tagName('body')).getText()

		// Check for role-related keywords
		const keywords = ['admin', 'user', 'role', 'permission', 'assign', 'member']
		console.log('\n  🔍 Content Analysis:')
		for (const keyword of keywords) {
			if (bodyText.toLowerCase().includes(keyword)) {
				console.log(`    ✅ Found "${keyword}" in content`)
			}
		}

		return elements.Cards.length > 0
	}

	async testDragAndDrop() {
		console.log('\n🎯 Testing Drag and Drop Functionality...')

		// Look for draggable elements
		const draggableSelectors = [
			'[draggable="true"]',
			'[class*="draggable"]',
			'[data-draggable]',
			'.user-card',
			'.user-item',
		]

		let draggableElements = []
		for (const selector of draggableSelectors) {
			const elements = await this.driver.findElements(By.css(selector))
			if (elements.length > 0) {
				draggableElements = elements
				console.log(
					`  ✅ Found ${elements.length} draggable elements with selector: ${selector}`,
				)
				break
			}
		}

		// Look for drop zones
		const dropZoneSelectors = [
			'[class*="droppable"]',
			'[data-droppable]',
			'.role-container',
			'.role-users',
			'[class*="drop-zone"]',
		]

		let dropZones = []
		for (const selector of dropZoneSelectors) {
			const elements = await this.driver.findElements(By.css(selector))
			if (elements.length > 0) {
				dropZones = elements
				console.log(
					`  ✅ Found ${elements.length} drop zones with selector: ${selector}`,
				)
				break
			}
		}

		// Try to perform drag and drop
		if (draggableElements.length > 0 && dropZones.length > 0) {
			console.log('  🚀 Attempting drag and drop operation...')

			try {
				const actions = this.driver.actions()
				const sourceElement = draggableElements[0]
				const targetElement = dropZones[0]

				// Get element information
				const sourceText = await sourceElement.getText().catch(() => 'Unknown')
				console.log(`    Source: ${sourceText}`)

				// Perform drag and drop
				await actions
					.move({ origin: sourceElement })
					.press()
					.move({ origin: targetElement })
					.release()
					.perform()

				await this.driver.sleep(1000)
				console.log('  ✅ Drag and drop operation completed')

				// Check for any feedback or changes
				const toasts = await this.driver.findElements(
					By.css('[role="alert"], .toast, [class*="toast"]'),
				)
				if (toasts.length > 0) {
					const toastText = await toasts[0].getText()
					console.log(`  📢 Notification: ${toastText}`)
				}
			} catch (error) {
				console.log(`  ⚠️ Drag and drop failed: ${error.message}`)
			}
		} else {
			console.log(
				'  ℹ️ Drag and drop elements not found - feature might not be available',
			)
		}
	}

	async testRoleCards() {
		console.log('\n🎭 Testing Role Cards...')

		// Find role cards
		const roleCardSelectors = [
			'.card',
			'[class*="card"]',
			'[role="article"]',
			'.role-card',
		]

		let roleCards = []
		for (const selector of roleCardSelectors) {
			const cards = await this.driver.findElements(By.css(selector))
			if (cards.length > 0) {
				roleCards = cards
				console.log(`  📋 Found ${cards.length} role cards`)
				break
			}
		}

		if (roleCards.length > 0) {
			// Analyze first few cards
			console.log('\n  📊 Role Card Analysis:')
			for (let i = 0; i < Math.min(3, roleCards.length); i++) {
				try {
					const cardText = await roleCards[i].getText()
					const lines = cardText.split('\n').filter((line) => line.trim())

					if (lines.length > 0) {
						console.log(`\n    Card ${i + 1}:`)
						console.log(`      Title: ${lines[0]}`)

						// Check for user count
						const userCount = lines.find(
							(line) => line.includes('user') || line.includes('member'),
						)
						if (userCount) {
							console.log(`      Users: ${userCount}`)
						}

						// Check for permissions count
						const permCount = lines.find((line) => line.includes('permission'))
						if (permCount) {
							console.log(`      Permissions: ${permCount}`)
						}
					}
				} catch (e) {
					// Skip if can't read card
				}
			}

			// Check for interactive elements in cards
			const buttons = await roleCards[0].findElements(By.css('button'))
			const links = await roleCards[0].findElements(By.css('a'))

			if (buttons.length > 0 || links.length > 0) {
				console.log(`\n  🔧 Interactive Elements in Cards:`)
				console.log(`    Buttons: ${buttons.length}`)
				console.log(`    Links: ${links.length}`)
			}
		}

		return roleCards.length
	}

	async testUserList() {
		console.log('\n👥 Testing User List...')

		// Find user elements
		const userSelectors = [
			'.user-item',
			'[class*="user"]',
			'.avatar',
			'[class*="avatar"]',
		]

		let userElements = []
		for (const selector of userSelectors) {
			const elements = await this.driver.findElements(By.css(selector))
			if (elements.length > 0) {
				userElements = elements
				console.log(`  ✅ Found ${elements.length} user elements`)
				break
			}
		}

		if (userElements.length > 0) {
			console.log('\n  👤 Sample Users:')
			for (let i = 0; i < Math.min(5, userElements.length); i++) {
				try {
					const userText = await userElements[i].getText()
					if (userText && userText.trim()) {
						console.log(`    ${i + 1}. ${userText.substring(0, 50)}`)
					}
				} catch (e) {
					// Skip if can't read
				}
			}
		}

		return userElements.length
	}

	async testRoleAssignment() {
		console.log('\n✏️ Testing Role Assignment Actions...')

		// Look for assignment controls
		const assignmentControls = {
			'Assign buttons': await this.driver.findElements(
				By.xpath('//button[contains(text(), "Assign")]'),
			),
			'Remove buttons': await this.driver.findElements(
				By.xpath('//button[contains(text(), "Remove")]'),
			),
			'Add buttons': await this.driver.findElements(
				By.xpath('//button[contains(text(), "Add")]'),
			),
			Forms: await this.driver.findElements(By.css('form')),
			'Select dropdowns': await this.driver.findElements(By.css('select')),
		}

		console.log('  🎛️ Assignment Controls:')
		for (const [name, elements] of Object.entries(assignmentControls)) {
			if (elements.length > 0) {
				console.log(`    ✅ ${name}: ${elements.length}`)
			}
		}

		// Test form submission if available
		if (assignmentControls.Forms.length > 0) {
			console.log('\n  📝 Testing Form Submission:')

			// Check for hidden inputs (for fetcher forms)
			const hiddenInputs = await assignmentControls.Forms[0].findElements(
				By.css('input[type="hidden"]'),
			)
			if (hiddenInputs.length > 0) {
				console.log(
					`    Found ${hiddenInputs.length} hidden inputs (likely for role/user IDs)`,
				)

				for (const input of hiddenInputs) {
					const name = await input.getAttribute('name')
					const value = await input.getAttribute('value')
					if (name) {
						console.log(`      ${name}: ${value || 'empty'}`)
					}
				}
			}
		}
	}

	async testPermissions() {
		console.log('\n🔐 Testing Permissions Display...')

		// Look for permission-related elements
		const permissionElements = await this.driver.findElements(
			By.xpath(
				'//*[contains(text(), "permission") or contains(text(), "Permission")]',
			),
		)

		if (permissionElements.length > 0) {
			console.log(
				`  ✅ Found ${permissionElements.length} permission-related elements`,
			)

			// Look for permission badges or lists
			const badges = await this.driver.findElements(
				By.css('.badge, [class*="badge"]'),
			)
			console.log(`  🏷️ Permission badges: ${badges.length}`)

			if (badges.length > 0) {
				console.log('  📋 Sample Permissions:')
				for (let i = 0; i < Math.min(5, badges.length); i++) {
					try {
						const badgeText = await badges[i].getText()
						if (badgeText) {
							console.log(`    - ${badgeText}`)
						}
					} catch (e) {
						// Skip
					}
				}
			}
		}
	}

	async testAccessControl() {
		console.log('\n🔒 Testing Access Control...')

		// Check if we're on the admin page
		const currentUrl = await this.driver.getCurrentUrl()

		if (currentUrl.includes('/admin/role-assignments')) {
			console.log('  ✅ Successfully accessed admin area')

			// Check for admin indicators
			const adminIndicators = await this.driver.findElements(
				By.xpath('//*[contains(text(), "Admin") or contains(text(), "admin")]'),
			)
			console.log(`  👮 Admin indicators found: ${adminIndicators.length}`)

			return true
		} else if (currentUrl.includes('/login')) {
			console.log('  🔒 Access denied - requires authentication')
			return false
		} else {
			console.log(
				'  ⚠️ Redirected to different page - may lack admin privileges',
			)
			console.log(`    Current page: ${currentUrl}`)

			// Check for error messages
			const errors = await this.driver.findElements(
				By.css('[role="alert"], .error, .alert'),
			)
			if (errors.length > 0) {
				const errorText = await errors[0].getText()
				console.log(`    Error message: ${errorText}`)
			}

			return false
		}
	}

	async captureScreenshot(name = 'role-assignments') {
		console.log('\n📸 Capturing Screenshot...')
		const screenshot = await this.driver.takeScreenshot()
		const fs = require('fs')
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		const filename = `${name}-${timestamp}.png`
		fs.writeFileSync(filename, screenshot, 'base64')
		console.log(`  ✅ Screenshot saved: ${filename}`)
		return filename
	}

	async runAllTests() {
		const startTime = Date.now()
		console.log('🚀 Starting Role Assignments Test Suite')
		console.log('========================================\n')

		try {
			await this.setup()
			console.log('✅ Browser initialized\n')

			await this.login()

			// Navigate to role assignments
			const hasAccess = await this.navigateToRoleAssignments()

			if (hasAccess) {
				// Run all test scenarios
				await this.testPageStructure()
				await this.testRoleCards()
				await this.testUserList()
				await this.testDragAndDrop()
				await this.testRoleAssignment()
				await this.testPermissions()
				await this.testAccessControl()

				// Capture final screenshot
				await this.captureScreenshot()
			} else {
				console.log('\n⚠️ Cannot proceed with tests - page not accessible')
				console.log('   Possible reasons:')
				console.log('   1. User "kody" may not have admin role')
				console.log('   2. Authentication session not persisting')
				console.log('   3. Route may be protected differently')

				// Still capture screenshot for debugging
				await this.captureScreenshot('role-assignments-blocked')
			}

			const duration = ((Date.now() - startTime) / 1000).toFixed(2)
			console.log('\n' + '='.repeat(50))
			console.log(`✅ Role Assignments tests completed in ${duration}s`)
			console.log('='.repeat(50))
		} catch (error) {
			console.error('\n❌ Test suite failed:', error.message)
			console.error('Stack:', error.stack)

			// Save error screenshot
			try {
				await this.captureScreenshot('role-assignments-error')
			} catch (e) {
				console.log('Could not save error screenshot')
			}

			throw error
		} finally {
			await this.teardown()
			console.log('\n🏁 Browser closed')
		}
	}
}

// Run the test suite
const runner = new RoleAssignmentsTestSuite()
runner.runAllTests().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
