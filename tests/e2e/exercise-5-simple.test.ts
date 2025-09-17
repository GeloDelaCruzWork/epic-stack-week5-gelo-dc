import { test, expect } from '#tests/playwright-utils'

test('simple search test', async ({ page, login }) => {
	await login()

	// Track all network requests
	const requests: string[] = []
	page.on('request', (request) => {
		if (request.url().includes('api')) {
			requests.push(request.url())
			console.log('Request made to:', request.url())
		}
	})

	// Intercept any API search calls
	await page.route('**/api/search*', async (route) => {
		console.log('INTERCEPTED:', route.request().url())
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				results: [
					{ id: '1', title: 'Test', type: 'note', description: 'Test' },
				],
			}),
		})
	})

	await page.goto('/search')

	// Check page loaded
	await expect(page.getByTestId('search-input')).toBeVisible()

	// Try to trigger search directly with JavaScript
	await page.evaluate(() => {
		console.log('Evaluating in browser...')
		const input = document.querySelector(
			'[data-testid="search-input"]',
		) as HTMLInputElement
		const button = document.querySelector(
			'[data-testid="search-button"]',
		) as HTMLButtonElement

		if (input && button) {
			input.value = 'test'
			console.log('Set input value to:', input.value)

			// Try clicking the button
			button.click()
			console.log('Clicked button')

			// Also try submitting the form
			const form = button.closest('form')
			if (form) {
				console.log('Found form, dispatching submit event')
				form.dispatchEvent(new Event('submit', { bubbles: true }))
			}
		}
	})

	// Wait a bit
	await page.waitForTimeout(2000)

	console.log('All API requests made:', requests)

	// Check if search results appeared
	const hasResults = await page.getByTestId('search-results').isVisible()
	console.log('Has search results div:', hasResults)

	if (hasResults) {
		const text = await page.getByTestId('search-results').textContent()
		console.log('Results text:', text)
	}
})
