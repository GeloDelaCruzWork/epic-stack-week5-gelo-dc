import { test, expect } from '../fixtures/auth.fixture'

test.describe('Notes Debug', () => {
	test('debug note creation', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to notes page
		await page.goto('/users/kody/notes')
		console.log('On notes page:', page.url())

		// Navigate to new note page
		await page.goto('/users/kody/notes/new')
		await page.waitForLoadState('networkidle')
		console.log('On new note page:', page.url())

		// Take screenshot
		await page.screenshot({ path: 'note-form.png' })

		// Find all inputs and textareas
		const inputs = await page
			.locator('input[type="text"], input:not([type])')
			.all()
		console.log('Found inputs:', inputs.length)

		const textareas = await page.locator('textarea').all()
		console.log('Found textareas:', textareas.length)

		// Try to find form fields by different selectors
		const titleSelectors = [
			'input[name="title"]',
			'input[id*="title"]',
			'input[placeholder*="title" i]',
			'input[type="text"]',
		]

		for (const selector of titleSelectors) {
			const element = page.locator(selector).first()
			if (await element.isVisible()) {
				console.log(`Found title input with selector: ${selector}`)
				await element.fill('Test Note Title')
				break
			}
		}

		const contentSelectors = [
			'textarea[name="content"]',
			'textarea[id*="content"]',
			'textarea[placeholder*="content" i]',
			'textarea',
		]

		for (const selector of contentSelectors) {
			const element = page.locator(selector).first()
			if (await element.isVisible()) {
				console.log(`Found content textarea with selector: ${selector}`)
				await element.fill('Test Note Content')
				break
			}
		}

		// Find submit button
		const submitButton = page.locator('button[type="submit"]').first()
		if (await submitButton.isVisible()) {
			console.log('Found submit button')
			await submitButton.click()
		}

		// Wait for navigation
		await page.waitForTimeout(2000)
		console.log('After submit URL:', page.url())

		// Check if we're still on the form or navigated away
		const pageContent = await page.textContent('body')
		console.log(
			'Page contains "Test Note Title":',
			pageContent?.includes('Test Note Title'),
		)
	})
})
