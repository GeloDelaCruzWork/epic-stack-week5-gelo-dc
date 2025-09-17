const { Builder, By } = require('selenium-webdriver')
const LoginPage = require('./pages/LoginPage.cjs')
const fs = require('fs')

async function debugNotesPage() {
	console.log('🔍 Debugging Notes Page Structure')
	console.log('==================================\n')

	const driver = await new Builder().forBrowser('chrome').build()

	try {
		// Login first
		console.log('📝 Logging in...')
		const loginPage = new LoginPage(driver)
		await loginPage.goto()
		await loginPage.login('kody', 'kodylovesyou')
		await driver.sleep(3000)

		// Navigate to notes page
		console.log('\n📍 Navigating to notes page...')
		await driver.get('http://localhost:3000/users/kody/notes')
		await driver.sleep(3000)

		const currentUrl = await driver.getCurrentUrl()
		console.log(`Current URL: ${currentUrl}\n`)

		// Look for various button/link patterns
		console.log('🔍 Looking for "New" buttons/links:\n')

		const patterns = [
			{
				selector: By.xpath('//a[contains(text(), "New")]'),
				name: 'Link with "New"',
			},
			{
				selector: By.xpath('//button[contains(text(), "New")]'),
				name: 'Button with "New"',
			},
			{
				selector: By.xpath('//a[contains(text(), "new")]'),
				name: 'Link with "new"',
			},
			{
				selector: By.xpath('//a[contains(text(), "Create")]'),
				name: 'Link with "Create"',
			},
			{
				selector: By.xpath('//button[contains(text(), "Create")]'),
				name: 'Button with "Create"',
			},
			{
				selector: By.xpath('//a[contains(text(), "Add")]'),
				name: 'Link with "Add"',
			},
			{
				selector: By.xpath('//*[contains(@href, "/new")]'),
				name: 'Element with /new in href',
			},
			{
				selector: By.css('a[href*="new"]'),
				name: 'CSS: Link with new in href',
			},
			{
				selector: By.css(
					'button[aria-label*="new"], button[aria-label*="New"]',
				),
				name: 'Button with new in aria-label',
			},
			{
				selector: By.xpath('//a[@role="button"]'),
				name: 'Link with role="button"',
			},
			{
				selector: By.css('.new-note-button, .add-note-button'),
				name: 'CSS: new-note or add-note class',
			},
			{
				selector: By.xpath(
					'//*[contains(@class, "new") or contains(@class, "add")]',
				),
				name: 'Element with new/add in class',
			},
		]

		for (const pattern of patterns) {
			try {
				const elements = await driver.findElements(pattern.selector)
				if (elements.length > 0) {
					console.log(`✅ Found ${elements.length} - ${pattern.name}`)
					for (let i = 0; i < Math.min(elements.length, 2); i++) {
						try {
							const text = await elements[i].getText()
							const href = await elements[i].getAttribute('href')
							const className = await elements[i].getAttribute('class')
							console.log(`   Element ${i + 1}:`)
							if (text) console.log(`     Text: "${text}"`)
							if (href) console.log(`     Href: "${href}"`)
							if (className) console.log(`     Class: "${className}"`)
						} catch (e) {
							// Element might not have all attributes
						}
					}
				} else {
					console.log(`❌ Not found - ${pattern.name}`)
				}
			} catch (e) {
				console.log(`❌ Error checking - ${pattern.name}`)
			}
		}

		// Get all links and buttons
		console.log('\n📋 All Links on page:')
		const allLinks = await driver.findElements(By.css('a'))
		console.log(`Found ${allLinks.length} links`)
		for (let i = 0; i < Math.min(allLinks.length, 5); i++) {
			try {
				const text = await allLinks[i].getText()
				const href = await allLinks[i].getAttribute('href')
				if (text || href) {
					console.log(`  Link ${i + 1}: "${text}" -> ${href}`)
				}
			} catch (e) {
				// Skip
			}
		}

		console.log('\n📋 All Buttons on page:')
		const allButtons = await driver.findElements(By.css('button'))
		console.log(`Found ${allButtons.length} buttons`)
		for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
			try {
				const text = await allButtons[i].getText()
				const type = await allButtons[i].getAttribute('type')
				if (text) {
					console.log(`  Button ${i + 1}: "${text}" (type: ${type})`)
				}
			} catch (e) {
				// Skip
			}
		}

		// Check for notes list
		console.log('\n📝 Notes List Elements:')
		const notePatterns = [
			{ selector: By.css('.note-item'), name: 'CSS: .note-item' },
			{ selector: By.css('article'), name: 'CSS: article' },
			{
				selector: By.css('[data-testid*="note"]'),
				name: 'CSS: data-testid with note',
			},
			{ selector: By.css('li'), name: 'CSS: li elements' },
			{ selector: By.css('.note, .notes'), name: 'CSS: .note or .notes' },
			{
				selector: By.xpath('//div[contains(@class, "note")]'),
				name: 'Div with note in class',
			},
		]

		for (const pattern of notePatterns) {
			try {
				const elements = await driver.findElements(pattern.selector)
				if (elements.length > 0) {
					console.log(`  ✅ Found ${elements.length} - ${pattern.name}`)
				}
			} catch (e) {
				// Skip
			}
		}

		// Take screenshot
		const screenshot = await driver.takeScreenshot()
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		const filename = `notes-page-debug-${timestamp}.png`
		fs.writeFileSync(filename, screenshot, 'base64')
		console.log(`\n📸 Screenshot saved: ${filename}`)

		// Get page text
		console.log('\n📄 Page Content (first 500 chars):')
		const bodyText = await driver.findElement(By.tagName('body')).getText()
		console.log(bodyText.substring(0, 500) + '...')
	} catch (error) {
		console.error('Error:', error.message)
	} finally {
		await driver.quit()
		console.log('\n🏁 Browser closed')
	}
}

debugNotesPage()
