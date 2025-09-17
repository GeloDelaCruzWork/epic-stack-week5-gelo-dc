import { test, expect } from '#tests/playwright-utils'

test('test search with button click', async ({ page, login }) => {
	await login()

	// Log all requests
	const requests: string[] = []
	page.on('request', (request) => {
		const url = request.url()
		if (url.includes('search')) {
			requests.push(url)
			console.log('Request to:', url)
		}
	})

	// Mock the API
	await page.route('**/api/search**', (route) => {
		console.log('INTERCEPTED API CALL!')
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

	// Fill input
	const searchInput = page.getByTestId('search-input')
	await searchInput.fill('test')

	// Try clicking the button instead of pressing Enter
	const searchButton = page.getByTestId('search-button')
	await searchButton.click()

	// Wait a bit
	await page.waitForTimeout(2000)

	console.log('All search requests:', requests)

	// Check if results div appears
	const hasResults = await page
		.locator('[data-testid="search-results"]')
		.isVisible()
		.catch(() => false)
	console.log('Has search-results div:', hasResults)

	if (hasResults) {
		const text = await page
			.locator('[data-testid="search-results"]')
			.textContent()
		console.log('Results text:', text)
	}

	// Check if page navigated
	const currentUrl = page.url()
	console.log('Current URL:', currentUrl)
})
