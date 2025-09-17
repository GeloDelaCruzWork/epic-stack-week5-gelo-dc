const { Builder, By } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

;(async () => {
	const options = new chrome.Options()
	options.addArguments('--disable-dev-shm-usage', '--no-sandbox')

	const driver = await new Builder()
		.forBrowser('chrome')
		.setChromeOptions(options)
		.build()

	try {
		console.log('=== Testing Projects Menu Item ===\n')

		// Login first
		console.log('1. Logging in...')
		await driver.get('http://localhost:3000/login')
		await driver.sleep(2000)
		await driver.findElement(By.css('#login-form-username')).sendKeys('kody')
		await driver
			.findElement(By.css('#login-form-password'))
			.sendKeys('kodylovesyou')
		await driver.findElement(By.css('button[type="submit"]')).click()
		await driver.sleep(3000)

		let url = await driver.getCurrentUrl()
		console.log('   After login URL:', url)

		// Look for navigation menu items
		console.log('\n2. Looking for navigation menu items...')

		// Try different selectors for menu items
		const menuSelectors = [
			'nav a',
			'header a',
			'a[href*="project"]',
			'[role="navigation"] a',
			'.menu-item',
			'.nav-link',
			'aside a',
			'[class*="sidebar"] a',
			'[class*="menu"] a',
		]

		let projectsMenuItem = null
		let allMenuItems = []

		for (const selector of menuSelectors) {
			try {
				const menuItems = await driver.findElements(By.css(selector))
				if (menuItems.length > 0) {
					console.log(
						'   Found',
						menuItems.length,
						'items with selector:',
						selector,
					)

					for (const item of menuItems) {
						try {
							const text = await item.getText()
							const href = await item.getAttribute('href')

							if (text || href) {
								const menuInfo = {
									text: text || '(no text)',
									href: href || '(no href)',
								}
								allMenuItems.push(menuInfo)
								console.log('     -', menuInfo.text, '→', menuInfo.href)

								if (text && text.toLowerCase().includes('project')) {
									projectsMenuItem = item
									console.log('       ✅ Found Projects menu item!')
									break
								}
							}
						} catch (e) {
							// Skip if can't get text
						}
					}

					if (projectsMenuItem) break
				}
			} catch (e) {
				// Try next selector
			}
		}

		// Also check for any clickable text containing 'Projects'
		console.log('\n3. Looking for any element with "Projects" text...')
		try {
			const projectElements = await driver.findElements(
				By.xpath(
					'//a[contains(text(), "Projects")] | //button[contains(text(), "Projects")] | //span[contains(text(), "Projects")] | //*[contains(., "Projects")]',
				),
			)
			console.log(
				'   Found',
				projectElements.length,
				'elements containing "Projects"',
			)

			if (projectElements.length > 0 && !projectsMenuItem) {
				// Check each element to find a clickable one
				for (const element of projectElements) {
					try {
						const tagName = await element.getTagName()
						const text = await element.getText()
						const isDisplayed = await element.isDisplayed()

						console.log(
							'     Element:',
							tagName,
							'-',
							text.substring(0, 50),
							'- Visible:',
							isDisplayed,
						)

						if (isDisplayed && (tagName === 'a' || tagName === 'button')) {
							projectsMenuItem = element
							console.log('       ✅ Using this as Projects menu item')
							break
						}
					} catch (e) {
						// Skip element
					}
				}
			}
		} catch (e) {
			console.log('   Error searching for Projects elements:', e.message)
		}

		// If we found a Projects menu item, click it
		if (projectsMenuItem) {
			console.log('\n4. Clicking Projects menu item...')
			try {
				await projectsMenuItem.click()
				await driver.sleep(3000)

				url = await driver.getCurrentUrl()
				const title = await driver.getTitle()
				const bodyText = await driver.findElement(By.tagName('body')).getText()

				console.log('   After click URL:', url)
				console.log('   Page title:', title)
				console.log('\n   Page content (first 800 chars):')
				console.log('   ' + bodyText.substring(0, 800).replace(/\n/g, '\n   '))

				// Check if we're on a projects page
				if (url.includes('project')) {
					console.log('\n   ✅ Successfully navigated to projects page!')

					// Look for project-related content
					const forms = await driver.findElements(By.css('form'))
					const inputs = await driver.findElements(
						By.css(
							'input[type="text"], input[name="name"], input[name="title"]',
						),
					)
					const textareas = await driver.findElements(By.css('textarea'))
					const buttons = await driver.findElements(
						By.css('button[type="submit"]'),
					)

					console.log('\n   Page elements found:')
					console.log('   - Forms:', forms.length)
					console.log('   - Text inputs:', inputs.length)
					console.log('   - Textareas:', textareas.length)
					console.log('   - Submit buttons:', buttons.length)

					// Try to identify what's on the page
					if (inputs.length > 0) {
						console.log('\n   Input field details:')
						for (let i = 0; i < Math.min(3, inputs.length); i++) {
							const name = await inputs[i].getAttribute('name')
							const placeholder = await inputs[i].getAttribute('placeholder')
							const id = await inputs[i].getAttribute('id')
							console.log(
								`     Input ${i + 1}: name="${name}", placeholder="${placeholder}", id="${id}"`,
							)
						}
					}
				}
			} catch (clickError) {
				console.log('   ❌ Error clicking menu item:', clickError.message)
			}
		} else {
			console.log('\n   ❌ No Projects menu item found')
			console.log('   Available menu items were:')
			allMenuItems.slice(0, 10).forEach((item) => {
				console.log('     -', item.text, '→', item.href)
			})
		}

		// Take a screenshot
		const screenshot = await driver.takeScreenshot()
		const fs = require('fs')
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		const filename = `projects-menu-${timestamp}.png`
		fs.writeFileSync(filename, screenshot, 'base64')
		console.log('\n📸 Screenshot saved:', filename)
	} catch (error) {
		console.error('\n❌ Error:', error.message)
	} finally {
		await driver.quit()
		console.log('\n✅ Test completed')
	}
})()
