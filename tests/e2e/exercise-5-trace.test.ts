import { test, expect } from '#tests/playwright-utils'

test('trace network activity', async ({ page, login }) => {
	await login()

	// Log all requests
	const requests: any[] = []
	page.on('request', (request) => {
		if (request.url().includes('search')) {
			console.log('Request:', request.method(), request.url())
			requests.push({
				method: request.method(),
				url: request.url(),
			})
		}
	})

	// Log all responses
	page.on('response', (response) => {
		if (response.url().includes('search')) {
			console.log('Response:', response.status(), response.url())
		}
	})

	// Don't intercept - let's see what the real request looks like
	await page.goto('/search')

	// Type and search
	const searchInput = page.getByTestId('search-input')
	await searchInput.fill('test')

	// Listen for responses too
	page.on('response', async (response) => {
		if (response.url().includes('api/search')) {
			console.log('API Response:', response.status(), response.url())
			const body = await response.text()
			console.log('Response body:', body.substring(0, 100))
		}
	})

	await searchInput.press('Enter')

	// Wait longer
	await page.waitForTimeout(5000)

	console.log('All search requests:', requests)

	// Check if fetcher made any requests
	const networkRequests = await page.evaluate(() => {
		// Check if there are any pending fetches in the browser
		return (window as any).performance
			.getEntriesByType('resource')
			.filter((entry: any) => entry.name.includes('search'))
			.map((entry: any) => entry.name)
	})

	console.log('Browser resource timing:', networkRequests)
})
