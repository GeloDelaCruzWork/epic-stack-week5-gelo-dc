import { test, expect } from '#tests/playwright-utils'

// Working solution for Exercise 5: Intercept Network Requests
test.describe('Exercise 5: API Search Mocking', () => {
	test('mock /api/search with correct format for React Router v7', async ({
		page,
		login,
	}) => {
		await login()

		// Intercept the API call and return mock data
		// React Router v7 uses .data suffix for data requests
		await page.route('**/api/search.data**', (route) => {
			// React Router v7 uses a special JSON array format for data responses
			const mockResponse = [
				{ _1: 2 },
				'routes/api.search',
				{
					results: [
						{
							id: 'mock-1',
							title: 'Mocked Note Result',
							type: 'note',
							description: 'This is a mocked note from the test',
						},
						{
							id: 'mock-2',
							title: 'Mocked User',
							type: 'user',
							description: '@mockeduser - Test user account',
						},
						{
							id: 'mock-3',
							title: 'Another Test Note',
							type: 'note',
							description: 'Important meeting notes from the test',
						},
					],
				},
			]

			route.fulfill({
				status: 200,
				contentType: 'text/x-script; charset=utf-8',
				headers: {
					'content-type': 'text/x-script; charset=utf-8',
					'x-remix-response': 'yes',
				},
				body: JSON.stringify(mockResponse),
			})
		})

		// Navigate to the search page
		await page.goto('/search')
		await page.waitForLoadState('networkidle')

		// Find the search input and enter a query
		const searchInput = page.getByTestId('search-input')
		await expect(searchInput).toBeVisible()
		await searchInput.fill('test query')

		// Click the search button
		const searchButton = page.getByTestId('search-button')
		await searchButton.click()

		// Wait for results to appear
		await page.waitForSelector('[data-testid="search-results"]', {
			state: 'visible',
			timeout: 10000,
		})

		// Verify the mocked results are displayed
		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(3)

		// Check first result
		await expect(results.nth(0)).toContainText('Mocked Note Result')
		await expect(results.nth(0)).toContainText(
			'This is a mocked note from the test',
		)
		await expect(results.nth(0)).toContainText('note')

		// Check second result
		await expect(results.nth(1)).toContainText('Mocked User')
		await expect(results.nth(1)).toContainText('@mockeduser')
		await expect(results.nth(1)).toContainText('user')

		// Check third result
		await expect(results.nth(2)).toContainText('Another Test Note')
		await expect(results.nth(2)).toContainText('Important meeting notes')
		await expect(results.nth(2)).toContainText('note')

		// Verify result count
		await expect(page.locator('text=Search Results (3)')).toBeVisible()
	})

	test('handle empty results', async ({ page, login }) => {
		await login()

		await page.route('**/api/search.data**', (route) => {
			const emptyResponse = [{ _1: 2 }, 'routes/api.search', { results: [] }]

			route.fulfill({
				status: 200,
				contentType: 'text/x-script; charset=utf-8',
				headers: {
					'content-type': 'text/x-script; charset=utf-8',
					'x-remix-response': 'yes',
				},
				body: JSON.stringify(emptyResponse),
			})
		})

		await page.goto('/search')

		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('empty search')
		await page.getByTestId('search-button').click()

		// Wait for response
		await page.waitForTimeout(1000)

		// Verify "No results found" message
		await expect(page.locator('text=No results found')).toBeVisible()
	})

	test('verify search with Enter key', async ({ page, login }) => {
		await login()

		await page.route('**/api/search.data**', (route) => {
			const response = [
				{ _1: 2 },
				'routes/api.search',
				{
					results: [
						{
							id: 'enter-test',
							title: 'Enter Key Test',
							type: 'note',
							description: 'Submitted with Enter key',
						},
					],
				},
			]

			route.fulfill({
				status: 200,
				contentType: 'text/x-script; charset=utf-8',
				headers: {
					'content-type': 'text/x-script; charset=utf-8',
					'x-remix-response': 'yes',
				},
				body: JSON.stringify(response),
			})
		})

		await page.goto('/search')

		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('enter test')

		// Press Enter instead of clicking button
		await searchInput.press('Enter')

		// Wait for results
		await page.waitForSelector('[data-testid="search-results"]', {
			state: 'visible',
			timeout: 10000,
		})

		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(1)
		await expect(results.first()).toContainText('Enter Key Test')
		await expect(results.first()).toContainText('Submitted with Enter key')
	})

	test('multiple searches with different results', async ({ page, login }) => {
		await login()

		let searchCount = 0

		await page.route('**/api/search.data**', (route) => {
			searchCount++

			const response =
				searchCount === 1
					? [
							{ _1: 2 },
							'routes/api.search',
							{
								results: [
									{
										id: 'first-1',
										title: 'First Search Result',
										type: 'note',
										description: 'Initial search',
									},
								],
							},
						]
					: [
							{ _1: 2 },
							'routes/api.search',
							{
								results: [
									{
										id: 'second-1',
										title: 'Second Search - Item 1',
										type: 'note',
										description: 'Updated results',
									},
									{
										id: 'second-2',
										title: 'Second Search - Item 2',
										type: 'user',
										description: '@seconduser',
									},
								],
							},
						]

			route.fulfill({
				status: 200,
				contentType: 'text/x-script; charset=utf-8',
				headers: {
					'content-type': 'text/x-script; charset=utf-8',
					'x-remix-response': 'yes',
				},
				body: JSON.stringify(response),
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
			'First Search Result',
		)

		// Second search
		await searchInput.clear()
		await searchInput.fill('second')
		await page.getByTestId('search-button').click()

		// Wait for new results
		await page.waitForFunction(
			() =>
				document.querySelectorAll('[data-testid="search-result"]').length === 2,
			{ timeout: 5000 },
		)

		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(2)
		await expect(results.first()).toContainText('Second Search - Item 1')
		await expect(results.nth(1)).toContainText('Second Search - Item 2')

		// Verify both searches were made
		expect(searchCount).toBe(2)
	})
})

// Alternative approach using simple page navigation (for comparison)
test.describe('Alternative: Search Page Navigation', () => {
	test('search using URL parameters', async ({ page, login }) => {
		await login()

		// Mock the search results page
		await page.route('**/search?**', async (route) => {
			if (route.request().method() === 'GET') {
				// Let the normal page load but we can verify the URL
				await route.continue()
			}
		})

		// Navigate directly with search query
		await page.goto('/search')

		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('url test')

		// Track navigation
		const navigationPromise = page.waitForURL('**/search?**')
		await page.getByTestId('search-button').click()

		// This would navigate if it was a regular form
		// But since we're using fetcher.load, it stays on same page
		try {
			await navigationPromise
			console.log('Navigated to search URL')
		} catch {
			console.log('No navigation occurred - using fetcher')
		}
	})
})
