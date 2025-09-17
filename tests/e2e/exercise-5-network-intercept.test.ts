import { test, expect } from '#tests/playwright-utils'

test('mock search results', async ({ page, login }) => {
	// Login first
	await login()

	// Intercept API calls and return mock data
	await page.route('**/api/search**', (route) => {
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				results: [
					{
						id: '1',
						title: 'Mocked Result 1',
						type: 'note',
						description: 'This is a mocked note result',
					},
					{
						id: '2',
						title: 'Mocked Result 2',
						type: 'user',
						description: '@mockeduser',
					},
					{
						id: '3',
						title: 'Mocked Result 3',
						type: 'note',
						description: 'Another mocked note with important content',
					},
				],
			}),
		})
	})

	// Navigate to search page
	await page.goto('/search')

	// Wait for the page to load
	await page.waitForLoadState('networkidle')

	// Verify the search input is visible
	const searchInput = page.getByTestId('search-input')
	await expect(searchInput).toBeVisible()

	// Type a search query - need to trigger React onChange
	await searchInput.click()
	await searchInput.fill('test query')

	// Press Enter to submit the form (more reliable than button click)
	await searchInput.press('Enter')

	// Wait for results to appear
	await page.waitForSelector('[data-testid="search-results"]', {
		timeout: 10000,
	})

	// Verify mocked results appear
	const results = page.getByTestId('search-result')
	await expect(results).toHaveCount(3)

	// Verify the content of the mocked results
	await expect(results.nth(0)).toContainText('Mocked Result 1')
	await expect(results.nth(0)).toContainText('This is a mocked note result')
	await expect(results.nth(0)).toContainText('note')

	await expect(results.nth(1)).toContainText('Mocked Result 2')
	await expect(results.nth(1)).toContainText('@mockeduser')
	await expect(results.nth(1)).toContainText('user')

	await expect(results.nth(2)).toContainText('Mocked Result 3')
	await expect(results.nth(2)).toContainText(
		'Another mocked note with important content',
	)

	// Verify the result count is displayed
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
	await searchInput.click()
	await searchInput.fill('nonexistent query')
	await searchInput.press('Enter')

	// Wait for response
	await page.waitForTimeout(500)

	// Verify "no results" message appears
	await expect(page.locator('text=/No results found/')).toBeVisible()
})

test('handle API error gracefully', async ({ page, login }) => {
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
	await searchInput.click()
	await searchInput.fill('error test')
	await searchInput.press('Enter')

	// The search should handle the error gracefully (no results shown)
	// In a real app, you might show an error message
	await page.waitForTimeout(1000)

	// Check that no results are shown
	const results = page.getByTestId('search-result')
	await expect(results).toHaveCount(0)
})

test('intercept and modify response data', async ({ page, login }) => {
	await login()

	let requestCount = 0

	// Intercept and count requests, return different data each time
	await page.route('**/api/search**', (route) => {
		requestCount++
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				results:
					requestCount === 1
						? [
								{
									id: '1',
									title: `First Request Result`,
									type: 'note',
									description: 'First search',
								},
							]
						: [
								{
									id: '2',
									title: `Request #${requestCount} - Item 1`,
									type: 'note',
									description: 'Updated search',
								},
								{
									id: '3',
									title: `Request #${requestCount} - Item 2`,
									type: 'user',
									description: '@updateduser',
								},
							],
			}),
		})
	})

	await page.goto('/search')

	// First search
	const searchInput = page.getByTestId('search-input')
	await searchInput.click()
	await searchInput.fill('first search')
	await searchInput.press('Enter')

	await page.waitForSelector('[data-testid="search-results"]', {
		timeout: 10000,
	})
	await expect(page.getByTestId('search-result')).toHaveCount(1)
	await expect(page.getByTestId('search-result').first()).toContainText(
		'First Request Result',
	)

	// Second search - should return different mocked data
	await searchInput.clear()
	await searchInput.fill('second search')
	await searchInput.press('Enter')

	// Wait for new results
	await page.waitForFunction(
		() =>
			document.querySelectorAll('[data-testid="search-result"]').length === 2,
	)

	const results = page.getByTestId('search-result')
	await expect(results).toHaveCount(2)
	await expect(results.first()).toContainText('Request #2')

	// Verify request count
	expect(requestCount).toBe(2)
})
