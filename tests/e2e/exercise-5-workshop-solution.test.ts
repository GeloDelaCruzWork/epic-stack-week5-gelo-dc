import { test, expect } from '#tests/playwright-utils'

/**
 * Exercise 5 Workshop Solution: Intercept Network Requests
 *
 * This test demonstrates how to intercept and mock API responses
 * in Playwright tests for the Epic Stack application using React Router v7.
 *
 * Key Concepts:
 * 1. React Router v7 uses `.data` suffix for data requests
 * 2. The response format is a special JSON array structure
 * 3. We intercept the request before it reaches the server
 * 4. Mock data is returned instantly for fast, reliable tests
 */

test.describe('Exercise 5: Network Request Interception', () => {
	test('mock /api/search endpoint successfully', async ({ page, login }) => {
		// First, login to authenticate
		await login()

		// Set up API interception BEFORE navigating to the page
		// This ensures the mock is ready when the API call is made
		await page.route('**/api/search.data**', (route) => {
			console.log('Intercepting API request:', route.request().url())

			// Create mock response in React Router v7 format
			// This is a special JSON array structure
			const mockResponse = [
				{ _1: 2 },
				'routes/api.search',
				{
					results: [
						{
							id: 'mock-note-1',
							title: 'Workshop Test Note',
							type: 'note',
							description: 'This is a mocked note from our Playwright workshop',
						},
						{
							id: 'mock-user-1',
							title: 'Workshop Test User',
							type: 'user',
							description: '@workshopuser - Testing network interception',
						},
						{
							id: 'mock-note-2',
							title: 'Another Workshop Note',
							type: 'note',
							description: 'Demonstrating multiple results in the mock',
						},
					],
				},
			]

			// Fulfill the request with our mock data
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

		// Now navigate to the search page
		await page.goto('/search')

		// Ensure the page is fully loaded
		await page.waitForLoadState('networkidle')

		// Find and interact with the search input
		const searchInput = page.getByTestId('search-input')
		await expect(searchInput).toBeVisible()
		await searchInput.fill('workshop test query')

		// Submit the search by clicking the button
		const searchButton = page.getByTestId('search-button')
		await searchButton.click()

		// Wait for the results container to appear
		// This confirms our mock data was received and rendered
		await page.waitForSelector('[data-testid="search-results"]', {
			state: 'visible',
			timeout: 10000,
		})

		// Verify all three mocked results are displayed
		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(3)

		// Verify the content of each result
		// First result - Note
		const firstResult = results.nth(0)
		await expect(firstResult).toContainText('Workshop Test Note')
		await expect(firstResult).toContainText(
			'This is a mocked note from our Playwright workshop',
		)
		await expect(firstResult).toContainText('note')

		// Second result - User
		const secondResult = results.nth(1)
		await expect(secondResult).toContainText('Workshop Test User')
		await expect(secondResult).toContainText('@workshopuser')
		await expect(secondResult).toContainText('user')

		// Third result - Note
		const thirdResult = results.nth(2)
		await expect(thirdResult).toContainText('Another Workshop Note')
		await expect(thirdResult).toContainText('Demonstrating multiple results')

		// Verify the result count display
		await expect(page.locator('text=Search Results (3)')).toBeVisible()

		console.log('✅ Successfully mocked and verified API search results!')
	})

	test('handle empty search results', async ({ page, login }) => {
		await login()

		// Mock empty results
		await page.route('**/api/search.data**', (route) => {
			const emptyResponse = [
				{ _1: 2 },
				'routes/api.search',
				{ results: [] }, // Empty results array
			]

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
		await page.waitForLoadState('networkidle')

		// Perform a search
		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('nonexistent item')
		await page.getByTestId('search-button').click()

		// Wait for the results area to update
		await page.waitForTimeout(1000)

		// Verify "No results found" message appears
		await expect(page.locator('text=No results found')).toBeVisible()

		console.log('✅ Empty results handled correctly!')
	})

	test('simulate API error', async ({ page, login }) => {
		await login()

		// Mock an error response
		await page.route('**/api/search.data**', (route) => {
			route.fulfill({
				status: 500,
				contentType: 'text/plain',
				body: 'Internal Server Error',
			})
		})

		await page.goto('/search')

		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('error test')
		await page.getByTestId('search-button').click()

		// Wait for error handling
		await page.waitForTimeout(1000)

		// In this implementation, errors result in no results being shown
		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(0)

		console.log('✅ API errors handled gracefully!')
	})

	test('verify request parameters', async ({ page, login }) => {
		await login()

		let capturedUrl = ''

		// Capture the request URL to verify query parameters
		await page.route('**/api/search.data**', (route) => {
			capturedUrl = route.request().url()

			// Return some results
			const response = [
				{ _1: 2 },
				'routes/api.search',
				{
					results: [
						{ id: '1', title: 'Test', type: 'note', description: 'Test' },
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

		// Search with special characters to test URL encoding
		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('test & special "chars"')
		await page.getByTestId('search-button').click()

		// Wait for the request
		await page.waitForTimeout(500)

		// Verify the URL was properly encoded
		expect(capturedUrl).toContain('api/search.data')
		expect(capturedUrl).toContain('q=test')
		expect(capturedUrl).toContain('special')
		// Special characters should be encoded
		expect(capturedUrl).toMatch(/(%26|%22|&amp;|&quot;)/) // & or " encoded

		console.log('✅ Request parameters properly encoded!')
		console.log('Captured URL:', capturedUrl)
	})

	test('dynamic response based on query', async ({ page, login }) => {
		await login()

		// Return different results based on the search query
		await page.route('**/api/search.data**', (route) => {
			const url = new URL(route.request().url())
			const query = url.searchParams.get('q') || ''

			let results = []
			if (query.includes('user')) {
				results = [
					{
						id: 'u1',
						title: 'User Result',
						type: 'user',
						description: '@testuser',
					},
				]
			} else if (query.includes('note')) {
				results = [
					{
						id: 'n1',
						title: 'Note Result',
						type: 'note',
						description: 'Test note',
					},
				]
			} else {
				results = [
					{
						id: 'm1',
						title: 'Mixed Result',
						type: 'note',
						description: 'Default result',
					},
				]
			}

			const response = [{ _1: 2 }, 'routes/api.search', { results: results }]

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

		// Test 1: Search for "user"
		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('user')
		await page.getByTestId('search-button').click()
		await page.waitForTimeout(500)

		let results = page.getByTestId('search-result')
		await expect(results.first()).toContainText('User Result')
		await expect(results.first()).toContainText('@testuser')

		// Test 2: Search for "note"
		await searchInput.clear()
		await searchInput.fill('note')
		await page.getByTestId('search-button').click()
		await page.waitForTimeout(500)

		results = page.getByTestId('search-result')
		await expect(results.first()).toContainText('Note Result')
		await expect(results.first()).toContainText('Test note')

		// Test 3: Search for something else
		await searchInput.clear()
		await searchInput.fill('other')
		await page.getByTestId('search-button').click()
		await page.waitForTimeout(500)

		results = page.getByTestId('search-result')
		await expect(results.first()).toContainText('Mixed Result')
		await expect(results.first()).toContainText('Default result')

		console.log('✅ Dynamic responses based on query working!')
	})
})

// Additional test for debugging purposes
test('debug: log all network activity', async ({ page, login }) => {
	await login()

	// Log console messages to see if there are errors
	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			console.log('❌ Console Error:', msg.text())
		}
	})

	// Log all requests to help debug issues
	page.on('request', (request) => {
		if (request.url().includes('search') || request.url().includes('api')) {
			console.log('📤 Request:', request.method(), request.url())
		}
	})

	page.on('response', (response) => {
		if (response.url().includes('search') || response.url().includes('api')) {
			console.log('📥 Response:', response.status(), response.url())
		}
	})

	// Set up mock
	await page.route('**/api/search.data**', (route) => {
		console.log('🎯 Intercepted:', route.request().url())

		const response = [
			{ _1: 2 },
			'routes/api.search',
			{
				results: [
					{
						id: 'debug',
						title: 'Debug Test',
						type: 'note',
						description: 'For debugging',
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
	await page.waitForLoadState('networkidle')

	// Check if button exists and is clickable
	const searchButton = page.getByTestId('search-button')
	const buttonExists = await searchButton.isVisible()
	console.log('Button visible:', buttonExists)

	const searchInput = page.getByTestId('search-input')
	await searchInput.fill('debug')

	// Try to click button and see what happens
	console.log('Clicking button...')
	await searchButton.click()
	console.log('Button clicked')

	await page.waitForTimeout(2000)

	// Check what's on the page
	const pageContent = await page.evaluate(() => {
		const resultsDiv = document.querySelector('[data-testid="search-results"]')
		return {
			hasResultsDiv: !!resultsDiv,
			resultsDivVisible: resultsDiv
				? window.getComputedStyle(resultsDiv).display !== 'none'
				: false,
			resultsDivContent: resultsDiv?.textContent || 'not found',
		}
	})

	console.log('📋 Page state:', pageContent)
})
