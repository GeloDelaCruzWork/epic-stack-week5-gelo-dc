const { Builder, By } = require('selenium-webdriver')

async function debugNotesForm() {
	let driver

	try {
		driver = await new Builder().forBrowser('chrome').build()
		driver.manage().setTimeouts({ implicit: 5000 })

		// Login
		await driver.get('http://localhost:3000/login')
		await driver.sleep(2000)

		const usernameField = await driver.findElement(By.id('login-form-username'))
		const passwordField = await driver.findElement(By.id('login-form-password'))
		await usernameField.sendKeys('kody')
		await passwordField.sendKeys('kodylovesyou')

		const submitButton = await driver.findElement(
			By.css('button[type="submit"]'),
		)
		await submitButton.click()
		await driver.sleep(3000)

		// Navigate to new note page
		await driver.get('http://localhost:3000/users/kody/notes/new')
		await driver.sleep(2000)

		console.log('🔍 Debugging New Note Form...\n')

		// Get current URL
		const currentUrl = await driver.getCurrentUrl()
		console.log('Current URL:', currentUrl)

		// Try to find all inputs
		console.log('\n📝 Looking for input fields:')
		const inputs = await driver.findElements(By.css('input'))
		console.log(`Found ${inputs.length} input fields`)

		for (let i = 0; i < inputs.length; i++) {
			const name = await inputs[i].getAttribute('name')
			const id = await inputs[i].getAttribute('id')
			const type = await inputs[i].getAttribute('type')
			const placeholder = await inputs[i].getAttribute('placeholder')
			console.log(
				`  Input ${i + 1}: name="${name}", id="${id}", type="${type}", placeholder="${placeholder}"`,
			)
		}

		// Try to find all textareas
		console.log('\n📝 Looking for textarea fields:')
		const textareas = await driver.findElements(By.css('textarea'))
		console.log(`Found ${textareas.length} textarea fields`)

		for (let i = 0; i < textareas.length; i++) {
			const name = await textareas[i].getAttribute('name')
			const id = await textareas[i].getAttribute('id')
			const placeholder = await textareas[i].getAttribute('placeholder')
			console.log(
				`  Textarea ${i + 1}: name="${name}", id="${id}", placeholder="${placeholder}"`,
			)
		}

		// Try to find all buttons
		console.log('\n🔘 Looking for buttons:')
		const buttons = await driver.findElements(By.css('button'))
		console.log(`Found ${buttons.length} buttons`)

		for (let i = 0; i < buttons.length; i++) {
			const text = await buttons[i].getText()
			const type = await buttons[i].getAttribute('type')
			console.log(`  Button ${i + 1}: text="${text}", type="${type}"`)
		}

		// Check page text
		console.log('\n📄 Page text:')
		const bodyText = await driver.findElement(By.tagName('body')).getText()
		console.log(bodyText.substring(0, 500) + '...')
	} catch (error) {
		console.error('❌ Error:', error.message)
	} finally {
		if (driver) {
			await driver.quit()
		}
	}
}

console.log('🚀 Starting Notes Form Debug...\n')
debugNotesForm().catch(console.error)
