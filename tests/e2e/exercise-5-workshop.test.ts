import { test, expect } from '#tests/playwright-utils'

// This is the exact solution for the workshop Exercise 5
test('mock user search results', async ({ page }) => {
	// Intercept /users page with search parameter
	await page.route('**/users?search=**', async (route) => {
		// Get the original response and modify it
		const response = await route.fetch()
		let body = await response.text()

		// Replace user results with mocked ones
		const mockedHTML = body.replace(
			/<main>[\s\S]*<\/main>/,
			`<main>
				<ul class="flex w-full flex-wrap items-center justify-center gap-4">
					<li>
						<a href="/mocked-user1" class="bg-muted flex h-36 w-44 flex-col items-center justify-center rounded-lg px-5 py-3">
							<span class="text-body-md">Mocked User 1</span>
							<span class="text-body-sm">@mockeduser1</span>
						</a>
					</li>
					<li>
						<a href="/mocked-user2" class="bg-muted flex h-36 w-44 flex-col items-center justify-center rounded-lg px-5 py-3">
							<span class="text-body-md">Mocked User 2</span>
							<span class="text-body-sm">@mockeduser2</span>
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

	// Navigate to /users page
	await page.goto('/users')

	// Perform search using the search bar
	const searchInput = page.locator('input[type="search"]')
	await searchInput.fill('test')
	await searchInput.press('Enter')

	// Wait for navigation with search parameter
	await page.waitForURL('**/users?search=test')

	// Verify mocked users appear
	const userCards = page.locator('main ul li a')
	await expect(userCards).toHaveCount(2)
	await expect(userCards.first()).toContainText('Mocked User 1')
	await expect(userCards.nth(1)).toContainText('Mocked User 2')
})
