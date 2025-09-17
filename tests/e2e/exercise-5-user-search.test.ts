import { test, expect } from '#tests/playwright-utils'

test.describe('Exercise 5: Mock User Search Results', () => {
	test('mock user search results', async ({ page }) => {
		// Intercept the /users API call with search parameter
		await page.route('**/users?search=**', async (route) => {
			// Mock the response in the same format as the actual loader
			await route.fulfill({
				status: 200,
				contentType: 'text/html', // Note: This is actually HTML page, not JSON API
				body: `
					<!DOCTYPE html>
					<html>
						<body>
							<div data-testid="search-results">
								<div class="user-result" data-testid="user-1">
									<span>Mocked User 1</span>
									<span>@mockeduser1</span>
								</div>
								<div class="user-result" data-testid="user-2">
									<span>Mocked User 2</span>
									<span>@mockeduser2</span>
								</div>
							</div>
						</body>
					</html>
				`,
			})
		})

		// Navigate to users search page
		await page.goto('/users')

		// Wait for the search bar to be visible
		const searchInput = page.locator('input[type="search"]')
		await expect(searchInput).toBeVisible()

		// Perform search
		await searchInput.fill('test')
		await searchInput.press('Enter')

		// Wait for URL to update with search parameter
		await page.waitForURL('**/users?search=test')

		// Verify mocked results appear
		await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
		await expect(page.locator('[data-testid="user-1"]')).toContainText(
			'Mocked User 1',
		)
		await expect(page.locator('[data-testid="user-2"]')).toContainText(
			'Mocked User 2',
		)
	})

	test('intercept and return JSON-like data for user search', async ({
		page,
	}) => {
		// Since the actual route returns HTML, let's intercept at the data level
		// We'll mock the entire page response to simulate the server-side rendering
		await page.route('**/users?search=john', async (route, request) => {
			console.log('Intercepting request:', request.url())

			// Get the original response and modify it
			const response = await route.fetch()
			let body = await response.text()

			// Replace the actual user results with mocked ones
			// This simulates what the server would render
			const mockedHTML = body.replace(
				/<main>[\s\S]*<\/main>/,
				`<main>
					<ul class="flex w-full flex-wrap items-center justify-center gap-4 delay-200">
						<li>
							<a href="/john-doe" class="bg-muted flex h-36 w-44 flex-col items-center justify-center rounded-lg px-5 py-3">
								<img alt="John Doe" src="/img/user/default" class="size-16 rounded-full" />
								<span class="text-body-md w-full overflow-hidden text-center text-ellipsis whitespace-nowrap">John Doe (Mocked)</span>
								<span class="text-body-sm text-muted-foreground w-full overflow-hidden text-center text-ellipsis">john-doe</span>
							</a>
						</li>
						<li>
							<a href="/john-smith" class="bg-muted flex h-36 w-44 flex-col items-center justify-center rounded-lg px-5 py-3">
								<img alt="John Smith" src="/img/user/default" class="size-16 rounded-full" />
								<span class="text-body-md w-full overflow-hidden text-center text-ellipsis whitespace-nowrap">John Smith (Mocked)</span>
								<span class="text-body-sm text-muted-foreground w-full overflow-hidden text-center text-ellipsis">john-smith</span>
							</a>
						</li>
					</ul>
				</main>`,
			)

			await route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: mockedHTML,
			})
		})

		// Navigate to users page
		await page.goto('/users')

		// Search for "john"
		const searchInput = page.locator('input[type="search"]')
		await searchInput.fill('john')
		await searchInput.press('Enter')

		// Wait for navigation
		await page.waitForURL('**/users?search=john')

		// Verify mocked results
		const results = page.locator('main ul li')
		await expect(results).toHaveCount(2)
		await expect(results.first()).toContainText('John Doe (Mocked)')
		await expect(results.nth(1)).toContainText('John Smith (Mocked)')
	})

	test('handle empty search results', async ({ page }) => {
		// Mock empty results
		await page.route('**/users?search=nonexistent', async (route) => {
			const response = await route.fetch()
			let body = await response.text()

			// Replace with empty results
			const emptyResultsHTML = body.replace(
				/<main>[\s\S]*<\/main>/,
				`<main>
					<p class="text-body-lg">No users found</p>
				</main>`,
			)

			await route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: emptyResultsHTML,
			})
		})

		await page.goto('/users')

		const searchInput = page.locator('input[type="search"]')
		await searchInput.fill('nonexistent')
		await searchInput.press('Enter')

		await page.waitForURL('**/users?search=nonexistent')
		await expect(page.locator('main')).toContainText('No users found')
	})

	test('count and modify responses dynamically', async ({ page }) => {
		let requestCount = 0

		// Different responses based on request count
		await page.route('**/users?search=**', async (route) => {
			requestCount++
			const response = await route.fetch()
			let body = await response.text()

			// Modify response based on request count
			const modifiedHTML = body.replace(
				/<main>[\s\S]*<\/main>/,
				`<main>
					<p>Request #${requestCount}</p>
					<ul class="flex w-full flex-wrap items-center justify-center gap-4 delay-200">
						${Array.from(
							{ length: requestCount },
							(_, i) => `
							<li>
								<a href="/user${i + 1}" class="bg-muted flex h-36 w-44 flex-col items-center justify-center rounded-lg px-5 py-3">
									<span class="text-body-md">User ${i + 1} (Request ${requestCount})</span>
									<span class="text-body-sm text-muted-foreground">user${i + 1}</span>
								</a>
							</li>
						`,
						).join('')}
					</ul>
				</main>`,
			)

			await route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: modifiedHTML,
			})
		})

		await page.goto('/users')

		// First search - should show 1 result
		const searchInput = page.locator('input[type="search"]')
		await searchInput.fill('first')
		await searchInput.press('Enter')
		await page.waitForURL('**/users?search=first')

		let results = page.locator('main ul li')
		await expect(results).toHaveCount(1)
		await expect(page.locator('main')).toContainText('Request #1')

		// Second search - should show 2 results
		await searchInput.clear()
		await searchInput.fill('second')
		await searchInput.press('Enter')
		await page.waitForURL('**/users?search=second')

		results = page.locator('main ul li')
		await expect(results).toHaveCount(2)
		await expect(page.locator('main')).toContainText('Request #2')

		// Verify request count
		expect(requestCount).toBe(2)
	})
})

// Alternative approach: Intercepting at the data/API level
test.describe('Alternative: Mock at API Level', () => {
	test('mock user search with API-style interception', async ({ page }) => {
		// If we had a separate API endpoint, we could intercept like this:
		await page.route('**/api/users/search?q=**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					users: [
						{ id: '1', username: 'testuser1', name: 'Test User 1' },
						{ id: '2', username: 'testuser2', name: 'Test User 2' },
					],
				}),
			})
		})

		// Then the front-end would consume this API
		// This is just an example of how it would work with a separate API
	})
})
