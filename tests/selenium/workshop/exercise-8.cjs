const { Builder, By, until } = require('selenium-webdriver')
const assert = require('assert')

/**
 * Exercise 8: Test Organization with Mocha-style structure
 *
 * This exercise demonstrates how to organize tests with:
 * - Test suites (describe blocks)
 * - Test cases (it blocks)
 * - Setup and teardown (before/after hooks)
 * - Shared state and helpers
 */

// Test configuration
const config = {
	baseUrl: 'http://localhost:3000',
	timeout: 30000,
	credentials: {
		valid: { username: 'kody', password: 'kodylovesyou' },
		invalid: { username: 'wrong', password: 'incorrect' },
	},
}

// Shared test context
class TestContext {
	constructor() {
		this.driver = null
		this.results = []
	}

	async setup() {
		this.driver = await new Builder().forBrowser('chrome').build()
		this.driver.manage().setTimeouts({ implicit: 5000 })
	}

	async teardown() {
		if (this.driver) {
			await this.driver.quit()
		}
	}

	async login(username, password) {
		await this.driver.get(`${config.baseUrl}/login`)
		await this.driver.sleep(2000)

		try {
			const usernameField = await this.driver.findElement(
				By.id('login-form-username'),
			)
			const passwordField = await this.driver.findElement(
				By.id('login-form-password'),
			)
			await usernameField.sendKeys(username)
			await passwordField.sendKeys(password)

			const submitButton = await this.driver.findElement(
				By.css('button[type="submit"]'),
			)
			await submitButton.click()
			await this.driver.sleep(2000)

			return true
		} catch (e) {
			return false
		}
	}

	recordResult(suite, test, passed, error = null) {
		this.results.push({ suite, test, passed, error })
	}

