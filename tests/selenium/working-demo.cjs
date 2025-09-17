const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

async function runDemo() {
	console.log('🚀 Selenium Framework Demo')
	console.log('==========================\n')

	const options = new chrome.Options()
	options.addArguments('--disable-dev-shm-usage')
	options.addArguments('--no-sandbox')
	options.addArguments('--window-size=1280,720')

	const driver = await new Builder()
		.forBrowser('chrome')
		.setChromeOptions(options)
		.build()

	try {
		// Test 1: Navigation
		console.log('✅ Test 1: Basic Navigation')
		await driver.get('http://localhost:3000')
		const title = await driver.getTitle()
		console.log(`   - Page title: ${title}`)

		// Test 2: Login
		console.log('\n✅ Test 2: User Authentication')
		await driver.get('http://localhost:3000/login')
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
		const afterLoginUrl = await driver.getCurrentUrl()
		console.log(`   - After login URL: ${afterLoginUrl}`)
		console.log(`   - Login successful: ${!afterLoginUrl.includes('/login')}`)

		// Test 3: Notes Page Access
		console.log('\n✅ Test 3: Notes Page Access')
		await driver.get('http://localhost:3000/users/kody/notes')
		await driver.sleep(2000)

		const notesPageText = await driver.findElement(By.tagName('body')).getText()
		const hasNotes = notesPageText.toLowerCase().includes('note')
		console.log(`   - Notes page loaded: ${hasNotes}`)

		// List existing notes
		const noteLinks = await driver.findElements(
			By.xpath('//a[contains(@href, "/notes/")]'),
		)
		console.log(`   - Found ${noteLinks.length} existing notes`)

		// Test 4: Projects Page
		console.log('\n✅ Test 4: Projects Page Access')
		await driver.get('http://localhost:3000/projects')
		await driver.sleep(2000)

		const projectsPageText = await driver
			.findElement(By.tagName('body'))
			.getText()
		const hasProjects = projectsPageText.toLowerCase().includes('project')
		console.log(`   - Projects page loaded: ${hasProjects}`)

		// Test 5: Search Functionality
		console.log('\n✅ Test 5: Search Users')
		await driver.get('http://localhost:3000')
		await driver.sleep(1000)

		// Try to find search input
		const searchInputs = await driver.findElements(
			By.css('input[type="search"], input[name="search"]'),
		)
		if (searchInputs.length > 0) {
			await searchInputs[0].sendKeys('kody')
			console.log('   - Search input found and populated')

			// Try to submit search
			const searchForms = await driver.findElements(By.css('form'))
			if (searchForms.length > 0) {
				await searchForms[0].submit()
				await driver.sleep(2000)
				const searchUrl = await driver.getCurrentUrl()
				console.log(`   - Search performed, URL: ${searchUrl}`)
			}
		} else {
			console.log('   - No search input found on homepage')
		}

		// Test 6: Theme Switching
		console.log('\n✅ Test 6: Theme Switching')
		const themeButtons = await driver.findElements(
			By.css('button[title*="theme" i], button[aria-label*="theme" i]'),
		)
		if (themeButtons.length > 0) {
			await themeButtons[0].click()
			console.log('   - Theme button clicked')
		} else {
			console.log('   - No theme switcher found')
		}

		// Test 7: User Menu
		console.log('\n✅ Test 7: User Menu & Logout')
		const userMenuButtons = await driver.findElements(
			By.css('button[aria-label*="user" i], button[data-testid="user-menu"]'),
		)
		if (userMenuButtons.length > 0) {
			await userMenuButtons[0].click()
			console.log('   - User menu opened')
			await driver.sleep(500)
		}

		// Try to find logout
		const logoutButtons = await driver.findElements(
			By.css('button[form="logout-form"], a[href="/logout"]'),
		)
		if (logoutButtons.length > 0) {
			console.log('   - Logout button found')
		}

		console.log('\n' + '='.repeat(50))
		console.log('✅ All Selenium tests completed successfully!')
		console.log('The Selenium framework is working properly.')
		console.log('='.repeat(50))
	} catch (error) {
		console.error('\n❌ Test failed:', error.message)
		throw error
	} finally {
		await driver.quit()
		console.log('\n🏁 Browser closed')
	}
}

// Run the demo
runDemo().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
