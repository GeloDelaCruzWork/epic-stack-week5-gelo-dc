const { Builder } = require('selenium-webdriver')
const LoginPage = require('./pages/LoginPage.cjs')
const assert = require('assert')

/**
 * Exercise 6: Page Object Model Test
 *
 * This exercise demonstrates the Page Object Model pattern
 * for better test organization and maintainability
 */

async function testLoginWithPageObject() {
	console.log('🚀 Exercise 6: Page Object Model Test')
	console.log('======================================\n')

	const driver = await new Builder().forBrowser('chrome').build()

	try {
		// Create page object instance
		const loginPage = new LoginPage(driver)

		console.log('📄 Using LoginPage Page Object\n')

		// Test 1: Navigate to login page
		console.log('Test 1: Navigation')
		await loginPage.goto()
		const title = await loginPage.getPageTitle()
		console.log(`  ✅ Navigated to: ${title}`)
		assert(await loginPage.isOnLoginPage(), 'Should be on login page')
		console.log('  ✅ Confirmed on login page\n')

		// Test 2: Check field requirements
		console.log('Test 2: Field Requirements')
		const usernameRequired = await loginPage.isFieldRequired('username')
		const passwordRequired = await loginPage.isFieldRequired('password')
		console.log(`  Username required: ${usernameRequired}`)
		console.log(`  Password required: ${passwordRequired}`)
		console.log('  ✅ Field requirements checked\n')

		// Test 3: Test empty form submission
		console.log('Test 3: Empty Form Validation')
		await loginPage.submit()
		await driver.sleep(1000)

		if (await loginPage.isOnLoginPage()) {
			console.log('  ✅ Still on login page (validation prevented submit)')

			const hasError = await loginPage.hasError()
			if (hasError) {
				const errorMsg = await loginPage.getErrorMessage()
				console.log(`  Error message: "${errorMsg}"`)
			} else {
				console.log('  No visible error messages (HTML5 validation)')
			}
		} else {
			console.log('  Page navigated (server-side validation)')
		}
		console.log('  ✅ Empty form validation tested\n')

		// Test 4: Test invalid credentials
		console.log('Test 4: Invalid Credentials')
		if (!(await loginPage.isOnLoginPage())) {
			await loginPage.goto()
		}

		await loginPage
			.enterUsername('invalid@user.com')
			.then((page) => page.enterPassword('wrongpassword'))
			.then((page) => page.submit())

		await driver.sleep(2000)

		if (await loginPage.isOnLoginPage()) {
			console.log('  ✅ Login failed as expected')
			const error = await loginPage.getErrorMessage()
			if (error) {
				console.log(`  Error: "${error}"`)
			}
		} else {
			console.log('  ⚠️ Unexpected navigation')
		}
		console.log('  ✅ Invalid credentials tested\n')

		// Test 5: Test valid login
		console.log('Test 5: Valid Login')
		if (!(await loginPage.isOnLoginPage())) {
			await loginPage.goto()
		}

		// Use method chaining
		await loginPage
			.enterUsername('kody')
			.then((page) => page.enterPassword('kodylovesyou'))
			.then((page) => page.checkRememberMe())
			.then((page) => page.submit())

		console.log('  Credentials submitted')

		// Wait for redirect
		try {
			await loginPage.waitForRedirect()
			console.log('  ✅ Login successful - redirected')

			const isLoggedIn = await loginPage.isLoggedIn()
			console.log(`  Logged in status: ${isLoggedIn}`)
		} catch (e) {
			console.log('  ℹ️ No redirect (may need valid credentials)')
		}
		console.log('  ✅ Valid login tested\n')

		// Test 6: OAuth buttons
		console.log('Test 6: OAuth Login Options')
		if (!(await loginPage.isOnLoginPage())) {
			await loginPage.goto()
		}

		try {
			// Just check if buttons exist, don't click them
			const githubExists = await driver.findElements(
				loginPage.locators.githubButton,
			)
			const googleExists = await driver.findElements(
				loginPage.locators.googleButton,
			)

			console.log(
				`  GitHub login: ${githubExists.length > 0 ? 'Available' : 'Not found'}`,
			)
			console.log(
				`  Google login: ${googleExists.length > 0 ? 'Available' : 'Not found'}`,
			)
			console.log('  ✅ OAuth options checked\n')
		} catch (e) {
			console.log('  ℹ️ OAuth buttons not available\n')
		}

		// Test 7: Other links
		console.log('Test 7: Page Links')
		if (!(await loginPage.isOnLoginPage())) {
			await loginPage.goto()
		}

		try {
			const forgotLink = await driver.findElements(
				loginPage.locators.forgotPasswordLink,
			)
			const createLink = await driver.findElements(
				loginPage.locators.createAccountLink,
			)

			console.log(
				`  Forgot password link: ${forgotLink.length > 0 ? 'Found' : 'Not found'}`,
			)
			console.log(
				`  Create account link: ${createLink.length > 0 ? 'Found' : 'Not found'}`,
			)
			console.log('  ✅ Page links verified\n')
		} catch (e) {
			console.log('  ℹ️ Some links not found\n')
		}

		// Take screenshot
		const screenshot = await loginPage.takeScreenshot()
		const fs = require('fs')
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		fs.writeFileSync(`exercise-6-pom-${timestamp}.png`, screenshot, 'base64')
		console.log('📸 Screenshot saved\n')

		// Summary
		console.log('📊 Page Object Model Benefits:')
		console.log('  ✅ Centralized locators management')
		console.log('  ✅ Reusable page methods')
		console.log('  ✅ Cleaner test code')
		console.log('  ✅ Easier maintenance')
		console.log('  ✅ Method chaining support')
		console.log('  ✅ Better error handling')

		console.log('\n✅ Exercise 6: Page Object Model test completed!\n')
	} catch (error) {
		console.error('\n❌ Test failed:', error.message)

		// Take error screenshot
		try {
			const screenshot = await driver.takeScreenshot()
			const fs = require('fs')
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
			fs.writeFileSync(
				`exercise-6-error-${timestamp}.png`,
				screenshot,
				'base64',
			)
			console.log('📸 Error screenshot saved')
		} catch (e) {
			// Ignore screenshot errors
		}

		throw error
	} finally {
		await driver.quit()
		console.log('🏁 Browser closed')
	}
}

