import { test, expect } from '#tests/playwright-utils'

test.describe('Exercise 5: Network Interception - /search and /api/search', () => {
	test('mock API search endpoint - JSON response', async ({ page, login }) => {
		// Login first since the search route requires authentication
		await login()

		// Intercept the /api/search endpoint and return mock JSON data
		await page.route('**/api/search?*', async (route) => {
			const url = new URL(route.request().url())
			const query = url.searchParams.get('q')

			console.log('Intercepted API search for:', query)

			// Return different mock data based on search query
			const mockResults =
				query === 'test'
					? [
							{
								id: '1',
								title: 'Test Result 1',
								type: 'note',
								description: 'First test result',
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
								description: 'Another test result',
							},
						]
					: query === 'admin'
						? [
								{
									id: '4',
									title: 'Admin Dashboard',
									type: 'note',
									description: 'Admin panel access',
								},
								{
									id: '5',
									title: 'Admin User',
									type: 'user',
									description: '@adminuser',
								},
							]
						: []

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ results: mockResults }),
			})
		})

		// Navigate to the search page
		await page.goto('/search')

		// Wait for the search input to be visible
		const searchInput = page.getByTestId('search-input')
		await expect(searchInput).toBeVisible()

		// Test 1: Search for "test"
		await searchInput.fill('test')
		await page.getByTestId('search-button').click()

		// Wait for results to appear
		await page.waitForSelector('[data-testid="search-results"]')

		// Verify the mocked results are displayed
		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(3)

		// Verify specific content
		await expect(results.nth(0)).toContainText('Test Result 1')
		await expect(results.nth(0)).toContainText('note')
		await expect(results.nth(1)).toContainText('Test Result 2')
		await expect(results.nth(1)).toContainText('user')
		await expect(results.nth(2)).toContainText('Test Result 3')

		// Test 2: Search for "admin"
		await searchInput.clear()
		await searchInput.fill('admin')
		await page.getByTestId('search-button').click()

		// Wait for new results
		await page.waitForTimeout(500)

		// Verify admin results
		await expect(page.getByTestId('search-result')).toHaveCount(2)
		await expect(page.locator('[data-testid="search-results"]')).toContainText(
			'Admin Dashboard',
		)
		await expect(page.locator('[data-testid="search-results"]')).toContainText(
			'Admin User',
		)

		// Test 3: Empty search
		await searchInput.clear()
		await searchInput.fill('nonexistent')
		await page.getByTestId('search-button').click()

		// Wait and verify no results message
		await page.waitForTimeout(500)
		await expect(page.locator('[data-testid="search-results"]')).toContainText(
			'No results found',
		)
	})

	test('intercept and count API requests', async ({ page, login }) => {
		await login()

		let requestCount = 0
		const requestLog: string[] = []

		// Count and log all search API requests
		await page.route('**/api/search?*', async (route) => {
			requestCount++
			const url = new URL(route.request().url())
			const query = url.searchParams.get('q')
			requestLog.push(`Request ${requestCount}: ${query}`)

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					results: [
						{
							id: `${requestCount}`,
							title: `Result from request #${requestCount}`,
							type: 'note',
							description: `Query was: ${query}`,
						},
					],
				}),
			})
		})

		await page.goto('/search')

		// Make multiple searches
		const searchInput = page.getByTestId('search-input')

		// Search 1
		await searchInput.fill('first')
		await page.getByTestId('search-button').click()
		await page.waitForSelector('[data-testid="search-results"]')
		await expect(page.getByTestId('search-result')).toContainText(
			'Result from request #1',
		)

		// Search 2
		await searchInput.clear()
		await searchInput.fill('second')
		await page.getByTestId('search-button').click()
		await page.waitForTimeout(500)
		await expect(page.getByTestId('search-result')).toContainText(
			'Result from request #2',
		)

		// Search 3
		await searchInput.clear()
		await searchInput.fill('third')
		await page.getByTestId('search-button').click()
		await page.waitForTimeout(500)
		await expect(page.getByTestId('search-result')).toContainText(
			'Result from request #3',
		)

		// Verify request count
		expect(requestCount).toBe(3)
		expect(requestLog).toEqual([
			'Request 1: first',
			'Request 2: second',
			'Request 3: third',
		])
	})

	test('mock API error responses', async ({ page, login }) => {
		await login()

		// Mock different error scenarios
		await page.route('**/api/search?*', async (route) => {
			const url = new URL(route.request().url())
			const query = url.searchParams.get('q')

			if (query === 'error500') {
				// Simulate server error
				await route.fulfill({
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Internal Server Error' }),
				})
			} else if (query === 'error404') {
				// Simulate not found
				await route.fulfill({
					status: 404,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Not Found' }),
				})
			} else if (query === 'timeout') {
				// Simulate timeout by not responding
				await new Promise((resolve) => setTimeout(resolve, 5000))
				await route.abort()
			} else {
				// Normal response
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({ results: [] }),
				})
			}
		})

		await page.goto('/search')
		const searchInput = page.getByTestId('search-input')

		// Test server error
		await searchInput.fill('error500')
		await page.getByTestId('search-button').click()
		await page.waitForTimeout(1000)
		// The app should handle the error gracefully (no results shown)
		await expect(page.getByTestId('search-result')).not.toBeVisible()

		// Test 404
		await searchInput.clear()
		await searchInput.fill('error404')
		await page.getByTestId('search-button').click()
		await page.waitForTimeout(1000)
		await expect(page.getByTestId('search-result')).not.toBeVisible()
	})

	test('modify response headers and status', async ({ page, login }) => {
		await login()

		await page.route('**/api/search?*', async (route) => {
			await route.fulfill({
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'X-Custom-Header': 'Mocked-Response',
					'X-Request-ID': 'test-123',
					'Cache-Control': 'no-cache',
				},
				body: JSON.stringify({
					results: [
						{
							id: '1',
							title: 'Custom Headers Test',
							type: 'note',
							description: 'Testing headers',
						},
					],
					metadata: {
						source: 'mocked',
						timestamp: new Date().toISOString(),
					},
				}),
			})
		})

		// Listen for the response to verify headers
		page.on('response', (response) => {
			if (response.url().includes('/api/search')) {
				console.log('Response headers:', response.headers())
			}
		})

		await page.goto('/search')

		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('test')
		await page.getByTestId('search-button').click()

		await page.waitForSelector('[data-testid="search-results"]')
		await expect(page.getByTestId('search-result')).toContainText(
			'Custom Headers Test',
		)
	})

	test('workshop solution - simple API mocking', async ({ page, login }) => {
		// This is the simplest solution for the workshop
		await login()

		// Step 1: Intercept API calls
		await page.route('**/api/search?*', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					results: [
						{
							id: 1,
							title: 'Mocked Result 1',
							type: 'note',
							description: 'First mocked result',
						},
						{
							id: 2,
							title: 'Mocked Result 2',
							type: 'user',
							description: 'Second mocked result',
						},
					],
				}),
			})
		})

		// Step 2: Navigate to search page
		await page.goto('/search')

		// Step 3: Perform search
		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('anything')
		await page.getByTestId('search-button').click()

		// Step 4: Verify mocked results appear
		await page.waitForSelector('[data-testid="search-results"]')
		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(2)
		await expect(results.first()).toContainText('Mocked Result 1')
		await expect(results.nth(1)).toContainText('Mocked Result 2')
	})
})
