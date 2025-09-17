const { Builder, By } = require('selenium-webdriver')

async function debugNotesLoggedIn() {
	let driver

	try {
		driver = await new Builder().forBrowser('chrome').build()
		driver.manage().setTimeouts({ implicit: 5000 })

		console.log('🔐 Step 1: Logging in...')
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

		// Check where we are after login
		let currentUrl = await driver.getCurrentUrl()
		console.log('After login URL:', currentUrl)

		// If still on login, navigate to notes
		if (currentUrl.includes('/login')) {
			console.log('Still on login page, navigating to notes...')
			await driver.get('http://localhost:3000/users/kody/notes')
			await driver.sleep(2000)
			currentUrl = await driver.getCurrentUrl()
			console.log('After navigation URL:', currentUrl)
		}

		// Navigate to notes page first to ensure we're logged in
		console.log('\n📝 Step 2: Going to notes page...')
		await driver.get('http://localhost:3000/users/kody/notes')
		await driver.sleep(2000)

		currentUrl = await driver.getCurrentUrl()
		console.log('Notes page URL:', currentUrl)

		// Look for new note button/link
		console.log('\n🔍 Step 3: Looking for new note button...')
		const newNoteSelectors = [
			{ type: 'xpath', selector: '//a[contains(text(), "+")]' },
			{ type: 'css', selector: 'a[href*="/new"]' },
			{
				type: 'css',
				selector:
					'[aria-label*="new"], [aria-label*="add"], [aria-label*="create"]',
			},
			{ type: 'css', selector: '.fab, .floating-action-button' },
			{
				type: 'xpath',
				selector:
					'//button[contains(@aria-label, "new") or contains(@aria-label, "add")]',
			},
		]

		for (const sel of newNoteSelectors) {
			try {
				const elements = await driver.findElements(
					sel.type === 'xpath' ? By.xpath(sel.selector) : By.css(sel.selector),
				)
				if (elements.length > 0) {
					console.log(
						`✅ Found ${elements.length} element(s) with selector: ${sel.selector}`,
					)
					for (let i = 0; i < Math.min(elements.length, 3); i++) {
						const text = await elements[i].getText()
						const href = await elements[i].getAttribute('href')
						console.log(`   Element ${i + 1}: text="${text}", href="${href}"`)
					}
				}
			} catch (e) {
				// Continue
			}
		}

		// Try to navigate directly to new note page
		console.log('\n📝 Step 4: Navigating directly to new note page...')
		await driver.get('http://localhost:3000/users/kody/notes/new')
		await driver.sleep(2000)

		currentUrl = await driver.getCurrentUrl()
		console.log('New note page URL:', currentUrl)

		if (currentUrl.includes('/new')) {
			console.log('✅ Successfully reached new note page!\n')

			// Find form fields
			console.log('🔍 Looking for form fields on new note page:')

			// All inputs
			const inputs = await driver.findElements(By.css('input'))
			console.log(`\nFound ${inputs.length} input fields:`)
			for (let i = 0; i < inputs.length; i++) {
				const name = await inputs[i].getAttribute('name')
				const id = await inputs[i].getAttribute('id')
				const type = await inputs[i].getAttribute('type')
				const ariaLabel = await inputs[i].getAttribute('aria-label')
				if (type !== 'hidden' && type !== 'checkbox') {
					console.log(
						`  Input: name="${name}", id="${id}", type="${type}", aria-label="${ariaLabel}"`,
					)
				}
			}

			// All textareas
			const textareas = await driver.findElements(By.css('textarea'))
			console.log(`\nFound ${textareas.length} textarea fields:`)
			for (let i = 0; i < textareas.length; i++) {
				const name = await textareas[i].getAttribute('name')
				const id = await textareas[i].getAttribute('id')
				const ariaLabel = await textareas[i].getAttribute('aria-label')
				console.log(
					`  Textarea: name="${name}", id="${id}", aria-label="${ariaLabel}"`,
				)
			}

			// All labels
			const labels = await driver.findElements(By.css('label'))
			console.log(`\nFound ${labels.length} labels:`)
			for (let i = 0; i < labels.length; i++) {
				const text = await labels[i].getText()
				const forAttr = await labels[i].getAttribute('for')
				if (text) {
					console.log(`  Label: text="${text}", for="${forAttr}"`)
				}
			}

			// Submit buttons
			const submitButtons = await driver.findElements(
				By.css('button[type="submit"]'),
			)
			console.log(`\nFound ${submitButtons.length} submit buttons:`)
			for (let i = 0; i < submitButtons.length; i++) {
				const text = await submitButtons[i].getText()
				console.log(`  Submit button: "${text}"`)
			}
		} else {
			console.log('❌ Could not reach new note page')
			console.log(
				'Page text:',
				(await driver.findElement(By.tagName('body')).getText()).substring(
					0,
					300,
				),
			)
		}
	} catch (error) {
		console.error('❌ Error:', error.message)
	} finally {
		if (driver) {
			await driver.quit()
		}
	}
}

console.log('🚀 Starting Notes Debug (Logged In)...\n')
debugNotesLoggedIn().catch(console.error)
