const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const fs = require('fs')

class ProjectsRouteTester {
	constructor(baseUrl = 'http://localhost:3000') {
		this.baseUrl = baseUrl
		this.driver = null
		this.cookies = null
	}

	async setup(headless = false) {
		const options = new chrome.Options()
		if (headless) {
			options.addArguments('--headless=new')
		}
		options.addArguments('--disable-dev-shm-usage')
		options.addArguments('--no-sandbox')
		options.addArguments('--window-size=1920,1080')

		// Enable logging to debug session issues
		options.setUserPreferences({
			'profile.cookie_behavior': 0,
			'profile.default_content_settings.cookies': 1,
		})

		this.driver = await new Builder()
			.forBrowser('chrome')
			.setChromeOptions(options)
			.build()

		await this.driver.manage().setTimeouts({
			implicit: 10000,
			pageLoad: 30000,
			script: 30000,
		})

		console.log('✅ Browser initialized')
	}

	async teardown() {
		if (this.driver) {
			await this.driver.quit()
			console.log('🏁 Browser closed')
		}
	}

	async saveCookies() {
		this.cookies = await this.driver.manage().getCookies()
		console.log(`  💾 Saved ${this.cookies.length} cookies`)
	}

	async loadCookies() {
		if (this.cookies && this.cookies.length > 0) {
			for (const cookie of this.cookies) {
				await this.driver.manage().addCookie(cookie)
			}
			console.log(`  🍪 Loaded ${this.cookies.length} cookies`)
		}
	}

	async login(username = 'kody', password = 'kodylovesyou') {
		console.log('\n📝 Logging in...')

		await this.driver.get(`${this.baseUrl}/login`)
		await this.driver.sleep(2000)

		// Wait for and fill username
		const usernameField = await this.driver.wait(
			until.elementLocated(By.css('#login-form-username')),
			10000,
		)
		await usernameField.clear()
		await usernameField.sendKeys(username)
		console.log('  ✓ Username entered')

		// Fill password
		const passwordField = await this.driver.findElement(
			By.css('#login-form-password'),
		)
		await passwordField.clear()
		await passwordField.sendKeys(password)
		console.log('  ✓ Password entered')

		// Check remember me to help with session persistence
		try {
			const rememberMe = await this.driver.findElement(
				By.css('#login-form-remember'),
			)
			await rememberMe.click()
			console.log('  ✓ Remember me checked')
		} catch (e) {
			// Remember me might not exist or already be checked
		}

		// Submit form
		const submitButton = await this.driver.findElement(
			By.css('button[type="submit"]'),
		)
		await submitButton.click()

		// Wait for redirect
		await this.driver.wait(async () => {
			const url = await this.driver.getCurrentUrl()
			return !url.includes('/login')
		}, 10000)

		await this.driver.sleep(2000)

		const currentUrl = await this.driver.getCurrentUrl()
		console.log(`  📍 After login URL: ${currentUrl}`)

		// Save cookies for session persistence
		await this.saveCookies()

		// Verify login was successful
		const bodyText = await this.driver.findElement(By.tagName('body')).getText()
		if (bodyText.includes('Kody') || bodyText.includes('kody')) {
			console.log('  ✅ Login successful - user "kody" found on page')
			return true
		} else {
			console.log('  ⚠️ Login might have failed - username not found on page')
			return false
		}
	}

	async testProjectsRoute() {
		console.log('\n🔍 Testing /projects route...\n')

		// Method 1: Direct navigation with cookies
		console.log('Method 1: Direct navigation with session cookies')
		console.log('  Navigating to /projects...')

		await this.driver.get(`${this.baseUrl}/projects`)
		await this.driver.sleep(3000)

		let currentUrl = await this.driver.getCurrentUrl()
		let pageTitle = await this.driver.getTitle()
		let bodyText = await this.driver.findElement(By.tagName('body')).getText()

		console.log(`  📍 Current URL: ${currentUrl}`)
		console.log(`  📄 Page title: ${pageTitle}`)

		if (currentUrl.includes('/login')) {
			console.log('  ❌ Redirected to login - session lost')

			// Try to re-login and navigate again
			console.log('\n  Attempting to login again and navigate...')
			await this.login()

			// Load cookies and try again
			await this.loadCookies()
			await this.driver.get(`${this.baseUrl}/projects`)
			await this.driver.sleep(3000)

			currentUrl = await this.driver.getCurrentUrl()
			pageTitle = await this.driver.getTitle()
			bodyText = await this.driver.findElement(By.tagName('body')).getText()

			console.log(`  📍 Second attempt URL: ${currentUrl}`)
		}

		// Analyze the page
		console.log('\n📊 Page Analysis:')

		if (currentUrl.includes('/projects')) {
			console.log('  ✅ Successfully on /projects route!')

			// Look for project-related elements
			await this.analyzeProjectsPage()
		} else if (currentUrl.includes('/login')) {
			console.log('  ❌ Still on login page')
			console.log('  The /projects route exists but requires authentication')
			console.log('  Session persistence issue preventing access')
		} else {
			console.log(`  ⚠️ Redirected to: ${currentUrl}`)

			// Check if it's a 404 page
			if (bodyText.includes("can't find") || bodyText.includes('404')) {
				console.log('  ❌ 404 Error - Route does not exist')
			} else {
				console.log('  Route exists but redirected elsewhere')
			}
		}

		// Method 2: Try via JavaScript navigation
		console.log('\n\nMethod 2: JavaScript navigation')
		await this.driver.executeScript(
			`window.location.href = '${this.baseUrl}/projects'`,
		)
		await this.driver.sleep(3000)

		currentUrl = await this.driver.getCurrentUrl()
		console.log(`  📍 After JS navigation: ${currentUrl}`)

		// Method 3: Check if route exists in the application
		console.log('\n\nMethod 3: Route detection')
		const routeCheck = await this.driver.executeScript(`
      // Check if there are any links to /projects
      const links = Array.from(document.querySelectorAll('a'));
      const projectLinks = links.filter(a => a.href && a.href.includes('/projects'));
      return {
        linksFound: projectLinks.length,
        hrefs: projectLinks.map(a => a.href)
      };
    `)

		console.log(`  Found ${routeCheck.linksFound} links to /projects`)
		if (routeCheck.hrefs.length > 0) {
			console.log('  Links:', routeCheck.hrefs)
		}
	}

