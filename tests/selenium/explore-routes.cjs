const { Builder, By } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

async function exploreRoutes() {
	console.log('🔍 Route Explorer Test')
	console.log('======================\n')

	const options = new chrome.Options()
	options.addArguments('--disable-dev-shm-usage')
	options.addArguments('--no-sandbox')
	options.addArguments('--window-size=1920,1080')

	const driver = await new Builder()
		.forBrowser('chrome')
		.setChromeOptions(options)
		.build()

	try {
		const baseUrl = 'http://localhost:3000'

		// Login first
		console.log('📝 Logging in...')
		await driver.get(`${baseUrl}/login`)
		await driver.sleep(1000)

		await driver
			.findElement(By.css('input[name="username"], input[type="email"]'))
			.sendKeys('kody')
		await driver
			.findElement(By.css('input[type="password"]'))
			.sendKeys('kodylovesyou')
		await driver.findElement(By.css('button[type="submit"]')).click()
		await driver.sleep(2000)

		console.log('✅ Logged in\n')

		// Test various routes
		const routes = [
			'/users',
			'/users/kody',
			'/users/kody/notes',
			'/projects',
			'/timesheets',
			'/settings/profile',
			'/admin',
		]

		console.log('Testing Routes:')
		console.log('===============\n')

		for (const route of routes) {
			console.log(`📍 Testing: ${route}`)
			await driver.get(`${baseUrl}${route}`)
			await driver.sleep(2000)

			const currentUrl = await driver.getCurrentUrl()
			const isLoginPage = currentUrl.includes('/login')
			const isAccessible = !isLoginPage

			if (isAccessible) {
				console.log(`  ✅ Accessible - ${currentUrl}`)

				// Check what's on the page
				const pageTitle = await driver.getTitle()
				console.log(`     Title: ${pageTitle}`)

				// Check for specific elements
				const elements = {
					'AG-Grid': await driver.findElements(By.css('.ag-root-wrapper')),
					Tables: await driver.findElements(By.css('table')),
					Forms: await driver.findElements(By.css('form')),
					Headings: await driver.findElements(By.css('h1, h2')),
				}

				for (const [name, items] of Object.entries(elements)) {
					if (items.length > 0) {
						console.log(`     ${name}: ${items.length}`)
					}
				}

				// Get first heading text
				const headings = await driver.findElements(By.css('h1, h2'))
				if (headings.length > 0) {
					const firstHeading = await headings[0].getText()
					console.log(`     Main heading: "${firstHeading}"`)
				}
			} else {
				console.log(`  ❌ Requires auth - Redirected to: ${currentUrl}`)
			}

			console.log('')
		}

		// Check what links are available on the main user page
		console.log('Available Navigation:')
		console.log('====================\n')

		await driver.get(`${baseUrl}/users`)
		await driver.sleep(2000)

		const allLinks = await driver.findElements(By.css('a'))
		const linkInfo = []

		for (const link of allLinks) {
			try {
				const text = await link.getText()
				const href = await link.getAttribute('href')
				if (text && href) {
					linkInfo.push({ text: text.trim(), href })
				}
			} catch (e) {
				// Skip
			}
		}

		// Display unique links
		const uniqueLinks = []
		const seen = new Set()

		for (const link of linkInfo) {
			const key = `${link.text}|${link.href}`
			if (!seen.has(key) && link.text) {
				seen.add(key)
				uniqueLinks.push(link)
			}
		}

		console.log('Links found:')
		uniqueLinks.forEach((link) => {
			const path = link.href.replace(baseUrl, '')
			console.log(`  "${link.text}" -> ${path}`)
		})

		console.log('\n' + '='.repeat(50))
		console.log('✅ Route exploration completed')
		console.log('='.repeat(50))
	} catch (error) {
		console.error('\n❌ Test failed:', error.message)
		throw error
	} finally {
		await driver.quit()
		console.log('\n🏁 Browser closed')
	}
}

// Run the test
exploreRoutes().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
