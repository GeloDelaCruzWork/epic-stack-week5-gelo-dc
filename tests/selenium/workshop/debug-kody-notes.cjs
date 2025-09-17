const { Builder, By } = require('selenium-webdriver')

async function debugKodyNotes() {
	let driver

	try {
		driver = await new Builder().forBrowser('chrome').build()
		driver.manage().setTimeouts({ implicit: 5000 })

		console.log("🔐 Full flow to Kody's notes...\n")

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

		console.log('✅ Logged in, now at:', await driver.getCurrentUrl())

		// Click on Kody's profile link
		console.log("\n📝 Looking for Kody's profile link...")
		const kodyLinks = await driver.findElements(
			By.xpath('//a[contains(@href, "/kody")]'),
		)
		console.log(`Found ${kodyLinks.length} links containing "/kody"`)

		if (kodyLinks.length > 0) {
			console.log("Clicking on Kody's profile...")
			await kodyLinks[0].click()
			await driver.sleep(2000)
			console.log('Now at:', await driver.getCurrentUrl())
		}

		// Look for notes link on profile
		console.log('\n🔍 Looking for Notes link on profile...')
		const notesLinks = await driver.findElements(
			By.xpath('//a[contains(text(), "Notes") or contains(text(), "notes")]'),
		)
		console.log(`Found ${notesLinks.length} notes links`)

		if (notesLinks.length > 0) {
			console.log('Clicking on Notes link...')
			await notesLinks[0].click()
			await driver.sleep(2000)
			console.log('Now at:', await driver.getCurrentUrl())
		}

		// Check current page content
		const currentUrl = await driver.getCurrentUrl()
		if (currentUrl.includes('/notes')) {
			console.log('\n✅ Successfully reached notes page!')

			// Look for new note button
			console.log('\n🔍 Looking for new note button/link:')

			// Try different selectors
			const newNoteSelectors = [
				{
					desc: 'Plus sign link',
					selector: By.xpath('//a[contains(text(), "+")]'),
				},
				{ desc: 'New link in href', selector: By.css('a[href*="/new"]') },
				{
					desc: 'Floating action button',
					selector: By.css('.fixed.bottom-0.right-0 a, .fixed a'),
				},
				{
					desc: 'Any link to /new',
					selector: By.xpath('//a[contains(@href, "/new")]'),
				},
			]

			for (const sel of newNoteSelectors) {
				const elements = await driver.findElements(sel.selector)
				if (elements.length > 0) {
					console.log(
						`✅ Found with ${sel.desc}: ${elements.length} element(s)`,
					)
					const href = await elements[0].getAttribute('href')
					const text = await elements[0].getText()
					console.log(`   First element: text="${text}", href="${href}"`)

					// Try clicking it
					console.log(`   Clicking the new note button...`)
					await elements[0].click()
					await driver.sleep(2000)

					const newUrl = await driver.getCurrentUrl()
					console.log(`   After click URL: ${newUrl}`)

					if (newUrl.includes('/new')) {
						console.log('\n✅ Successfully reached new note page!')

						// Find form fields
						console.log('\n📝 Form fields on new note page:')

						const titleInputs = await driver.findElements(
							By.css('input[type="text"]:not([type="hidden"])'),
						)
						console.log(`Found ${titleInputs.length} text inputs`)
						for (let i = 0; i < titleInputs.length; i++) {
							const name = await titleInputs[i].getAttribute('name')
							const id = await titleInputs[i].getAttribute('id')
							const label = await titleInputs[i].getAttribute('aria-label')
							console.log(
								`  Input ${i + 1}: name="${name}", id="${id}", aria-label="${label}"`,
							)
						}

						const textareas = await driver.findElements(By.css('textarea'))
						console.log(`Found ${textareas.length} textareas`)
						for (let i = 0; i < textareas.length; i++) {
							const name = await textareas[i].getAttribute('name')
							const id = await textareas[i].getAttribute('id')
							console.log(`  Textarea ${i + 1}: name="${name}", id="${id}"`)
						}

						break
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

console.log('🚀 Starting Kody Notes Debug...\n')
debugKodyNotes().catch(console.error)
