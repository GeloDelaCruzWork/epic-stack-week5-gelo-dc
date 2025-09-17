import { test, expect } from '#tests/playwright-utils'

test.describe('Search and API Search Tests', () => {
	test('mock /api/search endpoint - fetcher.Form version', async ({
		page,
		login,
	}) => {
		await login()

		// Intercept API calls and return mock data (React Router adds .data suffix)
		await page.route('**/api/search**', (route) => {
			console.log('API intercepted:', route.request().url())
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					results: [
						{
							id: '1',
							title: 'Mocked Note Result',
							type: 'note',
							description: 'This is a mocked note from the API',
						},
						{
							id: '2',
							title: 'Mocked User Result',
							type: 'user',
							description: '@mockeduser - Test user account',
						},
						{
							id: '3',
							title: 'Another Note',
							type: 'note',
							description: 'Important meeting notes from yesterday',
						},
					],
				}),
			})
		})

		// Navigate to search page
		await page.goto('/search')

		// Wait for page to be ready
		await page.waitForLoadState('networkidle')

		// Find and fill the search input
		const searchInput = page.getByTestId('search-input')
		await expect(searchInput).toBeVisible()
		await searchInput.fill('test search query')

		// Click the search button
		await page.getByTestId('search-button').click()

		// Wait for results to appear
		await page.waitForSelector('[data-testid="search-results"]', {
			timeout: 10000,
		})

		// Verify the results are displayed
		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(3)

		// Verify each result content
		await expect(results.nth(0)).toContainText('Mocked Note Result')
		await expect(results.nth(0)).toContainText(
			'This is a mocked note from the API',
		)
		await expect(results.nth(0)).toContainText('note')

		await expect(results.nth(1)).toContainText('Mocked User Result')
		await expect(results.nth(1)).toContainText('@mockeduser')
		await expect(results.nth(1)).toContainText('user')

		await expect(results.nth(2)).toContainText('Another Note')
		await expect(results.nth(2)).toContainText('Important meeting notes')

		// Verify result count display
		await expect(page.locator('text=Search Results (3)')).toBeVisible()
	})

	test('handle empty search results', async ({ page, login }) => {
		await login()

		// Mock empty results
		await page.route('**/api/search**', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					results: [],
				}),
			})
		})

		await page.goto('/search')

		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('no results query')
		await page.getByTestId('search-button').click()

		// Wait a moment for the response
		await page.waitForTimeout(1000)

		// Verify no results message
		await expect(page.locator('text=No results found')).toBeVisible()
	})

	test('verify API request parameters', async ({ page, login }) => {
		await login()

		let capturedUrl = ''

		// Capture the request URL
		await page.route('**/api/search**', (route) => {
			capturedUrl = route.request().url()
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ results: [] }),
			})
		})

		await page.goto('/search')

		// Search with special characters to test encoding
		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('test & special "chars"')
		await page.getByTestId('search-button').click()

		// Wait for request to be made
		await page.waitForTimeout(500)

		// Verify URL encoding
		expect(capturedUrl).toContain('api/search')
		expect(capturedUrl).toContain('q=test')
		expect(capturedUrl).toContain('special')
	})

	test('simulate API error handling', async ({ page, login }) => {
		await login()

		// Mock API error
		await page.route('**/api/search**', (route) => {
			route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({
					error: 'Internal server error',
				}),
			})
		})

		await page.goto('/search')

		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('error test')
		await page.getByTestId('search-button').click()

		// Wait for error handling
		await page.waitForTimeout(1000)

		// In this implementation, errors show as empty results
		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(0)
	})

	test('verify loading state during search', async ({ page, login }) => {
		await login()

		// Add a delay to see loading state
		await page.route('**/api/search**', async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 1000))
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					results: [
						{ id: '1', title: 'Result', type: 'note', description: 'Test' },
					],
				}),
			})
		})

		await page.goto('/search')

		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('test')

		// Click search and immediately check for loading state
		await page.getByTestId('search-button').click()

		// Should show loading indicator
		await expect(page.locator('text=Searching...')).toBeVisible()

		// Wait for results
		await page.waitForSelector('[data-testid="search-results"]', {
			timeout: 5000,
		})

		// Loading should be gone
		await expect(page.locator('text=Searching...')).not.toBeVisible()
	})

	test('multiple searches with different results', async ({ page, login }) => {
		await login()

		let searchCount = 0

		// Return different results for each search
		await page.route('**/api/search**', (route) => {
			searchCount++
			const results =
				searchCount === 1
					? [
							{
								id: '1',
								title: 'First Search',
								type: 'note',
								description: 'Initial results',
							},
						]
					: [
							{
								id: '2',
								title: 'Second Search A',
								type: 'note',
								description: 'Updated results',
							},
							{
								id: '3',
								title: 'Second Search B',
								type: 'user',
								description: '@user2',
							},
						]

			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ results }),
			})
		})

		await page.goto('/search')

		// First search
		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('first')
		await page.getByTestId('search-button').click()

		await page.waitForSelector('[data-testid="search-results"]')
		await expect(page.getByTestId('search-result')).toHaveCount(1)
		await expect(page.getByTestId('search-result').first()).toContainText(
			'First Search',
		)

		// Second search
		await searchInput.clear()
		await searchInput.fill('second')
		await page.getByTestId('search-button').click()

		// Wait for new results
		await page.waitForFunction(
			() =>
				document.querySelectorAll('[data-testid="search-result"]').length === 2,
		)

		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(2)
		await expect(results.first()).toContainText('Second Search A')
		await expect(results.nth(1)).toContainText('Second Search B')

		// Verify search was called twice
		expect(searchCount).toBe(2)
	})

	test('search with Enter key', async ({ page, login }) => {
		await login()

		await page.route('**/api/search**', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					results: [
						{
							id: '1',
							title: 'Enter Key Result',
							type: 'note',
							description: 'Submitted with Enter',
						},
					],
				}),
			})
		})

		await page.goto('/search')

		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('enter key test')

		// Press Enter instead of clicking button
		await searchInput.press('Enter')

		// Wait for results
		await page.waitForSelector('[data-testid="search-results"]')

		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(1)
		await expect(results.first()).toContainText('Enter Key Result')
	})
})

test.describe('Direct API Tests', () => {
	test('test API endpoint directly', async ({ page, login }) => {
		await login()

		// Directly call the API and verify response
		const response = await page.request.get('/api/search?q=test')
		expect(response.status()).toBe(200)

		const data = await response.json()
		expect(data).toHaveProperty('results')
		expect(Array.isArray(data.results)).toBe(true)
	})

	test('API requires authentication', async ({ page }) => {
		// Try to access API without logging in
		const response = await page.request.get('/api/search?q=test')

		// Should redirect or return 401/403
		expect([302, 401, 403]).toContain(response.status())
	})
})
