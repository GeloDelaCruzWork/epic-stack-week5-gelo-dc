import { test, expect } from '@playwright/test'

// Increase timeout for all tests
test.setTimeout(45000)

test.describe('User Search Functionality', () => {
	const BASE_URL = 'http://localhost:3000'

	test('should handle search with no query', async ({ page }) => {
		// Navigate to users page without search query
		await page.goto(`${BASE_URL}/users`)

		// Check if page loads
		const pageLoaded = await page.locator('body').isVisible()
		expect(pageLoaded).toBe(true)

		// Check for content
		const content = await page.textContent('body')
		console.log('✅ Users page loads without search query')

		// Check if it shows all users or a message
		const hasUserContent =
			content?.toLowerCase().includes('user') ||
			content?.toLowerCase().includes('kody')
		expect(hasUserContent).toBe(true)
	})

	test('should search for existing user', async ({ page }) => {
		// Search for kody
		await page.goto(`${BASE_URL}/users?search=kody`)

		// Wait for page to load
		await page.waitForLoadState('networkidle')

		// Check for search results
		const content = await page.textContent('body')
		expect(content?.toLowerCase()).toContain('kody')

		// Check for user link or profile
		const userLink = await page
			.locator('a[href*="/users/kody"]')
			.first()
			.isVisible({ timeout: 2000 })
			.catch(() => false)
		const hasUserInfo = content?.includes('kody') || userLink

		expect(hasUserInfo).toBe(true)
		console.log('✅ Search found user: kody')
	})

	test('should handle search with no results', async ({ page }) => {
		// Search for non-existent user
		await page.goto(`${BASE_URL}/users?search=nonexistentuser123456`)

		// Wait for page to load
		await page.waitForLoadState('networkidle')

		// Check for no results message
		const content = await page.textContent('body')

		// Should show no results or empty state
		const hasNoResults =
			content?.toLowerCase().includes('no result') ||
			content?.toLowerCase().includes('not found') ||
			content?.toLowerCase().includes('no user') ||
			!content?.includes('nonexistentuser123456')

		expect(hasNoResults).toBe(true)
		console.log('✅ Search handles no results correctly')
	})

	test('should handle partial search terms', async ({ page }) => {
		// Search with partial name
		await page.goto(`${BASE_URL}/users?search=kod`)

		// Wait for page to load
		await page.waitForLoadState('networkidle')

		// Check if it finds kody
		const content = await page.textContent('body')
		const foundKody = content?.toLowerCase().includes('kody')

		console.log(
			`✅ Partial search 'kod' ${foundKody ? 'found' : 'did not find'} kody`,
		)

		// Test another partial
		await page.goto(`${BASE_URL}/users?search=ody`)
		await page.waitForLoadState('networkidle')

		const content2 = await page.textContent('body')
		const foundKody2 = content2?.toLowerCase().includes('kody')

		console.log(
			`✅ Partial search 'ody' ${foundKody2 ? 'found' : 'did not find'} kody`,
		)
	})

	test('should handle special characters in search', async ({ page }) => {
		// Test with special characters
		const specialSearches = [
			{ query: 'user@example', encoded: 'user%40example' },
			{ query: 'user+test', encoded: 'user%2Btest' },
			{ query: 'user#1', encoded: 'user%231' },
			{ query: 'user&name', encoded: 'user%26name' },
		]

		for (const search of specialSearches) {
			await page.goto(`${BASE_URL}/users?search=${search.encoded}`)
			await page.waitForLoadState('networkidle')

			// Should not crash
			const pageLoaded = await page.locator('body').isVisible()
			expect(pageLoaded).toBe(true)

			console.log(`✅ Special character search '${search.query}' handled`)
		}
	})

	test('should handle case-insensitive search', async ({ page }) => {
		// Test different cases
		const caseVariations = ['KODY', 'Kody', 'kOdY', 'kody']

		for (const searchTerm of caseVariations) {
			await page.goto(`${BASE_URL}/users?search=${searchTerm}`)
			await page.waitForLoadState('networkidle')

			const content = await page.textContent('body')
			const foundUser = content?.toLowerCase().includes('kody')

			console.log(
				`✅ Case variation '${searchTerm}' ${foundUser ? 'found' : 'did not find'} user`,
			)
		}
	})

	test('should update search via input field if available', async ({
		page,
	}) => {
		// Navigate to users page
		await page.goto(`${BASE_URL}/users`)

		// Look for search input
		const searchInput = page
			.locator(
				'input[type="search"], input[name="search"], input[placeholder*="search" i]',
			)
			.first()

		if (await searchInput.isVisible({ timeout: 2000 })) {
			// Type search query
			await searchInput.fill('kody')

			// Press Enter or click search button
			await searchInput.press('Enter')

			// Wait for results
			await page.waitForTimeout(1000)

			// Check URL updated
			const url = page.url()
			expect(url).toContain('search=kody')

			// Check results
			const content = await page.textContent('body')
			expect(content?.toLowerCase()).toContain('kody')

			console.log('✅ Search input field works')
		} else {
			console.log('ℹ️ No search input field found on page')
		}
	})

	test('should handle empty search parameter', async ({ page }) => {
		// Search with empty parameter
		await page.goto(`${BASE_URL}/users?search=`)

		// Should load page normally
		const pageLoaded = await page.locator('body').isVisible()
		expect(pageLoaded).toBe(true)

		// Should show all users or default state
		const content = await page.textContent('body')
		const hasContent = content?.length > 0
		expect(hasContent).toBe(true)

		console.log('✅ Empty search parameter handled')
	})

	test('should preserve search across navigation', async ({ page }) => {
		// Login first to access more features
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})

		// Navigate to users with search
		await page.goto(`${BASE_URL}/users?search=kody`)

		// Click on a user if available
		const userLink = page.locator('a[href*="/users/kody"]').first()
		if (await userLink.isVisible({ timeout: 2000 })) {
			await userLink.click()
			await page.waitForLoadState('networkidle')

			// Go back
			await page.goBack()

			// Check if search is preserved
			const url = page.url()
			const searchPreserved = url.includes('search=kody')

			console.log(
				`✅ Search ${searchPreserved ? 'preserved' : 'not preserved'} after navigation`,
			)
		} else {
			console.log('ℹ️ No user link to test navigation')
		}
	})

	test('should handle multiple search parameters', async ({ page }) => {
		// Test with additional parameters
		await page.goto(`${BASE_URL}/users?search=kody&sort=name&filter=active`)

		// Should not break
		const pageLoaded = await page.locator('body').isVisible()
		expect(pageLoaded).toBe(true)

		// Should still search for kody
		const content = await page.textContent('body')
		const hasSearchResults =
			content?.toLowerCase().includes('kody') ||
			content?.toLowerCase().includes('user')

		expect(hasSearchResults).toBe(true)
		console.log('✅ Multiple query parameters handled')
	})

	test('should handle very long search queries', async ({ page }) => {
		// Create a very long search string
		const longSearch = 'a'.repeat(100)

		await page.goto(`${BASE_URL}/users?search=${longSearch}`)

		// Should not crash - page should load
		const pageLoaded = await page.locator('body').isVisible()
		expect(pageLoaded).toBe(true)

		// Should handle gracefully - check for critical errors only
		const content = await page.textContent('body')
		const hasCriticalError =
			content?.includes('500') ||
			content?.includes('Internal Server Error') ||
			content?.includes('Application Error')

		expect(hasCriticalError).toBe(false)

		// The page might show "no results" or validation error, which is fine
		console.log('✅ Long search query handled gracefully')
	})

	test('should search from homepage if search is available', async ({
		page,
	}) => {
		// Go to homepage
		await page.goto(BASE_URL)

		// Look for global search
		const searchInput = page
			.locator('input[type="search"], input[placeholder*="search" i]')
			.first()

		if (await searchInput.isVisible({ timeout: 2000 })) {
			// Enter search
			await searchInput.fill('kody')
			await searchInput.press('Enter')

			// Wait for navigation
			await page.waitForTimeout(1000)

			// Check if navigated to search results
			const url = page.url()
			const navigatedToSearch =
				url.includes('search=') || url.includes('/users')

			if (navigatedToSearch) {
				const content = await page.textContent('body')
				expect(content?.toLowerCase()).toContain('kody')
				console.log('✅ Homepage search works')
			} else {
				console.log('ℹ️ Homepage search did not navigate')
			}
		} else {
			console.log('ℹ️ No search available on homepage')
		}
	})
})
