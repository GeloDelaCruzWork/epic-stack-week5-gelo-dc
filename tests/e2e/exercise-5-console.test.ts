import { test, expect } from '#tests/playwright-utils'

test('check console for errors', async ({ page, login }) => {
	await login()

	// Listen for console messages
	const consoleMessages: string[] = []
	page.on('console', (msg) => {
		const text = msg.text()
		consoleMessages.push(`${msg.type()}: ${text}`)
		if (msg.type() === 'error') {
			console.log('ERROR:', text)
		}
	})

	// Listen for page errors
	page.on('pageerror', (error) => {
		console.log('PAGE ERROR:', error.message)
	})

	await page.goto('/search')
	await page.waitForLoadState('networkidle')

	// Try to submit search
	const searchInput = page.getByTestId('search-input')
	await searchInput.fill('test')
	await searchInput.press('Enter')

	await page.waitForTimeout(2000)

	console.log('All console messages:', consoleMessages)

	// Try calling fetcher.load directly from console
	const result = await page.evaluate(() => {
		try {
			// Try to find React component and call fetcher
			const searchInput = document.querySelector('[data-testid="search-input"]')
			return 'Evaluated successfully'
		} catch (e: any) {
			return `Error: ${e.message}`
		}
	})

	console.log('Evaluation result:', result)
})
