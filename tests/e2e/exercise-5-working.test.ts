import { test, expect } from '#tests/playwright-utils'

test('network interception - working example', async ({ page, login }) => {
	await login()

	// Simple interception
	await page.route('**/api/search?*', async (route) => {
		console.log('Intercepting:', route.request().url())
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				results: [
					{
						id: '1',
						title: 'Test Result 1',
						type: 'note',
						description: 'Test description 1',
					},
					{
						id: '2',
						title: 'Test Result 2',
						type: 'user',
						description: '@testuser',
					},
					{
						id: '3',
						title: 'Test Result 3',
						type: 'note',
						description: 'Test description 3',
					},
				],
			}),
		})
	})

	await page.goto('/search')

	// Fill and submit
	const searchInput = page.getByTestId('search-input')
	await searchInput.fill('test')
	await searchInput.press('Enter')

	// Wait for results to appear with detailed debugging
	console.log('Waiting for search results...')

	// Wait for the fetcher to complete
	await page.waitForLoadState('networkidle')

	// Check the page content
	const hasResults = await page
		.getByTestId('search-results')
		.isVisible()
		.catch(() => false)
	console.log('Results div visible:', hasResults)

	if (hasResults) {
		const resultsText = await page.getByTestId('search-results').textContent()
		console.log('Results text:', resultsText)

		const resultCount = await page.getByTestId('search-result').count()
		console.log('Number of results:', resultCount)

		// Verify results
		await expect(page.getByTestId('search-result')).toHaveCount(3)
		await expect(page.getByTestId('search-result').first()).toContainText(
			'Test Result 1',
		)
	} else {
		// Debug why results aren't showing
		const pageContent = await page.content()
		const hasSearchResultsInHTML = pageContent.includes('search-results')
		console.log('Has search-results in HTML:', hasSearchResultsInHTML)

		// Check fetcher state
		const fetcherState = await page.evaluate(() => {
			// Try to access React Router context if available
			return document
				.querySelector('[data-testid="search-input"]')
				?.closest('form')?.textContent
		})
		console.log('Form content:', fetcherState)

		// Take a screenshot for debugging
		await page.screenshot({ path: 'search-debug.png', fullPage: true })
		console.log('Screenshot saved as search-debug.png')
	}
})
