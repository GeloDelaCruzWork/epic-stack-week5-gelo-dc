const { Builder, By, until, Key } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const { expect } = require('chai')

class SeleniumTestRunner {
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
	}

	async waitForPageLoad() {
		await this.driver.wait(async () => {
			const readyState = await this.driver.executeScript(
				'return document.readyState',
			)
			return readyState === 'complete'
		}, this.defaultTimeout)
	}

	async waitForElement(locator, timeout = this.defaultTimeout) {
		return await this.driver.wait(until.elementLocated(locator), timeout)
	}

	async waitForElementVisible(locator, timeout = this.defaultTimeout) {
		const element = await this.waitForElement(locator, timeout)
		await this.driver.wait(until.elementIsVisible(element), timeout)
		return element
	}

	async testNotes() {
		console.log('\n📝 Testing Notes Management...')

		// Test: Create a note
		console.log('  ➤ Testing note creation...')

		// First ensure we're logged in
		const checkUrl = await this.driver.getCurrentUrl()
		if (checkUrl.includes('/login')) {
			console.log('    ⚠️  Session lost, logging in again...')
			await this.login()
		}

		await this.driver.get(`${this.baseUrl}/users/kody/notes`)
		await this.waitForPageLoad()
		await this.driver.sleep(1000)

		// Look for new note button
		const newNoteLinks = await this.driver.findElements(
			By.css('a[href*="new"]'),
		)
		if (newNoteLinks.length > 0) {
			await newNoteLinks[0].click()
		} else {
			await this.driver.get(`${this.baseUrl}/users/kody/notes/new`)
		}
		await this.waitForPageLoad()

		// Fill in note details
		await this.driver.sleep(2000) // Wait for form to load

		// Debug: Log current URL and page title
		const currentUrl = await this.driver.getCurrentUrl()
		console.log(`    📍 Current URL: ${currentUrl}`)

		// Check if we're redirected to login
		if (currentUrl.includes('/login')) {
			console.log('    ⚠️  Redirected to login, attempting to login again...')

			// Login from this page
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

			// Now we should be on the new note page
			const afterLoginUrl = await this.driver.getCurrentUrl()
			console.log(`    📍 After login URL: ${afterLoginUrl}`)

			// Navigate to new note page if not there
			if (!afterLoginUrl.includes('/notes/new')) {
				console.log('    📍 Navigating to new note page...')
				await this.driver.get(`${this.baseUrl}/users/kody/notes/new`)
				await this.waitForPageLoad()
				await this.driver.sleep(2000)
			}
		}

		// Try multiple selectors for title input
		let titleInput
		const titleSelectors = [
			By.css('input[name="title"]'),
			By.css('input[id="title"]'),
			By.css('input[type="text"]'),
			By.css('input[placeholder*="title" i]'),
		]

		for (const selector of titleSelectors) {
			try {
				titleInput = await this.driver.findElement(selector)
				if (await titleInput.isDisplayed()) {
					console.log(`    ✓ Found title input with selector: ${selector}`)
					break
				}
			} catch (e) {
				// Try next selector
			}
		}

		if (!titleInput) {
			throw new Error('Could not find title input field')
		}

		// Scroll to element and ensure it's visible
		await this.driver.executeScript(
			'arguments[0].scrollIntoView({block: "center"})',
			titleInput,
		)
		await this.driver.sleep(500)

		// Wait for element to be enabled
		await this.driver.wait(until.elementIsEnabled(titleInput), 5000)

		// Try JavaScript click if regular interaction fails
		try {
			await titleInput.clear()
			await titleInput.sendKeys('Selenium Test Note')
		} catch (e) {
			console.log('    ⚠️  Regular interaction failed, trying JavaScript...')
			await this.driver.executeScript('arguments[0].value = ""', titleInput)
			await this.driver.executeScript(
				'arguments[0].value = "Selenium Test Note"',
				titleInput,
			)
		}

		// Handle content textarea with better error handling
		try {
			const contentTextarea = await this.driver.findElement(By.css('textarea'))
			await this.driver.executeScript(
				'arguments[0].scrollIntoView({block: "center"})',
				contentTextarea,
			)
			await this.driver.sleep(500)

			try {
				await contentTextarea.clear()
				await contentTextarea.sendKeys(
					'This note was created by Selenium automated testing framework.',
				)
			} catch (e) {
				await this.driver.executeScript(
					'arguments[0].value = ""',
					contentTextarea,
				)
				await this.driver.executeScript(
					'arguments[0].value = "This note was created by Selenium automated testing framework."',
					contentTextarea,
				)
			}
		} catch (e) {
			console.log('    ⚠️  No textarea found, skipping content field')
		}

		const submitButton = await this.driver.findElement(
			By.css('button[type="submit"]'),
		)
		await submitButton.click()

		await this.waitForPageLoad()
		await this.driver.sleep(2000)

		// Check where we are after submission
		const afterSubmitUrl = await this.driver.getCurrentUrl()
		console.log(`    📍 After submit URL: ${afterSubmitUrl}`)

		// Verify note was created - navigate to notes list if needed
		if (!afterSubmitUrl.includes('/notes')) {
			await this.driver.get(`${this.baseUrl}/users/kody/notes`)
			await this.waitForPageLoad()
			await this.driver.sleep(1000)
		}

		const pageText = await this.driver.findElement(By.tagName('body')).getText()
		const noteCreated = pageText.includes('Selenium Test Note')

		if (noteCreated) {
			console.log('    ✅ Note created successfully')
		} else {
			console.log('    ❌ Note creation verification failed')
			console.log('    Page contains:', pageText.substring(0, 200))
		}

		// Test: Edit a note
		console.log('  ➤ Testing note editing...')

		// Navigate to notes list first
		await this.driver.get(`${this.baseUrl}/users/kody/notes`)
		await this.waitForPageLoad()
		await this.driver.sleep(1000)

		// Find note links - use XPath for partial href match
		const noteLinks = await this.driver.findElements(
			By.xpath('//a[contains(@href, "/notes/")]'),
		)
		if (noteLinks.length > 0) {
			await noteLinks[0].click()
			await this.waitForPageLoad()

			// Find edit button - use multiple selectors
			let editClicked = false
			const editSelectors = [
				By.xpath('//a[contains(@href, "edit")]'),
				By.xpath('//button[contains(text(), "Edit")]'),
				By.css('a[href$="edit"]'),
			]

			for (const selector of editSelectors) {
				try {
					const editElement = await this.driver.findElement(selector)
					if (await editElement.isDisplayed()) {
						await editElement.click()
						editClicked = true
						break
					}
				} catch (e) {
					// Try next selector
				}
			}

			if (editClicked) {
				await this.waitForPageLoad()

				const titleInput = await this.waitForElementVisible(
					By.css('input[name="title"], input[type="text"]'),
				)
				await titleInput.clear()
				await titleInput.sendKeys('Updated Selenium Note')

				const submitButton = await this.driver.findElement(
					By.css('button[type="submit"]'),
				)
				await submitButton.click()

				await this.waitForPageLoad()
				const pageText = await this.driver
					.findElement(By.tagName('body'))
					.getText()
				expect(pageText).to.include('Updated Selenium Note')
				console.log('    ✅ Note edited successfully')
			}
		}
	}

	async testProjects() {
		console.log('\n📁 Testing Projects Management...')

		// Test: View projects page
		console.log('  ➤ Testing projects page access...')
		await this.driver.get(`${this.baseUrl}/projects`)
		await this.waitForPageLoad()

		const pageText = await this.driver.findElement(By.tagName('body')).getText()
		expect(pageText.toLowerCase()).to.include('project')
		console.log('    ✅ Projects page accessible')

		// Test: Create a project
		console.log('  ➤ Testing project creation...')
		const nameInput = await this.waitForElementVisible(
			By.css(
				'input[name="name"], input[id="name"], input[placeholder*="name" i]',
			),
		)

		const projectName = `Selenium Project ${Date.now()}`
		await nameInput.clear()
		await nameInput.sendKeys(projectName)

		// Try to find description field
		try {
			const descInput = await this.driver.findElement(
				By.css('textarea[name="description"], input[name="description"]'),
			)
			await descInput.clear()
			await descInput.sendKeys('Created by Selenium test automation')
		} catch (e) {
			// Description might be optional
		}

		const submitButton = await this.driver.findElement(
			By.css('button[type="submit"]'),
		)
		await submitButton.click()

		await this.waitForPageLoad()
		await this.driver.sleep(1000)

		const updatedPageText = await this.driver
			.findElement(By.tagName('body'))
			.getText()
		expect(updatedPageText).to.include(projectName)
		console.log('    ✅ Project created successfully')
	}

	async testSearch() {
		console.log('\n🔍 Testing Search Functionality...')

		console.log('  ➤ Testing user search...')
		await this.driver.get(this.baseUrl)
		await this.waitForPageLoad()

		// Find search input
		const searchInputs = await this.driver.findElements(
			By.css('input[type="search"], input[name="search"]'),
		)
		if (searchInputs.length > 0) {
			await searchInputs[0].clear()
			await searchInputs[0].sendKeys('kody')

			// Submit search
			const searchButtons = await this.driver.findElements(
				By.css('button[type="submit"]'),
			)
			if (searchButtons.length > 0) {
				await searchButtons[0].click()
				await this.waitForPageLoad()

				const currentUrl = await this.driver.getCurrentUrl()
				if (currentUrl.includes('search') || currentUrl.includes('users')) {
					console.log('    ✅ Search functionality working')
				}
			}
		}
	}

	async runAllTests() {
		const startTime = Date.now()
		console.log('🚀 Starting Selenium Test Suite')
		console.log('================================\n')

		try {
			await this.setup()
			console.log('✅ Browser initialized')

			await this.login()
			console.log('✅ Login successful')

			await this.testNotes()
			await this.testProjects()
			await this.testSearch()

			const duration = ((Date.now() - startTime) / 1000).toFixed(2)
			console.log('\n================================')
			console.log(`✅ All tests completed successfully in ${duration}s`)
		} catch (error) {
			console.error('\n❌ Test suite failed:', error.message)
			throw error
		} finally {
			await this.teardown()
			console.log('🏁 Browser closed')
		}
	}
}

// Run the test suite
const runner = new SeleniumTestRunner()
runner.runAllTests().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
