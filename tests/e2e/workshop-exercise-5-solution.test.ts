import { test, expect } from '#tests/playwright-utils'

test.describe('Exercise 5: Network Interception - User Search', () => {
	test('complete solution - mock user search results', async ({ page }) => {
		// Step 1: Intercept the /users page with search parameter
		await page.route('**/users?search=**', async (route) => {
			// Get the original response and modify it
			const response = await route.fetch()
			let body = await response.text()

			// Replace user results section with our mocked users
			const mockedHTML = body.replace(
				/<main>[\s\S]*<\/main>/,
				`<main>
					<ul class="flex w-full flex-wrap items-center justify-center gap-4">
						<li>
							<a href="/mocked-user1" class="bg-muted flex h-36 w-44 flex-col items-center justify-center rounded-lg px-5 py-3">
								<span class="text-body-md">Mocked User 1</span>
								<span class="text-body-sm text-muted-foreground">@mockeduser1</span>
							</a>
						</li>
						<li>
							<a href="/mocked-user2" class="bg-muted flex h-36 w-44 flex-col items-center justify-center rounded-lg px-5 py-3">
								<span class="text-body-md">Mocked User 2</span>
								<span class="text-body-sm text-muted-foreground">@mockeduser2</span>
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

		// Step 2: Navigate to /users page
		await page.goto('/users')

		// Step 3: Perform search using the search bar
		const searchInput = page.locator('input[type="search"]')
		await expect(searchInput).toBeVisible()
		await searchInput.fill('test')
		await searchInput.press('Enter')

		// Wait for the URL to update with search parameter
		await page.waitForURL('**/users?search=test')

		// Step 4: Verify mocked users appear
		const userLinks = page.locator('main ul li a')
		await expect(userLinks).toHaveCount(2)

		// Verify first mocked user
		const firstUser = userLinks.first()
		await expect(firstUser).toContainText('Mocked User 1')
		await expect(firstUser).toContainText('@mockeduser1')
		await expect(firstUser).toHaveAttribute('href', '/mocked-user1')

		// Verify second mocked user
		const secondUser = userLinks.nth(1)
		await expect(secondUser).toContainText('Mocked User 2')
		await expect(secondUser).toContainText('@mockeduser2')
		await expect(secondUser).toHaveAttribute('href', '/mocked-user2')
	})

	test('simplified version - basic mocking', async ({ page }) => {
		// Simple intercept that always returns 2 fake users
		await page.route('**/users?search=**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: `
					<!DOCTYPE html>
					<html>
						<head><title>Users</title></head>
						<body>
							<main>
								<ul>
									<li><a href="/fake1">Fake User 1</a></li>
									<li><a href="/fake2">Fake User 2</a></li>
								</ul>
							</main>
						</body>
					</html>
				`,
			})
		})

		await page.goto('/users')

		// Search for anything
		const searchInput = page.locator('input[type="search"]')
		await searchInput.fill('anything')
		await searchInput.press('Enter')

		// Verify fake users appear
		await expect(page.locator('main li')).toHaveCount(2)
		await expect(page.locator('main')).toContainText('Fake User 1')
		await expect(page.locator('main')).toContainText('Fake User 2')
	})

	test('advanced - dynamic response based on search term', async ({ page }) => {
		await page.route('**/users?search=**', async (route, request) => {
			// Extract the search term from URL
			const url = new URL(request.url())
			const searchTerm = url.searchParams.get('search') || ''

			// Generate different responses based on search term
			const users =
				searchTerm.toLowerCase() === 'admin'
					? ['Admin User', 'Super Admin']
					: searchTerm.toLowerCase() === 'test'
						? ['Test User 1', 'Test User 2', 'Test User 3']
						: ['Default User']

			const userHTML = users
				.map(
					(user, index) => `
				<li>
					<a href="/user${index}" class="bg-muted flex h-36 w-44 flex-col items-center justify-center rounded-lg px-5 py-3">
						<span class="text-body-md">${user}</span>
						<span class="text-body-sm">@${user.toLowerCase().replace(/\s+/g, '')}</span>
					</a>
				</li>
			`,
				)
				.join('')

			const response = await route.fetch()
			let body = await response.text()

			const modifiedHTML = body.replace(
				/<main>[\s\S]*<\/main>/,
				`<main>
					<h2>Results for: ${searchTerm}</h2>
					<ul class="flex w-full flex-wrap items-center justify-center gap-4">
						${userHTML}
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

		// Test 1: Search for "admin"
		const searchInput = page.locator('input[type="search"]')
		await searchInput.fill('admin')
		await searchInput.press('Enter')
		await page.waitForURL('**/users?search=admin')

		let results = page.locator('main ul li')
		await expect(results).toHaveCount(2)
		await expect(page.locator('main')).toContainText('Admin User')
		await expect(page.locator('main')).toContainText('Super Admin')

		// Test 2: Search for "test"
		await searchInput.clear()
		await searchInput.fill('test')
		await searchInput.press('Enter')
		await page.waitForURL('**/users?search=test')

		results = page.locator('main ul li')
		await expect(results).toHaveCount(3)
		await expect(page.locator('main')).toContainText('Test User 1')
		await expect(page.locator('main')).toContainText('Test User 2')
		await expect(page.locator('main')).toContainText('Test User 3')

		// Test 3: Search for anything else
		await searchInput.clear()
		await searchInput.fill('random')
		await searchInput.press('Enter')
		await page.waitForURL('**/users?search=random')

		results = page.locator('main ul li')
		await expect(results).toHaveCount(1)
		await expect(page.locator('main')).toContainText('Default User')
	})
})
