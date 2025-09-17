import { test, expect } from '#tests/playwright-utils'

/**
 * Exercise 5: Intercept Network Requests - WORKING SOLUTION
 *
 * This test successfully mocks API responses for the /api/search endpoint.
 * The key is understanding React Router v7's data response format.
 */

test.describe('Exercise 5: Network Interception - Final Working Version', () => {
	test('successfully mock /api/search endpoint', async ({ page, login }) => {
		await login()

		// Set up the API mock BEFORE navigating
		await page.route('**/api/search.data**', (route) => {
			console.log('✅ Intercepted:', route.request().url())

			// The response needs to be in the exact format React Router expects
			// This is a serialized format that React Router uses internally
			const mockData = {
				results: [
					{
						id: 'mock-1',
						title: 'Test Note Result',
						type: 'note',
						description: 'This is a mocked note from our test',
					},
					{
						id: 'mock-2',
						title: 'Test User',
						type: 'user',
						description: '@testuser - Mocked user account',
					},
					{
						id: 'mock-3',
						title: 'Another Note',
						type: 'note',
						description: 'More test data for verification',
					},
				],
			}

			// React Router v7 expects this specific turbo-stream format
			// D[route_id]:{json_data}\nS[status]:
			const turboStreamResponse = `D0:${JSON.stringify(mockData)}\n\n`

			route.fulfill({
				status: 200,
				headers: {
					'content-type': 'text/x-turbo',
					'x-remix-response': 'yes',
				},
				body: turboStreamResponse,
			})
		})

		// Navigate to search page
		await page.goto('/search')
		await page.waitForLoadState('networkidle')

		// Fill search input
		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('test')

		// Click search button
		await page.getByTestId('search-button').click()

		// Wait for results to appear
		await page.waitForSelector('[data-testid="search-results"]', {
			state: 'visible',
			timeout: 10000,
		})

		// Verify results
		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(3)

		// Verify first result
		await expect(results.nth(0)).toContainText('Test Note Result')
		await expect(results.nth(0)).toContainText('This is a mocked note')

		// Verify second result
		await expect(results.nth(1)).toContainText('Test User')
		await expect(results.nth(1)).toContainText('@testuser')

		// Verify third result
		await expect(results.nth(2)).toContainText('Another Note')
		await expect(results.nth(2)).toContainText('More test data')

		console.log('✅ Test passed! API mocking is working correctly.')
	})

	test('empty results', async ({ page, login }) => {
		await login()

		await page.route('**/api/search.data**', (route) => {
			const emptyData = { results: [] }
			const turboStreamResponse = `D0:${JSON.stringify(emptyData)}\n\n`

			route.fulfill({
				status: 200,
				headers: {
					'content-type': 'text/x-turbo',
					'x-remix-response': 'yes',
				},
				body: turboStreamResponse,
			})
		})

		await page.goto('/search')

		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('empty')
		await page.getByTestId('search-button').click()

		await page.waitForTimeout(1000)

		// Should show "No results found"
		await expect(page.locator('text=No results found')).toBeVisible()
	})

	test('search with Enter key', async ({ page, login }) => {
		await login()

		await page.route('**/api/search.data**', (route) => {
			const data = {
				results: [
					{
						id: 'enter-1',
						title: 'Enter Key Test',
						type: 'note',
						description: 'Submitted using Enter key',
					},
				],
			}
			const turboStreamResponse = `D0:${JSON.stringify(data)}\n\n`

			route.fulfill({
				status: 200,
				headers: {
					'content-type': 'text/x-turbo',
					'x-remix-response': 'yes',
				},
				body: turboStreamResponse,
			})
		})

		await page.goto('/search')

		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('enter test')
		await searchInput.press('Enter')

		await page.waitForSelector('[data-testid="search-results"]', {
			state: 'visible',
			timeout: 10000,
		})

		const results = page.getByTestId('search-result')
		await expect(results).toHaveCount(1)
		await expect(results.first()).toContainText('Enter Key Test')
	})

	test('multiple sequential searches', async ({ page, login }) => {
		await login()

		let searchCount = 0

		await page.route('**/api/search.data**', (route) => {
			searchCount++

			const data =
				searchCount === 1
					? {
							results: [
								{
									id: 'first',
									title: 'First Search',
									type: 'note',
									description: 'Initial search result',
								},
							],
						}
					: {
							results: [
								{
									id: 'second-1',
									title: 'Second Search A',
									type: 'note',
									description: 'Updated result 1',
								},
								{
									id: 'second-2',
									title: 'Second Search B',
									type: 'user',
									description: '@user2',
								},
							],
						}

			const turboStreamResponse = `D0:${JSON.stringify(data)}\n\n`

			route.fulfill({
				status: 200,
				headers: {
					'content-type': 'text/x-turbo',
					'x-remix-response': 'yes',
				},
				body: turboStreamResponse,
			})
		})

		await page.goto('/search')

		// First search
		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('first')
		await page.getByTestId('search-button').click()

		await page.waitForSelector('[data-testid="search-results"]')
		await expect(page.getByTestId('search-result')).toHaveCount(1)

		// Second search
		await searchInput.clear()
		await searchInput.fill('second')
		await page.getByTestId('search-button').click()

		await page.waitForFunction(
			() =>
				document.querySelectorAll('[data-testid="search-result"]').length === 2,
		)

		await expect(page.getByTestId('search-result')).toHaveCount(2)
		expect(searchCount).toBe(2)
	})

	test('verify request parameters', async ({ page, login }) => {
		await login()

		let capturedQuery = ''

		await page.route('**/api/search.data**', (route) => {
			const url = new URL(route.request().url())
			capturedQuery = url.searchParams.get('q') || ''

			const data = { results: [] }
			const turboStreamResponse = `D0:${JSON.stringify(data)}\n\n`

			route.fulfill({
				status: 200,
				headers: {
					'content-type': 'text/x-turbo',
					'x-remix-response': 'yes',
				},
				body: turboStreamResponse,
			})
		})

		await page.goto('/search')

		// Search with special characters
		const searchInput = page.getByTestId('search-input')
		await searchInput.fill('test & "special" chars')
		await page.getByTestId('search-button').click()

		await page.waitForTimeout(500)

		// Verify the query was properly captured
		expect(capturedQuery).toBe('test & "special" chars')
		console.log('✅ Query properly decoded:', capturedQuery)
	})
})

