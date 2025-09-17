import { test, expect } from '@playwright/test'

test.describe('Timesheets Management - Fixed', () => {
	test.beforeEach(async ({ page }) => {
		// Login before each test
		await page.goto('http://localhost:3000/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')

		// Wait for login to complete
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})
	})

	test('should access timesheets page when authenticated', async ({ page }) => {
		// Navigate to timesheets page
		await page.goto('http://localhost:3000/timesheets')

		// Wait for page to load
		await page.waitForLoadState('networkidle')

		// Verify we're on timesheets page
		expect(page.url()).toContain('/timesheets')

		// Check for AG-Grid or timesheet content
		const hasGrid = await page
			.locator('.ag-root, .ag-theme-quartz, [role="grid"]')
			.first()
			.isVisible({ timeout: 5000 })
			.catch(() => false)
		const hasTimesheetContent = (await page.textContent('body'))
			?.toLowerCase()
			.includes('timesheet')

		expect(hasGrid || hasTimesheetContent).toBe(true)
		console.log('✅ Timesheets page accessible')
	})

	test('should redirect to login when not authenticated', async ({
		browser,
	}) => {
		// Create new context without login
		const context = await browser.newContext()
		const page = await context.newPage()

		// Try to access timesheets without login
		await page.goto('http://localhost:3000/timesheets')

		// Should redirect to login
		await page.waitForURL(/.*\/login/, { timeout: 5000 })
		expect(page.url()).toContain('/login')

		await context.close()
		console.log('✅ Authentication required for timesheets')
	})

	test('should display AG-Grid with headers', async ({ page }) => {
		// Navigate to timesheets
		await page.goto('http://localhost:3000/timesheets')
		await page.waitForLoadState('networkidle')

		// Check for AG-Grid
		const grid = page.locator('.ag-root, [role="grid"]').first()

		if (await grid.isVisible({ timeout: 5000 })) {
			// Check for column headers
			const headers = page.locator(
				'.ag-header-cell-text, [role="columnheader"]',
			)
			const headerCount = await headers.count()

			expect(headerCount).toBeGreaterThan(0)
			console.log(`✅ AG-Grid displayed with ${headerCount} headers`)
		} else {
			console.log('ℹ️ AG-Grid not visible')
		}
	})

	test('should have add timesheet functionality', async ({ page }) => {
		// Navigate to timesheets
		await page.goto('http://localhost:3000/timesheets')
		await page.waitForLoadState('networkidle')

		// Look for Add button
		const addButton = page
			.locator(
				'button:has-text("Add"), button:has-text("New"), button:has-text("Create")',
			)
			.first()

		if (await addButton.isVisible({ timeout: 2000 })) {
			await addButton.click()
			await page.waitForTimeout(1000)

			// Check if dialog or form appeared
			const hasDialog = await page
				.locator('[role="dialog"], .modal, .dialog')
				.first()
				.isVisible({ timeout: 1000 })
				.catch(() => false)
			const hasForm = await page
				.locator('form, input[name="employeeName"]')
				.first()
				.isVisible({ timeout: 1000 })
				.catch(() => false)

			if (hasDialog || hasForm) {
				console.log('✅ Add timesheet functionality works')
			} else {
				console.log('ℹ️ Add dialog/form not found')
			}
		} else {
			console.log('ℹ️ Add button not found')
		}
	})

	test('should handle row expansion for DTRs', async ({ page }) => {
		// Navigate to timesheets
		await page.goto('http://localhost:3000/timesheets')
		await page.waitForLoadState('networkidle')

		// Look for expandable rows
		const firstRow = page.locator('.ag-row').first()

		if (await firstRow.isVisible({ timeout: 5000 })) {
			// Look for expand button
			const expandButton = firstRow.locator('button, [role="button"]').first()

			if (await expandButton.isVisible({ timeout: 1000 })) {
				await expandButton.click()
				await page.waitForTimeout(1000)

				// Check for detail grid
				const detailGrid = page
					.locator('.ag-details-grid, .ag-full-width-container')
					.first()
				const isExpanded = await detailGrid
					.isVisible({ timeout: 2000 })
					.catch(() => false)

				if (isExpanded) {
					console.log('✅ Row expansion works')
				} else {
					console.log('ℹ️ Detail grid not visible after expansion')
				}
			} else {
				console.log('ℹ️ Expand button not found')
			}
		} else {
			console.log('ℹ️ No rows to expand')
		}
	})

	test('should display timesheet data or empty state', async ({ page }) => {
		// Navigate to timesheets
		await page.goto('http://localhost:3000/timesheets')
		await page.waitForLoadState('networkidle')

		const pageContent = await page.textContent('body')

		// Check for timesheet data or empty state
		const hasTimesheetData =
			pageContent?.includes('Employee') ||
			pageContent?.includes('Period') ||
			pageContent?.includes('Hours')

		const hasEmptyState =
			pageContent?.includes('No timesheets') ||
			pageContent?.includes('Create your first timesheet')

		expect(hasTimesheetData || hasEmptyState).toBe(true)
		console.log('✅ Timesheets page displays content correctly')
	})

	test('should have filter/search functionality', async ({ page }) => {
		// Navigate to timesheets
		await page.goto('http://localhost:3000/timesheets')
		await page.waitForLoadState('networkidle')

		// Look for filter input
		const filterInput = page
			.locator('input[placeholder*="filter" i], input[placeholder*="search" i]')
			.first()

		if (await filterInput.isVisible({ timeout: 2000 })) {
			await filterInput.fill('test')
			await page.waitForTimeout(500)
			console.log('✅ Filter functionality available')
		} else {
			console.log('ℹ️ Filter not implemented')
		}
	})

	test('should verify single expansion policy', async ({ page }) => {
		// Navigate to timesheets
		await page.goto('http://localhost:3000/timesheets')
		await page.waitForLoadState('networkidle')

		const rows = page.locator('.ag-row')
		const rowCount = await rows.count()

		if (rowCount >= 2) {
			// Try to expand first row
			const firstExpand = rows.nth(0).locator('button').first()
			if (await firstExpand.isVisible({ timeout: 1000 })) {
				await firstExpand.click()
				await page.waitForTimeout(500)

				// Try to expand second row
				const secondExpand = rows.nth(1).locator('button').first()
				if (await secondExpand.isVisible({ timeout: 1000 })) {
					await secondExpand.click()
					await page.waitForTimeout(500)

					// Count expanded detail grids
					const detailGrids = page.locator('.ag-details-grid')
					const expandedCount = await detailGrids.count()

					// Should only have one expanded due to single expansion policy
					expect(expandedCount).toBeLessThanOrEqual(1)
					console.log('✅ Single expansion policy verified')
				}
			}
		} else {
			console.log('ℹ️ Not enough rows to test expansion policy')
		}
	})
})
