import { test, expect } from '#tests/playwright-utils'

test.describe('Exercise 5: Network Request Interception', () => {
	test('should intercept and mock search API responses', async ({
		page,
		login,
	}) => {
		await login()

		// Set up the mock before navigation
		await page.route('**/api/search*', async (route) => {
			const url = new URL(route.request().url())
			const query = url.searchParams.get('q')

			// Return different responses based on query
			if (query === 'empty') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({ results: [] }),
				})
			} else if (query === 'error') {
				await route.fulfill({
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Server error' }),
				})
			} else {
				// Default mock response with test data
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						results: [
							{
								id: '1',
								title: 'Mocked Note Result',
								type: 'note',
								description: 'This is a mocked note from the test',
							},
							{
								id: '2',
								title: 'Mocked User Result',
								type: 'user',
								description: '@mockeduser',
							},
							{
								id: '3',
								title: 'Another Mocked Note',
								type: 'note',
								description: 'Another test note with important content',
							},
						],
					}),
				})
			}
		})

		// Navigate to the search page
		await page.goto('/search')
		await page.waitForLoadState('networkidle')

		// Verify search input is visible
		const searchInput = page.getByTestId('search-input')
		await expect(searchInput).toBeVisible()

		// Test 1: Search with results
		console.log('Testing search with mocked results...')
		await searchInput.fill('test')
		await searchInput.press('Enter')

		// Wait for and verify results
		await page.waitForSelector('[data-testid="search-results"]', {
			timeout: 5000,
		})
		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(3)

		// Verify specific content
		await expect(results.nth(0)).toContainText('Mocked Note Result')
		await expect(results.nth(1)).toContainText('Mocked User Result')
		await expect(results.nth(2)).toContainText('Another Mocked Note')

		// Test 2: Search with empty results
		console.log('Testing search with empty results...')
		await searchInput.clear()
		await searchInput.fill('empty')
		await searchInput.press('Enter')

		// Wait for the no results message
		await page.waitForTimeout(500)
		await expect(page.locator('text="No results found"')).toBeVisible()

		// Test 3: Test error handling
		console.log('Testing error handling...')
		await searchInput.clear()
		await searchInput.fill('error')
		await searchInput.press('Enter')

		// Wait and verify no results are shown on error
		await page.waitForTimeout(500)
		const errorResults = page.getByTestId('search-result')
		await expect(errorResults).toHaveCount(0)
	})

	test('should count and modify responses dynamically', async ({
		page,
		login,
	}) => {
		await login()

		let requestCount = 0

		// Dynamic response based on request count
		await page.route('**/api/search*', async (route) => {
			requestCount++
			const response = {
				results: Array.from({ length: requestCount }, (_, i) => ({
					id: `${requestCount}-${i}`,
					title: `Result ${i + 1} from request ${requestCount}`,
					type: i % 2 === 0 ? 'note' : 'user',
					description: `Description for request ${requestCount}`,
				})),
			}

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(response),
			})
		})

		await page.goto('/search')

		// First search - should return 1 result
		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('first')
		await searchInput.press('Enter')

		await page.waitForSelector('[data-testid="search-results"]', {
			timeout: 5000,
		})
		await expect(page.getByTestId('search-result')).toHaveCount(1)

		// Second search - should return 2 results
		await searchInput.clear()
		await searchInput.fill('second')
		await searchInput.press('Enter')

		// Wait for results to update
		await page.waitForFunction(
			() =>
				document.querySelectorAll('[data-testid="search-result"]').length === 2,
			{ timeout: 5000 },
		)
		await expect(page.getByTestId('search-result')).toHaveCount(2)

		// Verify request count
		expect(requestCount).toBe(2)
	})
})
