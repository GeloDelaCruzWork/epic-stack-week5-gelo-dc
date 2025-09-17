const { Builder, By } = require('selenium-webdriver')

async function debugSession() {
	let driver

	try {
		driver = await new Builder().forBrowser('chrome').build()
		driver.manage().setTimeouts({ implicit: 5000 })

		console.log('🔐 Logging in and checking session...\n')

		// Step 1: Go to home page first
		await driver.get('http://localhost:3000')
		await driver.sleep(1000)
		console.log('1. Home page URL:', await driver.getCurrentUrl())

		// Step 2: Navigate to login
		await driver.get('http://localhost:3000/login')
		await driver.sleep(2000)
		console.log('2. Login page URL:', await driver.getCurrentUrl())

		// Step 3: Perform login
		const usernameField = await driver.findElement(By.id('login-form-username'))
		const passwordField = await driver.findElement(By.id('login-form-password'))
		await usernameField.sendKeys('kody')
		await passwordField.sendKeys('kodylovesyou')

		const submitButton = await driver.findElement(
			By.css('button[type="submit"]'),
		)
		await submitButton.click()
		console.log('3. Logging in...')
		await driver.sleep(3000)

		// Step 4: Check where we landed
		const afterLoginUrl = await driver.getCurrentUrl()
		console.log('4. After login URL:', afterLoginUrl)

		// Step 5: Check if we can see user content
		const bodyText = await driver.findElement(By.tagName('body')).getText()
		if (bodyText.includes('kody') || bodyText.includes('Kody')) {
			console.log('✅ User "kody" found in page content')
		}

		// Step 6: Look for navigation links
		console.log('\n🔍 Looking for navigation links:')
		const links = await driver.findElements(By.css('a[href*="/notes"]'))
		console.log(`Found ${links.length} notes-related links`)

		if (links.length > 0) {
			console.log('Clicking first notes link...')
			await links[0].click()
			await driver.sleep(2000)
			console.log('5. After clicking notes link:', await driver.getCurrentUrl())
		}

		// Step 7: Try to find existing notes
		console.log('\n📝 Looking for existing notes:')
		const noteSelectors = [
			'article',
			'a[href*="/notes/"]',
			'[data-testid*="note"]',
			'.note-item',
			'li a',
		]

		for (const selector of noteSelectors) {
			const notes = await driver.findElements(By.css(selector))
			if (notes.length > 0) {
				console.log(
					`✅ Found ${notes.length} elements with selector: ${selector}`,
				)
				if (notes.length > 0) {
					const firstNoteText = await notes[0].getText()
					console.log(
						`   First note text: "${firstNoteText.substring(0, 50)}..."`,
					)
				}
			}
		}

		// Step 8: Check cookies
		console.log('\n🍪 Checking cookies:')
		const cookies = await driver.manage().getCookies()
		console.log(`Found ${cookies.length} cookies`)
		cookies.forEach((cookie) => {
			console.log(
				`  Cookie: ${cookie.name} = ${cookie.value.substring(0, 20)}...`,
			)
		})
	} catch (error) {
		console.error('❌ Error:', error.message)
	} finally {
		if (driver) {
			await driver.quit()
		}
	}
}

console.log('🚀 Starting Session Debug...\n')
debugSession().catch(console.error)