// Summary test to demonstrate the complete solution
test('SOLUTION: Complete API mocking example', async ({ page, login }) => {
	console.log('🚀 Starting Exercise 5 solution test...')

	await login()

	// Set up comprehensive mock
	await page.route('**/api/search.data**', (route) => {
		const url = new URL(route.request().url())
		const query = url.searchParams.get('q') || ''

		console.log(`📡 Intercepted search for: "${query}"`)

		// Dynamic results based on query
		let results = []
		if (query.toLowerCase().includes('user')) {
			results = [
				{ id: 'u1', title: 'John Doe', type: 'user', description: '@johndoe' },
				{
					id: 'u2',
					title: 'Jane Smith',
					type: 'user',
					description: '@janesmith',
				},
			]
		} else if (query.toLowerCase().includes('note')) {
			results = [
				{
					id: 'n1',
					title: 'Meeting Notes',
					type: 'note',
					description: 'Team standup notes',
				},
				{
					id: 'n2',
					title: 'Project Ideas',
					type: 'note',
					description: 'Brainstorming session',
				},
			]
		} else {
			results = [
				{
					id: 'm1',
					title: 'Mixed Result 1',
					type: 'note',
					description: 'General note',
				},
				{
					id: 'm2',
					title: 'Mixed Result 2',
					type: 'user',
					description: '@mixeduser',
				},
			]
		}

		const data = { results }
		const turboStreamResponse = `D0:${JSON.stringify(data)}\n\n`

		route.fulfill({
			status: 200,
			headers: {
				'content-type': 'text/x-turbo',
				'x-remix-response': 'yes',
			},
			body: turboStreamResponse,
		})
	})

	await page.goto('/search')

	// Test 1: Search for users
	console.log('📝 Test 1: Searching for users...')
	const searchInput = page.getByTestId('search-input')
	await searchInput.fill('user')
	await page.getByTestId('search-button').click()
	await page.waitForTimeout(500)

	let results = page.getByTestId('search-result')
	await expect(results).toHaveCount(2)
	await expect(results.first()).toContainText('John Doe')
	console.log('✅ User search successful')

	// Test 2: Search for notes
	console.log('📝 Test 2: Searching for notes...')
	await searchInput.clear()
	await searchInput.fill('note')
	await page.getByTestId('search-button').click()
	await page.waitForTimeout(500)

	results = page.getByTestId('search-result')
	await expect(results).toHaveCount(2)
	await expect(results.first()).toContainText('Meeting Notes')
	console.log('✅ Note search successful')

	// Test 3: General search
	console.log('📝 Test 3: General search...')
	await searchInput.clear()
	await searchInput.fill('anything')
	await page.getByTestId('search-button').click()
	await page.waitForTimeout(500)

	results = page.getByTestId('search-result')
	await expect(results).toHaveCount(2)
	await expect(results.first()).toContainText('Mixed Result')
	console.log('✅ General search successful')

	console.log('🎉 Exercise 5 complete! All API mocking tests passed!')
})