// Additional test demonstrating multiple page objects
async function testMultiplePageObjects() {
	console.log('\n🚀 Advanced: Multiple Page Objects')
	console.log('===================================\n')

	const driver = await new Builder().forBrowser('chrome').build()

	try {
		const loginPage = new LoginPage(driver)

		// Demonstrate a user flow with multiple pages
		console.log('📝 User Flow Test:\n')

		// Step 1: Login
		console.log('Step 1: Login')
		await loginPage.goto()
		await loginPage.login('kody', 'kodylovesyou')
		await driver.sleep(2000)

		const currentUrl = await driver.getCurrentUrl()
		console.log(`  Current URL: ${currentUrl}`)

		if (!currentUrl.includes('/login')) {
			console.log('  ✅ Login successful\n')

			// Here you would use other page objects
			// const homePage = new HomePage(driver);
			// const settingsPage = new SettingsPage(driver);
			// etc.

			console.log('Step 2: Navigate to other pages')
			console.log('  (Would use HomePage, SettingsPage, etc.)\n')

			console.log('📊 Multi-Page Benefits:')
			console.log('  - Each page has its own Page Object')
			console.log('  - Clear separation of concerns')
			console.log('  - Easy to maintain and scale')
			console.log('  - Promotes code reuse')
		} else {
			console.log('  ℹ️ Login did not redirect\n')
		}

		console.log('✅ Multiple page objects concept demonstrated\n')
	} finally {
		await driver.quit()
	}
}

// Run the tests
console.log('🎯 Selenium Page Object Model Exercise\n')
console.log('This exercise demonstrates the Page Object Model pattern')
console.log('for organizing Selenium tests in a maintainable way.\n')

testLoginWithPageObject()
	.then(() => testMultiplePageObjects())
	.catch((error) => {
		console.error('Fatal error:', error)
		process.exit(1)
	})
