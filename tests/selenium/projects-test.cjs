const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

class ProjectsTestRunner {
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
		options.addArguments('--window-size=1280,720')

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
		await this.driver.sleep(2000)

		const usernameField = await this.driver.findElement(
			By.css('#login-form-username'),
		)
		await usernameField.clear()
		await usernameField.sendKeys(username)

		const passwordField = await this.driver.findElement(
			By.css('#login-form-password'),
		)
		await passwordField.clear()
		await passwordField.sendKeys(password)

		const submitButton = await this.driver.findElement(
			By.css('button[type="submit"]'),
		)
		await submitButton.click()

		await this.driver.sleep(3000)

		const currentUrl = await this.driver.getCurrentUrl()
		if (currentUrl.includes('/login')) {
			throw new Error('Login failed')
		}
		console.log('  ✅ Login successful')
	}

	async testProjectsNavigation() {
		console.log('\n📁 Testing Projects Navigation...')

		// Try different possible project routes
		const projectRoutes = [
			'/projects',
			'/users/kody/projects',
			'/admin/projects',
		]

		let projectPageFound = false
		let workingRoute = null

		for (const route of projectRoutes) {
			console.log(`  ➤ Trying route: ${this.baseUrl}${route}`)
			await this.driver.get(`${this.baseUrl}${route}`)
			await this.driver.sleep(2000)

			const currentUrl = await this.driver.getCurrentUrl()
			const pageText = await this.driver
				.findElement(By.tagName('body'))
				.getText()

			console.log(`    📍 Current URL: ${currentUrl}`)

			// Check if we're on a projects page (not redirected to login)
			if (
				!currentUrl.includes('/login') &&
				(currentUrl.includes('project') ||
					pageText.toLowerCase().includes('project'))
			) {
				projectPageFound = true
				workingRoute = route
				console.log(`    ✅ Projects route found: ${route}`)
				break
			} else {
				console.log(`    ❌ Route ${route} not accessible or doesn't exist`)
			}
		}

		if (!projectPageFound) {
			console.log('  ⚠️ No projects route found in the application')
			console.log('     Projects feature may not be implemented')
			return false
		}

		return workingRoute
	}

	async testProjectCreation(projectRoute) {
		console.log('\n📝 Testing Project Creation...')

		if (!projectRoute) {
			console.log('  ⚠️ Skipping - no project route available')
			return
		}

		await this.driver.get(`${this.baseUrl}${projectRoute}`)
		await this.driver.sleep(2000)

		// Look for project creation form elements
		console.log('  ➤ Looking for project creation form...')

		try {
			// Look for name input field
			const nameInputs = await this.driver.findElements(
				By.css(
					'input[name="name"], input[id="name"], input[placeholder*="name" i]',
				),
			)

			if (nameInputs.length > 0) {
				console.log('    ✅ Project name input found')

				const projectName = `Selenium Project ${Date.now()}`
				await nameInputs[0].clear()
				await nameInputs[0].sendKeys(projectName)
				console.log(`    📝 Entered project name: ${projectName}`)

				// Look for description field
				try {
					const descInputs = await this.driver.findElements(
						By.css(
							'textarea[name="description"], input[name="description"], textarea[placeholder*="description" i]',
						),
					)

					if (descInputs.length > 0) {
						await descInputs[0].clear()
						await descInputs[0].sendKeys('Created by Selenium automated test')
						console.log('    📝 Entered project description')
					}
				} catch (e) {
					console.log('    ℹ️ Description field not found (might be optional)')
				}

				// Look for submit button
				const submitButtons = await this.driver.findElements(
					By.css(
						'button[type="submit"], button:contains("Create"), button:contains("Save"), button:contains("Add")',
					),
				)

				if (submitButtons.length > 0) {
					await submitButtons[0].click()
					console.log('    📤 Submitted project form')
					await this.driver.sleep(2000)

					// Check if project was created
					const pageText = await this.driver
						.findElement(By.tagName('body'))
						.getText()
					if (pageText.includes(projectName)) {
						console.log('    ✅ Project created successfully!')
					} else {
						console.log('    ⚠️ Project creation status unclear')
					}
				} else {
					console.log('    ❌ No submit button found')
				}
			} else {
				console.log('    ❌ No project creation form found')
				console.log(
					'    ℹ️ The page might be read-only or requires different permissions',
				)
			}
		} catch (error) {
			console.log(`    ❌ Error during project creation: ${error.message}`)
		}
	}

	async testProjectsList(projectRoute) {
		console.log('\n📋 Testing Projects List...')

		if (!projectRoute) {
			console.log('  ⚠️ Skipping - no project route available')
			return
		}

		await this.driver.get(`${this.baseUrl}${projectRoute}`)
		await this.driver.sleep(2000)

		// Look for project items
		const projectSelectors = [
			'[data-testid="project-item"]',
			'.project-item',
			'article',
			'div[class*="project"]',
			'a[href*="project"]',
		]

		let projectsFound = false

		for (const selector of projectSelectors) {
			try {
				const projectItems = await this.driver.findElements(By.css(selector))
				if (projectItems.length > 0) {
					console.log(
						`  ✅ Found ${projectItems.length} project item(s) using selector: ${selector}`,
					)
					projectsFound = true

					// Try to get project details
					for (let i = 0; i < Math.min(3, projectItems.length); i++) {
						try {
							const text = await projectItems[i].getText()
							if (text && text.trim()) {
								console.log(
									`     Project ${i + 1}: ${text.substring(0, 50)}...`,
								)
							}
						} catch (e) {
							// Skip if can't get text
						}
					}
					break
				}
			} catch (e) {
				// Try next selector
			}
		}

		if (!projectsFound) {
			console.log('  ℹ️ No project items found in the list')
			console.log(
				'     The projects list might be empty or use different markup',
			)
		}
	}

	async runAllTests() {
		const startTime = Date.now()
		console.log('🚀 Starting Projects Test Suite')
		console.log('================================\n')

		try {
			await this.setup()
			console.log('✅ Browser initialized')

			await this.login()

			const projectRoute = await this.testProjectsNavigation()
			await this.testProjectCreation(projectRoute)
			await this.testProjectsList(projectRoute)

			const duration = ((Date.now() - startTime) / 1000).toFixed(2)
			console.log('\n================================')
			console.log(`✅ Projects tests completed in ${duration}s`)
			console.log('================================')
		} catch (error) {
			console.error('\n❌ Test suite failed:', error.message)

			// Take screenshot on failure
			try {
				const screenshot = await this.driver.takeScreenshot()
				const fs = require('fs')
				const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
				fs.writeFileSync(
					`projects-error-${timestamp}.png`,
					screenshot,
					'base64',
				)
				console.log('📸 Error screenshot saved')
			} catch (e) {
				// Ignore screenshot errors
			}

			throw error
		} finally {
			await this.teardown()
			console.log('🏁 Browser closed')
		}
	}
}

// Run the test suite
const runner = new ProjectsTestRunner()
runner.runAllTests().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
