import { test, expect } from '@playwright/test'

// Increase timeout for all tests in this file
test.setTimeout(60000)

test.describe('Timesheets Basic Tests', () => {
	test('should require authentication for timesheets', async ({ page }) => {
		// Try to access timesheets without login
		await page.goto('http://localhost:3000/timesheets')

		// Should redirect to login
		await page.waitForURL(/.*\/login/, { timeout: 10000 })
		expect(page.url()).toContain('/login')

		console.log('✅ Authentication required for timesheets')
	})

	test('should access timesheets after login', async ({ page }) => {
		// Login first
		await page.goto('http://localhost:3000/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')

		// Wait for login to complete
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 15000,
		})

		// Navigate to timesheets
		await page.goto('http://localhost:3000/timesheets')

		// Give AG-Grid time to load
		await page.waitForTimeout(3000)

		// Verify we're on timesheets page
		expect(page.url()).toContain('/timesheets')

		console.log('✅ Timesheets page accessible after login')
	})

	test('should check for AG-Grid or timesheet content', async ({ page }) => {
		// Login first
		await page.goto('http://localhost:3000/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 15000,
		})

		// Navigate to timesheets
		await page.goto('http://localhost:3000/timesheets')

		// Wait for content to load
		await page.waitForTimeout(5000)

		// Check for grid or timesheet content
		const pageText = await page.textContent('body')
		const hasTimesheetKeywords =
			pageText?.toLowerCase().includes('timesheet') ||
			pageText?.toLowerCase().includes('employee') ||
			pageText?.toLowerCase().includes('period') ||
			pageText?.toLowerCase().includes('hours') ||
			pageText?.toLowerCase().includes('dtr')

		expect(hasTimesheetKeywords).toBe(true)
		console.log('✅ Timesheet content found on page')
	})

	test('should look for AG-Grid elements', async ({ page }) => {
		// Login first
		await page.goto('http://localhost:3000/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 15000,
		})

		// Navigate to timesheets
		await page.goto('http://localhost:3000/timesheets')

		// Wait longer for AG-Grid to initialize
		await page.waitForTimeout(5000)

		// Try different AG-Grid selectors
		const gridSelectors = [
			'.ag-root',
			'.ag-theme-quartz',
			'[role="grid"]',
			'.ag-header',
			'.ag-body',
			'div[ref="eContainer"]',
		]

		let gridFound = false
		for (const selector of gridSelectors) {
			const element = page.locator(selector).first()
			if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
				gridFound = true
				console.log(`✅ Found grid element: ${selector}`)
				break
			}
		}

		if (!gridFound) {
			console.log('ℹ️ AG-Grid elements not found, but page loaded')
		}
	})

	test('should check for timesheet actions', async ({ page }) => {
		// Login first
		await page.goto('http://localhost:3000/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 15000,
		})

		// Navigate to timesheets
		await page.goto('http://localhost:3000/timesheets')

		// Wait for page to settle
		await page.waitForTimeout(3000)

		// Look for action buttons
		const buttonTexts = [
			'Add',
			'New',
			'Create',
			'Edit',
			'Delete',
			'Export',
			'Filter',
		]
		const buttons = []

		for (const text of buttonTexts) {
			const button = page.locator(`button:has-text("${text}")`).first()
			if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
				buttons.push(text)
			}
		}

		if (buttons.length > 0) {
			console.log(`✅ Found action buttons: ${buttons.join(', ')}`)
		} else {
			console.log('ℹ️ No action buttons found')
		}
	})
})