	async analyzeProjectsPage() {
		console.log('\n  🔎 Analyzing Projects Page:')

		// Look for forms
		const forms = await this.driver.findElements(By.css('form'))
		console.log(`    Forms found: ${forms.length}`)

		// Look for input fields
		const inputs = await this.driver.findElements(
			By.css('input[type="text"], input[name="name"], input[name="title"]'),
		)
		console.log(`    Text input fields: ${inputs.length}`)

		if (inputs.length > 0) {
			for (let i = 0; i < Math.min(3, inputs.length); i++) {
				const name = await inputs[i].getAttribute('name')
				const placeholder = await inputs[i].getAttribute('placeholder')
				const id = await inputs[i].getAttribute('id')
				console.log(
					`      Input ${i + 1}: name="${name}", placeholder="${placeholder}", id="${id}"`,
				)
			}
		}

		// Look for textareas
		const textareas = await this.driver.findElements(By.css('textarea'))
		console.log(`    Textareas: ${textareas.length}`)

		// Look for buttons
		const buttons = await this.driver.findElements(By.css('button'))
		console.log(`    Buttons: ${buttons.length}`)

		// Look for project-specific elements
		const projectElements = await this.driver.findElements(
			By.xpath(
				'//*[contains(@class, "project") or contains(@id, "project") or contains(text(), "Project")]',
			),
		)
		console.log(`    Elements with "project": ${projectElements.length}`)

		// Get page structure
		const bodyText = await this.driver.findElement(By.tagName('body')).getText()
		const lines = bodyText.split('\n').filter((line) => line.trim())

		console.log('\n  📝 Page Content (first 20 lines):')
		lines.slice(0, 20).forEach((line, i) => {
			console.log(
				`    ${(i + 1).toString().padStart(2)}. ${line.substring(0, 60)}`,
			)
		})

		// Try to create a project if form exists
		if (forms.length > 0 && inputs.length > 0) {
			console.log('\n  🚀 Attempting to create a project:')

			try {
				const nameInput = inputs[0]
				const projectName = `Test Project ${Date.now()}`

				await nameInput.clear()
				await nameInput.sendKeys(projectName)
				console.log(`    Entered project name: ${projectName}`)

				// Look for description field
				if (textareas.length > 0) {
					await textareas[0].clear()
					await textareas[0].sendKeys('Created by Selenium automated test')
					console.log('    Entered description')
				}

				// Find submit button
				const submitButtons = await this.driver.findElements(
					By.css(
						'button[type="submit"], button:contains("Create"), button:contains("Save")',
					),
				)

				if (submitButtons.length > 0) {
					await submitButtons[0].click()
					console.log('    Clicked submit button')
					await this.driver.sleep(2000)

					// Check if project was created
					const newBodyText = await this.driver
						.findElement(By.tagName('body'))
						.getText()
					if (newBodyText.includes(projectName)) {
						console.log('    ✅ Project created successfully!')
					} else {
						console.log('    ⚠️ Project creation status unclear')
					}
				}
			} catch (e) {
				console.log(`    ❌ Error creating project: ${e.message}`)
			}
		}
	}

	async takeScreenshot(name = 'projects-test') {
		try {
			const screenshot = await this.driver.takeScreenshot()
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
			const filename = `${name}-${timestamp}.png`
			fs.writeFileSync(filename, screenshot, 'base64')
			console.log(`\n📸 Screenshot saved: ${filename}`)
		} catch (e) {
			console.log('Could not take screenshot:', e.message)
		}
	}

	async run() {
		const startTime = Date.now()
		console.log('🚀 Starting /projects Route Test')
		console.log('=================================\n')

		try {
			await this.setup()

			// First, login
			const loginSuccess = await this.login()

			if (loginSuccess) {
				// Test the projects route
				await this.testProjectsRoute()
			} else {
				console.log('\n❌ Cannot test /projects route - login failed')
			}

			// Take final screenshot
			await this.takeScreenshot()

			const duration = ((Date.now() - startTime) / 1000).toFixed(2)
			console.log('\n=================================')
			console.log(`✅ Test completed in ${duration}s`)
			console.log('=================================')
		} catch (error) {
			console.error('\n❌ Test failed:', error.message)
			await this.takeScreenshot('error')
			throw error
		} finally {
			await this.teardown()
		}
	}
}

// Run the test
const tester = new ProjectsRouteTester()
tester.run().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
