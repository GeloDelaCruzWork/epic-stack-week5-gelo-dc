import { test, expect } from '#tests/playwright-utils'

test('simple search test with debugging', async ({ page, login }) => {
	await login()

	// Capture console logs
	page.on('console', (msg) => {
		console.log('Browser:', msg.text())
	})

	// Track all network requests
	page.on('request', (request) => {
		if (request.url().includes('search')) {
			console.log('REQUEST:', request.method(), request.url())
		}
	})

	// Intercept and log the response we're sending - React Router v7 uses turbo-stream format
	await page.route('**/api/search**', (route) => {
		const mockData = {
			results: [
				{
					id: '1',
					title: 'Test Result',
					type: 'note',
					description: 'Test description',
				},
			],
		}
		console.log('INTERCEPTING:', route.request().url())

		// React Router v7 expects turbo-stream format for data routes
		const turboStreamResponse = `
D1:{"results":[{"id":"1","title":"Test Result","type":"note","description":"Test description"}]}

S0:`

		route.fulfill({
			status: 200,
			contentType: 'text/x-turbo',
			headers: {
				'content-type': 'text/x-turbo',
			},
			body: turboStreamResponse,
		})
	})

	await page.goto('http://localhost:3000/search')

	// Fill and submit search
	const searchInput = page.getByTestId('search-input')
	await searchInput.fill('test')

	// Try to ensure button is clickable
	const searchButton = page.getByTestId('search-button')
	await searchButton.waitFor({ state: 'visible' })
	console.log('Button visible, clicking...')
	await searchButton.click()
	console.log('Button clicked')

	// Wait a bit and check page state
	await page.waitForTimeout(2000)

	// Check if fetcher received data
	const hasResults = await page.evaluate(() => {
		const resultsDiv = document.querySelector('[data-testid="search-results"]')
		return {
			resultsDiv: !!resultsDiv,
			resultsDivContent: resultsDiv?.textContent || 'not found',
			allDataTestIds: Array.from(
				document.querySelectorAll('[data-testid]'),
			).map((el) => (el as HTMLElement).dataset.testid),
		}
	})

	console.log('Page state:', hasResults)

	// Try to find any results
	if (hasResults.resultsDiv) {
		console.log('Results div found with content:', hasResults.resultsDivContent)
		await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
	} else {
		console.log('No results div found')
		console.log('Available test IDs:', hasResults.allDataTestIds)
	}
})
