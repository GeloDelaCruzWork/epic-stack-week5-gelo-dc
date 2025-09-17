import { test, expect } from '#tests/playwright-utils'

test('debug console output', async ({ page, login }) => {
	await login()

	// Capture all console messages
	const consoleLogs: string[] = []
	page.on('console', (msg) => {
		const text = `${msg.type()}: ${msg.text()}`
		consoleLogs.push(text)
		console.log('Browser console:', text)
	})

	// Capture errors
	page.on('pageerror', (error) => {
		console.log('Page error:', error.message)
	})

	// Mock API
	await page.route('**/api/search**', (route) => {
		console.log('API INTERCEPTED!')
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				results: [
					{ id: '1', title: 'Test', type: 'note', description: 'Test' },
				],
			}),
		})
	})

	await page.goto('/search')
	await page.waitForTimeout(1000)

	// Try to search
	const searchInput = page.getByTestId('search-input')
	await searchInput.fill('test')

	// Click button
	await page.getByTestId('search-button').click()

	// Wait for any async operations
	await page.waitForTimeout(2000)

	console.log('\n=== All console logs ===')
	consoleLogs.forEach((log) => console.log(log))

	// Check current URL
	console.log('\nCurrent URL:', page.url())

	// Check if fetcher has data
	const fetcherData = await page.evaluate(() => {
		// Try to access React component state
		const searchInput = document.querySelector('[data-testid="search-input"]')
		return searchInput ? 'Found input' : 'No input'
	})
	console.log('Page state:', fetcherData)
})
