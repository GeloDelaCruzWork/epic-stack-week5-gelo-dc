const { Builder, By } = require('selenium-webdriver')
const fs = require('fs')

async function debugLoginPage() {
	console.log('🔍 Debugging Login Page Structure')
	console.log('==================================\n')

	const driver = await new Builder().forBrowser('chrome').build()

	try {
		// Navigate to login page
		console.log('📍 Navigating to login page...')
		await driver.get('http://localhost:3000/login')
		await driver.sleep(3000) // Give plenty of time to load

		// Get current URL
		const currentUrl = await driver.getCurrentUrl()
		console.log(`Current URL: ${currentUrl}\n`)

		// Get page title
		const title = await driver.getTitle()
		console.log(`Page Title: ${title}\n`)

		// Get all forms on the page
		const forms = await driver.findElements(By.css('form'))
		console.log(`Number of forms: ${forms.length}`)

		// Get all inputs on the page
		const inputs = await driver.findElements(By.css('input'))
		console.log(`Number of inputs: ${inputs.length}\n`)

		// Detailed input analysis
		console.log('Input Details:')
		for (let i = 0; i < inputs.length; i++) {
			const input = inputs[i]
			const type = await input.getAttribute('type')
			const name = await input.getAttribute('name')
			const id = await input.getAttribute('id')
			const placeholder = await input.getAttribute('placeholder')
			const isVisible = await input.isDisplayed()
			const className = await input.getAttribute('class')

			console.log(`Input ${i + 1}:`)
			console.log(`  Type: ${type}`)
			console.log(`  Name: ${name}`)
			console.log(`  ID: ${id}`)
			console.log(`  Placeholder: ${placeholder}`)
			console.log(`  Visible: ${isVisible}`)
			console.log(`  Class: ${className}\n`)
		}

		// Get all buttons
		const buttons = await driver.findElements(By.css('button'))
		console.log(`Number of buttons: ${buttons.length}`)
		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i]
			const text = await button.getText()
			const type = await button.getAttribute('type')
			console.log(`Button ${i + 1}: "${text}" (type: ${type})`)
		}

		// Get page text content
		console.log('\nPage Text Content (first 500 chars):')
		const bodyText = await driver.findElement(By.tagName('body')).getText()
		console.log(bodyText.substring(0, 500) + '...\n')

		// Check for specific elements
		console.log('Checking for specific elements:')

		try {
			await driver.findElement(By.css('input[type="password"]'))
			console.log('✅ Password field found')
		} catch (e) {
			console.log('❌ No password field found')
		}

		try {
			await driver.findElement(By.css('input[name="username"]'))
			console.log('✅ Username field found')
		} catch (e) {
			console.log('❌ No username field found')
		}

		try {
			await driver.findElement(By.css('input[type="email"]'))
			console.log('✅ Email field found')
		} catch (e) {
			console.log('❌ No email field found')
		}

		// Take screenshot
		const screenshot = await driver.takeScreenshot()
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		const filename = `login-page-debug-${timestamp}.png`
		fs.writeFileSync(filename, screenshot, 'base64')
		console.log(`\n📸 Screenshot saved: ${filename}`)

		// Check page source
		const pageSource = await driver.getPageSource()
		console.log(`\nPage source length: ${pageSource.length} characters`)

		// Look for login-related text in source
		if (pageSource.includes('password')) {
			console.log('✅ Page source contains "password"')
		}
		if (pageSource.includes('username')) {
			console.log('✅ Page source contains "username"')
		}
		if (pageSource.includes('email')) {
			console.log('✅ Page source contains "email"')
		}
		if (pageSource.includes('login')) {
			console.log('✅ Page source contains "login"')
		}
	} catch (error) {
		console.error('Error:', error.message)
	} finally {
		await driver.quit()
		console.log('\n🏁 Browser closed')
	}
}

debugLoginPage()