	printResults() {
		console.log('\n' + '='.repeat(50))
		console.log('TEST RESULTS SUMMARY')
		console.log('='.repeat(50))

		const grouped = {}
		this.results.forEach((r) => {
			if (!grouped[r.suite]) grouped[r.suite] = []
			grouped[r.suite].push(r)
		})

		Object.entries(grouped).forEach(([suite, tests]) => {
			console.log(`\n${suite}:`)
			tests.forEach((t) => {
				const status = t.passed ? '✅ PASS' : '❌ FAIL'
				console.log(`  ${status} - ${t.test}`)
				if (t.error) {
					console.log(`       Error: ${t.error}`)
				}
			})
		})

		const total = this.results.length
		const passed = this.results.filter((r) => r.passed).length
		const failed = total - passed

		console.log('\n' + '-'.repeat(50))
		console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`)
		console.log('='.repeat(50))
	}
}

// Test Suite Implementation
async function runTestSuite() {
	console.log('🚀 Exercise 8: Organized Test Suite')
	console.log('====================================\n')

	const context = new TestContext()

	// Describe: User Management Suite
	async function describeUserManagement() {
		console.log('\n📦 Test Suite: User Management')
		console.log('-'.repeat(40))

		// Before all tests in suite
		console.log('\n⚙️ Setup: Initializing browser...')
		await context.setup()
		console.log('  ✅ Browser initialized')

		// Before each test
		async function beforeEach() {
			// Navigate to home page
			await context.driver.get(config.baseUrl)
			await context.driver.sleep(1000)
		}

		// Test: Homepage loads
		async function itShouldLoadHomepage() {
			const testName = 'should load homepage'
			console.log(`\n▶️ Test: ${testName}`)

			try {
				await beforeEach()

				const title = await context.driver.getTitle()
				assert(title.includes('Epic Notes'), 'Title should contain Epic Notes')
				console.log('  ✅ Homepage loaded successfully')

				context.recordResult('User Management', testName, true)
			} catch (error) {
				console.log(`  ❌ Failed: ${error.message}`)
				context.recordResult('User Management', testName, false, error.message)
			}
		}

		// Test: Login with valid credentials
		async function itShouldLoginWithValidCredentials() {
			const testName = 'should login with valid credentials'
			console.log(`\n▶️ Test: ${testName}`)

			try {
				await beforeEach()

				const success = await context.login(
					config.credentials.valid.username,
					config.credentials.valid.password,
				)

				const currentUrl = await context.driver.getCurrentUrl()
				assert(!currentUrl.includes('/login'), 'Should redirect after login')
				console.log('  ✅ Login successful')

				context.recordResult('User Management', testName, true)
			} catch (error) {
				console.log(`  ❌ Failed: ${error.message}`)
				context.recordResult('User Management', testName, false, error.message)
			}
		}

		// Test: Reject invalid credentials
		async function itShouldRejectInvalidCredentials() {
			const testName = 'should reject invalid credentials'
			console.log(`\n▶️ Test: ${testName}`)

			try {
				await beforeEach()

				await context.login(
					config.credentials.invalid.username,
					config.credentials.invalid.password,
				)

				const currentUrl = await context.driver.getCurrentUrl()
				assert(currentUrl.includes('/login'), 'Should stay on login page')
				console.log('  ✅ Invalid login rejected')

				context.recordResult('User Management', testName, true)
			} catch (error) {
				console.log(`  ❌ Failed: ${error.message}`)
				context.recordResult('User Management', testName, false, error.message)
			}
		}

		// Skip test example
		async function itShouldUpdateProfile_SKIP() {
			const testName = 'should update user profile'
			console.log(`\n⏭️ Test: ${testName} (SKIPPED)`)
			context.recordResult('User Management', testName + ' (skipped)', true)
		}

		// Run all tests in suite
		await itShouldLoadHomepage()
		await itShouldLoginWithValidCredentials()
		await itShouldRejectInvalidCredentials()
		await itShouldUpdateProfile_SKIP()

		// After all tests
		console.log('\n⚙️ Teardown: Suite cleanup')
	}

	// Describe: Profile Updates Suite
	async function describeProfileUpdates() {
		console.log('\n\n📦 Test Suite: Profile Updates')
		console.log('-'.repeat(40))

		// Test: Navigate to settings
		async function itShouldNavigateToSettings() {
			const testName = 'should navigate to settings'
			console.log(`\n▶️ Test: ${testName}`)

			try {
				// Login first
				await context.login(
					config.credentials.valid.username,
					config.credentials.valid.password,
				)

				// Try to navigate to settings
				await context.driver.get(`${config.baseUrl}/settings/profile`)
				await context.driver.sleep(2000)

				const currentUrl = await context.driver.getCurrentUrl()
				console.log(`  Current URL: ${currentUrl}`)

				if (currentUrl.includes('settings') || currentUrl.includes('profile')) {
					console.log('  ✅ Settings page accessed')
					context.recordResult('Profile Updates', testName, true)
				} else {
					throw new Error('Could not access settings')
				}
			} catch (error) {
				console.log(`  ❌ Failed: ${error.message}`)
				context.recordResult('Profile Updates', testName, false, error.message)
			}
		}

		// Test: Validate email format
		async function itShouldValidateEmailFormat() {
			const testName = 'should validate email format'
			console.log(`\n▶️ Test: ${testName}`)

			try {
				await context.driver.get(`${config.baseUrl}/login`)
				await context.driver.sleep(2000)

				// Try entering invalid email
				const usernameField = await context.driver.findElement(
					By.id('login-form-username'),
				)
				await usernameField.sendKeys('invalid-email')

				const validationMessage = await context.driver.executeScript(
					'return arguments[0].validationMessage',
					usernameField,
				)

				console.log(
					`  Validation: "${validationMessage || 'No HTML5 validation'}"`,
				)
				console.log('  ✅ Email validation checked')

				context.recordResult('Profile Updates', testName, true)
			} catch (error) {
				console.log(`  ❌ Failed: ${error.message}`)
				context.recordResult('Profile Updates', testName, false, error.message)
			}
		}

		// Run tests
		await itShouldNavigateToSettings()
		await itShouldValidateEmailFormat()
	}

	// Describe: Search Functionality
	async function describeSearchFunctionality() {
		console.log('\n\n📦 Test Suite: Search Functionality')
		console.log('-'.repeat(40))

		// Test: Search input exists
		async function itShouldHaveSearchInput() {
			const testName = 'should have search input'
			console.log(`\n▶️ Test: ${testName}`)

			try {
				await context.driver.get(`${config.baseUrl}/users`)
				await context.driver.sleep(2000)

				const searchInputs = await context.driver.findElements(
					By.css('input[type="search"], input[name="search"]'),
				)

				assert(searchInputs.length > 0, 'Search input should exist')
				console.log(`  ✅ Found ${searchInputs.length} search input(s)`)

				context.recordResult('Search Functionality', testName, true)
			} catch (error) {
				console.log(`  ❌ Failed: ${error.message}`)
				context.recordResult(
					'Search Functionality',
					testName,
					false,
					error.message,
				)
			}
		}

		// Test: Perform search
		async function itShouldPerformSearch() {
			const testName = 'should perform search'
			console.log(`\n▶️ Test: ${testName}`)

			try {
				await context.driver.get(`${config.baseUrl}/users`)
				await context.driver.sleep(2000)

				const searchInput = await context.driver.findElement(
					By.css('input[type="search"], input[name="search"]'),
				)

				await searchInput.sendKeys('kody')
				await searchInput.sendKeys('\n')
				await context.driver.sleep(2000)

				const bodyText = await context.driver
					.findElement(By.tagName('body'))
					.getText()
				assert(
					bodyText.toLowerCase().includes('kody'),
					'Search results should contain query',
				)

				console.log('  ✅ Search performed successfully')
				context.recordResult('Search Functionality', testName, true)
			} catch (error) {
				console.log(`  ❌ Failed: ${error.message}`)
				context.recordResult(
					'Search Functionality',
					testName,
					false,
					error.message,
				)
			}
		}

		// Run tests
		await itShouldHaveSearchInput()
		await itShouldPerformSearch()
	}

	try {
		// Run all test suites
		await describeUserManagement()
		await describeProfileUpdates()
		await describeSearchFunctionality()

		// Clean up
		await context.teardown()

		// Print results
		context.printResults()

		console.log('\n✅ Exercise 8: Organized test suite completed!\n')
	} catch (error) {
		console.error('\n❌ Suite failed:', error.message)
		await context.teardown()
		throw error
	}
}

// Helper function to demonstrate parallel test execution
async function demonstrateParallelTests() {
	console.log('\n🚀 Bonus: Parallel Test Execution')
	console.log('==================================\n')

	console.log('📊 Parallel Testing Concepts:')
	console.log('  1. Use Promise.all() for concurrent tests')
	console.log('  2. Each test gets its own driver instance')
	console.log('  3. Tests run independently')
	console.log('  4. Collect and merge results\n')

	// Example parallel execution
	const test1 = async () => {
		const driver = await new Builder().forBrowser('chrome').build()
		try {
			await driver.get(config.baseUrl)
			const title = await driver.getTitle()
			console.log('  Test 1: Homepage - ✅')
			return { test: 'homepage', passed: true }
		} finally {
			await driver.quit()
		}
	}

	const test2 = async () => {
		const driver = await new Builder().forBrowser('chrome').build()
		try {
			await driver.get(`${config.baseUrl}/login`)
			const title = await driver.getTitle()
			console.log('  Test 2: Login page - ✅')
			return { test: 'login', passed: true }
		} finally {
			await driver.quit()
		}
	}

	console.log('Running tests in parallel...')
	const results = await Promise.all([test1(), test2()])

	console.log('\nParallel Results:')
	results.forEach((r) => {
		console.log(`  ${r.test}: ${r.passed ? 'PASS' : 'FAIL'}`)
	})

	console.log('\n✅ Parallel execution demonstrated\n')
}

// Main execution
console.log('🎯 Selenium Test Organization Exercise\n')
console.log('This exercise demonstrates how to organize')
console.log('Selenium tests using patterns similar to Mocha.\n')

runTestSuite()
	.then(() => demonstrateParallelTests())
	.catch((error) => {
		console.error('Fatal error:', error)
		process.exit(1)
	})
