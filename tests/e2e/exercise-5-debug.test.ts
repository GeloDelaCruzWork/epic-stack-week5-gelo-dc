import { test, expect } from '#tests/playwright-utils'

test('debug mock search results', async ({ page, login }) => {
	// Login first
	await login()

	let interceptedCount = 0

	// Setup intercept with debug logging
	await page.route('**/api/search**', async (route, request) => {
		interceptedCount++
		console.log('Intercepted request #' + interceptedCount + ':', request.url())

		const response = {
			results: [
				{
					id: '1',
					title: 'Mocked Result 1',
					type: 'note',
					description: 'This is a mocked note result',
				},
			],
		}

		console.log('Sending mocked response:', JSON.stringify(response))

		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(response),
		})
	})

	// Navigate to search page
	await page.goto('/search')

	// Check the page loads
	const searchInput = page.getByTestId('search-input')
	await expect(searchInput).toBeVisible()

	// Add console log listener to debug
	page.on('console', (msg) => {
		console.log('Browser console:', msg.type(), msg.text())
	})

	// Type a search query
	await searchInput.fill('test query')

	// Click the search button
	await page.getByTestId('search-button').click()

	// Wait a bit for the network request
	await page.waitForTimeout(2000)

	// Debug: take a screenshot
	await page.screenshot({ path: 'debug-search.png' })

	// Check the page content
	const content = await page.content()
	console.log(
		'Page has search-results div:',
		content.includes('data-testid="search-results"'),
	)

	// Check if results are visible
	const resultsDiv = page.getByTestId('search-results')
	const isVisible = await resultsDiv.isVisible()
	console.log('Search results div is visible:', isVisible)

	if (isVisible) {
		const resultsText = await resultsDiv.textContent()
		console.log('Results div content:', resultsText)
	}

	// Check for any errors
	const errorElements = await page.locator('.error, [role="alert"]').all()
	for (const elem of errorElements) {
		console.log('Error found:', await elem.textContent())
	}

	// Log how many times the API was intercepted
	console.log('Total intercepted requests:', interceptedCount)

	// Check if the API was even called
	if (interceptedCount === 0) {
		console.log('WARNING: The API was never called!')

		// Let's try to debug why
		const buttonExists = await page.getByTestId('search-button').isVisible()
		console.log('Search button exists:', buttonExists)

		// Check form submission
		const forms = await page.locator('form').all()
		console.log('Number of forms on page:', forms.length)
	}
})
