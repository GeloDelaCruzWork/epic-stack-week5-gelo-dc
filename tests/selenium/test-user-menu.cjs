const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

;(async () => {
	const options = new chrome.Options()
	options.addArguments('--disable-dev-shm-usage', '--no-sandbox')

	const driver = await new Builder()
		.forBrowser('chrome')
		.setChromeOptions(options)
		.build()

	try {
		console.log('=== Testing User Menu (Top Right) ===\n')

		// Login
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

		// Look for user menu button in top right
		console.log('\n2. Looking for user menu button (top right)...')

		// Common selectors for user menu buttons (usually with avatar or username)
		const userButtonSelectors = [
			'button img[alt*="kody" i]', // Button with user avatar
			'button img[alt*="user" i]',
			'button:has(img)', // Any button with an image
			'button[aria-label*="user" i]',
			'button[aria-label*="menu" i]',
			'button[aria-label*="account" i]',
			'button[data-testid*="user" i]',
			'[role="button"]:has(img)',
			'header button:has(img)', // Button in header with image
			'nav button:has(img)', // Button in nav with image
			'button.user-menu',
			'button[class*="user"]',
			'button[class*="avatar"]',
			'button[class*="profile"]',
			// Top-right positioning selectors
			'header button:last-child',
			'nav button:last-child',
			'[class*="right"] button',
			'[class*="end"] button',
		]

		let userMenuButton = null

		for (const selector of userButtonSelectors) {
			try {
				const buttons = await driver.findElements(By.css(selector))
				console.log(
					`   Checking selector "${selector}" - found ${buttons.length} element(s)`,
				)

				for (const button of buttons) {
					try {
						const isDisplayed = await button.isDisplayed()
						if (isDisplayed) {
							// Check if it's in the top area of the page
							const location = await button.getLocation()
							const size = await button.getSize()

							console.log(
								`     Button position: x=${location.x}, y=${location.y}, width=${size.width}, height=${size.height}`,
							)

							// Usually user menu is in top area (y < 200) and towards the right
							if (location.y < 200) {
								userMenuButton = button
								console.log(
									'     ✅ Found potential user menu button in header area',
								)
								break
							}
						}
					} catch (e) {
						// Skip this button
					}
				}

				if (userMenuButton) break
			} catch (e) {
				// Try next selector
			}
		}

		// If no button found, look for clickable elements with Kody's name or image
		if (!userMenuButton) {
			console.log('\n3. Looking for any clickable element with user info...')
			try {
				// Find elements containing "kody" text
				const kodyElements = await driver.findElements(
					By.xpath('//*[contains(text(), "kody") or contains(text(), "Kody")]'),
				)

				for (const element of kodyElements) {
					const tagName = await element.getTagName()
					const parent = await element.findElement(By.xpath('..'))
					const parentTag = await parent.getTagName()

					console.log(
						`   Found "${await element.getText()}" in <${tagName}>, parent: <${parentTag}>`,
					)

					// Check if the element or its parent is clickable
					if (tagName === 'button' || parentTag === 'button') {
						userMenuButton = tagName === 'button' ? element : parent
						console.log('     ✅ Using this as user menu button')
						break
					}
				}
			} catch (e) {
				console.log('   No clickable user elements found')
			}
		}

		// Try clicking the user menu button
		if (userMenuButton) {
			console.log('\n4. Clicking user menu button...')
			await userMenuButton.click()
			await driver.sleep(1500) // Wait for menu to open

			console.log('   Menu clicked, looking for menu items...')

			// Look for menu items that appeared
			const menuItemSelectors = [
				'a[role="menuitem"]',
				'button[role="menuitem"]',
				'[role="menu"] a',
				'[role="menu"] button',
				'ul a',
				'ul button',
				'[class*="dropdown"] a',
				'[class*="menu"] a:not(nav a)', // Menu links but not main nav
				'div[class*="menu"] a',
				'a[href*="profile"]',
				'a[href*="project"]',
				'a[href*="timesheet"]',
			]

			let foundMenuItems = []

			for (const selector of menuItemSelectors) {
				try {
					const items = await driver.findElements(By.css(selector))
					if (items.length > 0) {
						console.log(
							`   Found ${items.length} menu items with selector: ${selector}`,
						)

						for (const item of items) {
							try {
								const text = await item.getText()
								const href = await item.getAttribute('href')
								const isDisplayed = await item.isDisplayed()

								if (text && isDisplayed) {
									foundMenuItems.push({ text, href, element: item })
									console.log(`     • ${text} ${href ? '→ ' + href : ''}`)
								}
							} catch (e) {
								// Skip item
							}
						}
					}
				} catch (e) {
					// Try next selector
				}
			}

			// Look specifically for Projects menu item
			console.log('\n5. Looking for Projects menu item...')
			let projectsItem = foundMenuItems.find((item) =>
				item.text.toLowerCase().includes('project'),
			)

			if (projectsItem) {
				console.log(`   ✅ Found Projects menu item: "${projectsItem.text}"`)
				console.log('   Clicking Projects...')

				await projectsItem.element.click()
				await driver.sleep(3000)

				const newUrl = await driver.getCurrentUrl()
				const pageTitle = await driver.getTitle()
				const bodyText = await driver.findElement(By.tagName('body')).getText()

				console.log('\n6. After clicking Projects:')
				console.log('   URL:', newUrl)
				console.log('   Title:', pageTitle)
				console.log('   Page content (first 500 chars):')
				console.log('   ' + bodyText.substring(0, 500).replace(/\n/g, '\n   '))

				// Check for project-related elements
				const forms = await driver.findElements(By.css('form'))
				const inputs = await driver.findElements(
					By.css('input[type="text"], input[name="name"]'),
				)

				console.log('\n   Page elements:')
				console.log('   - Forms:', forms.length)
				console.log('   - Input fields:', inputs.length)

				if (newUrl.includes('project')) {
					console.log('\n   ✅ Successfully navigated to Projects page!')
				}
			} else {
				console.log('   ❌ Projects menu item not found')
				console.log('   Available menu items:')
				foundMenuItems.forEach((item) => {
					console.log(`     • ${item.text}`)
				})
			}
		} else {
			console.log('\n   ❌ Could not find user menu button')
			console.log('   The user menu might be hidden or use different markup')

			// Try to list all visible buttons on the page
			console.log('\n   All visible buttons on page:')
			const allButtons = await driver.findElements(By.css('button'))
			for (let i = 0; i < Math.min(10, allButtons.length); i++) {
				try {
					const text = await allButtons[i].getText()
					const ariaLabel = await allButtons[i].getAttribute('aria-label')
					if (text || ariaLabel) {
						console.log(`     Button ${i + 1}: "${text || ariaLabel}"`)
					}
				} catch (e) {
					// Skip
				}
			}
		}

		// Take screenshot
		const screenshot = await driver.takeScreenshot()
		const fs = require('fs')
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		fs.writeFileSync(`user-menu-${timestamp}.png`, screenshot, 'base64')
		console.log('\n📸 Screenshot saved')
	} catch (error) {
		console.error('\n❌ Error:', error.message)
	} finally {
		await driver.quit()
		console.log('\n✅ Test completed')
	}
})()
