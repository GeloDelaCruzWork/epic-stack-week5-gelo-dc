const { Builder, By } = require('selenium-webdriver')

async function testNoteCreation() {
	let driver

	try {
		driver = await new Builder().forBrowser('chrome').build()
		driver.manage().setTimeouts({ implicit: 5000 })

		console.log('🔐 Testing Note Creation Flow...\n')

		// Step 1: Login
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
		console.log('✅ Logged in')

		// Step 2: Navigate through the app to notes
		await driver.get('http://localhost:3000/users')
		await driver.sleep(1000)

		// Click on Kody
		const kodyLink = await driver.findElement(
			By.xpath('//a[contains(@href, "/kody")]'),
		)
		await kodyLink.click()
		await driver.sleep(2000)
		console.log("✅ On Kody's profile")

		// Go directly to notes
		await driver.get('http://localhost:3000/users/kody/notes')
		await driver.sleep(2000)

		const notesUrl = await driver.getCurrentUrl()
		console.log('Notes page URL:', notesUrl)

		if (notesUrl.includes('/notes')) {
			console.log('✅ Successfully on notes page\n')

			// Try to create a note using Kody's existing note as a template
			console.log('📝 Attempting to create a new note...\n')

			// Method 1: Try direct navigation
			console.log('Method 1: Direct navigation to /new')
			await driver.get('http://localhost:3000/users/kody/notes/new')
			await driver.sleep(2000)

			let currentUrl = await driver.getCurrentUrl()
			console.log('Current URL:', currentUrl)

			if (!currentUrl.includes('/new')) {
				console.log('❌ Could not navigate to /new directly\n')

				// Method 2: Look for any create button on notes page
				console.log('Method 2: Looking for create button on notes page')
				await driver.get('http://localhost:3000/users/kody/notes')
				await driver.sleep(2000)

				const allLinks = await driver.findElements(By.css('a'))
				console.log(`Found ${allLinks.length} links on page`)

				for (const link of allLinks) {
					const href = await link.getAttribute('href')
					const text = await link.getText()
					if (href && href.includes('/new')) {
						console.log(`Found new note link: text="${text}", href="${href}"`)
						await link.click()
						await driver.sleep(2000)
						break
					}
				}
			}

			currentUrl = await driver.getCurrentUrl()
			if (currentUrl.includes('/new') || currentUrl.includes('edit')) {
				console.log('✅ On a form page (new or edit)\n')

				// Find ALL form elements
				console.log('📋 All form elements on page:\n')

				// All inputs
				const inputs = await driver.findElements(
					By.css('input:not([type="hidden"]):not([type="checkbox"])'),
				)
				console.log(`Inputs (${inputs.length}):`)
				for (let i = 0; i < inputs.length; i++) {
					const name = await inputs[i].getAttribute('name')
					const id = await inputs[i].getAttribute('id')
					const placeholder = await inputs[i].getAttribute('placeholder')
					const type = await inputs[i].getAttribute('type')
					if (!name?.includes('confirm')) {
						console.log(
							`  ${i + 1}. name="${name}", id="${id}", type="${type}", placeholder="${placeholder}"`,
						)
					}
				}

				// All textareas
				const textareas = await driver.findElements(By.css('textarea'))
				console.log(`\nTextareas (${textareas.length}):`)
				for (let i = 0; i < textareas.length; i++) {
					const name = await textareas[i].getAttribute('name')
					const id = await textareas[i].getAttribute('id')
					const placeholder = await textareas[i].getAttribute('placeholder')
					console.log(
						`  ${i + 1}. name="${name}", id="${id}", placeholder="${placeholder}"`,
					)
				}

				// All editable divs (contenteditable)
				const editableDivs = await driver.findElements(
					By.css('[contenteditable="true"]'),
				)
				console.log(`\nEditable divs (${editableDivs.length}):`)
				for (let i = 0; i < editableDivs.length; i++) {
					const role = await editableDivs[i].getAttribute('role')
					const ariaLabel = await editableDivs[i].getAttribute('aria-label')
					console.log(`  ${i + 1}. role="${role}", aria-label="${ariaLabel}"`)
				}

				// Try to fill the form
				console.log('\n🖊️ Attempting to fill form...')

				// Fill title
				if (inputs.length > 0) {
					const titleInput = inputs[0] // Usually the first text input
					await titleInput.clear()
					await titleInput.sendKeys('Test Note from Selenium')
					console.log('✅ Filled title field')
				}

				// Fill content
				if (textareas.length > 0) {
					const contentArea = textareas[0]
					await contentArea.clear()
					await contentArea.sendKeys('This is test content created by Selenium')
					console.log('✅ Filled content field')
				} else if (editableDivs.length > 0) {
					const contentDiv = editableDivs[0]
					await contentDiv.clear()
					await contentDiv.sendKeys(
						'This is test content in contenteditable div',
					)
					console.log('✅ Filled contenteditable field')
				}

				// Find and click save button
				const saveButtons = await driver.findElements(
					By.css('button[type="submit"]'),
				)
				console.log(`\nFound ${saveButtons.length} submit buttons`)

				if (saveButtons.length > 0) {
					console.log('Clicking save button...')
					await saveButtons[0].click()
					await driver.sleep(3000)

					const afterSaveUrl = await driver.getCurrentUrl()
					console.log('After save URL:', afterSaveUrl)

					if (
						!afterSaveUrl.includes('/new') &&
						!afterSaveUrl.includes('/edit')
					) {
						console.log('✅ Note saved successfully!')
					} else {
						const errorText = await driver
							.findElement(By.tagName('body'))
							.getText()
						if (errorText.includes('required') || errorText.includes('error')) {
							console.log('❌ Validation error on save')
						}
					}
				}
			}
		}
	} catch (error) {
		console.error('❌ Error:', error.message)
	} finally {
		if (driver) {
			await driver.quit()
		}
	}
}

console.log('🚀 Starting Note Creation Test...\n')
testNoteCreation().catch(console.error)
