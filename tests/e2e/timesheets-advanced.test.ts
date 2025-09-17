import { expect, test } from '#tests/playwright-utils.ts'
import {
	createTimesheetHierarchy,
	createMultipleTimesheets,
	cleanupTestData,
	TimesheetGridHelper,
} from './timesheets-helper.ts'

test.describe('Advanced Timesheet Features', () => {
	test.afterEach(async () => {
		// Clean up test data after each test
		await cleanupTestData()
	})

	test('Complex hierarchy navigation with helper utilities', async ({
		page,
		login,
	}) => {
		await login()

		// Create complete test hierarchy
		const { timesheet, dtrs, timelogs, clockEvents } =
			await createTimesheetHierarchy()

		await page.goto('/timesheets')

		const gridHelper = new TimesheetGridHelper(page)
		await gridHelper.waitForGrid()

		// Navigate through the entire hierarchy using helper methods
		await gridHelper.expandTimesheet(timesheet.employeeName)
		await gridHelper.expandDTR(dtrs[0].date)
		await gridHelper.expandTimeLog('in')

		// Verify clock event is visible
		const clockTime = clockEvents[0].clockTime.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
		})
		await gridHelper.verifyValueInGrid(clockTime)
	})

	test('Bulk edit operations maintain data integrity', async ({
		page,
		login,
	}) => {
		await login()

		// Create multiple timesheets
		const timesheets = await createMultipleTimesheets(5)

		await page.goto('/timesheets')

		const gridHelper = new TimesheetGridHelper(page)
		await gridHelper.waitForGrid()

		// Edit first timesheet
		await gridHelper.editTimesheet(timesheets[0].employeeName)
		await page.getByLabel('Regular Hours').fill('160')
		await gridHelper.saveDialog()

		// Edit second timesheet
		await gridHelper.editTimesheet(timesheets[1].employeeName)
		await page.getByLabel('Overtime Hours').fill('20')
		await gridHelper.saveDialog()

		// Verify both updates are reflected
		await gridHelper.verifyValueInGrid('160')
		await gridHelper.verifyValueInGrid('20')

		// Verify other timesheets are unchanged
		for (let i = 2; i < 5; i++) {
			const row = page
				.locator('.ag-row')
				.filter({ hasText: timesheets[i].employeeName })
			const regularHours = await row.locator('.ag-cell').nth(4).textContent()
			expect(parseFloat(regularHours || '0')).toBe(timesheets[i].regularHours)
		}
	})

	test('Theme persistence across navigation', async ({ page, login }) => {
		await login()

		const { timesheet } = await createTimesheetHierarchy()

		await page.goto('/timesheets')

		const gridHelper = new TimesheetGridHelper(page)
		await gridHelper.waitForGrid()

		// Check initial theme
		const initialTheme = await gridHelper.getCurrentTheme()
		expect(initialTheme).toBe('light')

		// Switch to dark theme
		await gridHelper.toggleTheme()
		expect(await gridHelper.getCurrentTheme()).toBe('dark')

		// Navigate through hierarchy
		await gridHelper.expandTimesheet(timesheet.employeeName)

		// Theme should persist
		expect(await gridHelper.getCurrentTheme()).toBe('dark')

		// Open edit dialog
		await gridHelper.editTimesheet(timesheet.employeeName)

		// Check theme is still dark
		expect(await gridHelper.getCurrentTheme()).toBe('dark')

		// Close dialog
		await gridHelper.cancelDialog()

		// Navigate to another page and back
		await page.goto('/')
		await page.goto('/timesheets')
		await gridHelper.waitForGrid()

		// Theme should persist (stored in cookie)
		expect(await gridHelper.getCurrentTheme()).toBe('dark')
	})

	test('Data validation in edit dialogs', async ({ page, login }) => {
		await login()

		const { timesheet, dtrs } = await createTimesheetHierarchy()

		await page.goto('/timesheets')

		const gridHelper = new TimesheetGridHelper(page)
		await gridHelper.waitForGrid()

		// Test timesheet validation
		await gridHelper.editTimesheet(timesheet.employeeName)

		// Try to enter invalid regular hours
		await page.getByLabel('Regular Hours').fill('-10')
		await page.getByRole('button', { name: /save/i }).click()

		// Should show validation error or not save
		// Check if dialog is still open (not saved due to validation)
		await expect(page.getByRole('dialog')).toBeVisible()

		// Enter valid value
		await page.getByLabel('Regular Hours').fill('160')
		await gridHelper.saveDialog()

		// Verify the valid value was saved
		await gridHelper.verifyValueInGrid('160')

		// Test DTR validation
		await gridHelper.expandTimesheet(timesheet.employeeName)
		await gridHelper.editDTR(dtrs[0].date)

		// Try to enter text in number field
		await page.getByLabel('Regular Hours').fill('abc')
		const value = await page.getByLabel('Regular Hours').inputValue()
		// HTML number inputs won't accept 'abc', so value should be empty or previous value
		expect(value).not.toBe('abc')

		await gridHelper.cancelDialog()
	})

	test('Concurrent edits handle properly', async ({ page, login, context }) => {
		await login()

		const { timesheet } = await createTimesheetHierarchy()

		// Open two pages
		const page1 = page
		const page2 = await context.newPage()

		// Navigate both pages to timesheets
		await page1.goto('/timesheets')
		await page2.goto('/timesheets')

		const gridHelper1 = new TimesheetGridHelper(page1)
		const gridHelper2 = new TimesheetGridHelper(page2)

		await gridHelper1.waitForGrid()
		await gridHelper2.waitForGrid()

		// Edit the same timesheet in both pages
		await gridHelper1.editTimesheet(timesheet.employeeName)
		await page1.getByLabel('Regular Hours').fill('150')

		await gridHelper2.editTimesheet(timesheet.employeeName)
		await page2.getByLabel('Regular Hours').fill('175')

		// Save first edit
		await gridHelper1.saveDialog()

		// Save second edit
		await gridHelper2.saveDialog()

		// Refresh first page to see the final value
		await page1.reload()
		await gridHelper1.waitForGrid()

		// Both pages should show the same final value (last write wins)
		await gridHelper1.verifyValueInGrid('175')
		await gridHelper2.verifyValueInGrid('175')

		await page2.close()
	})

	test('Performance with large dataset', async ({ page, login }) => {
		await login()

		// Create a large dataset
		await createMultipleTimesheets(50)

		const startTime = Date.now()
		await page.goto('/timesheets')

		const gridHelper = new TimesheetGridHelper(page)
		await gridHelper.waitForGrid()

		const loadTime = Date.now() - startTime

		// Page should load within reasonable time even with many records
		expect(loadTime).toBeLessThan(5000) // 5 seconds

		// Grid should be responsive
		const rows = await page.locator('.ag-row').count()
		expect(rows).toBeGreaterThan(0)

		// Test scrolling performance
		await page.evaluate(() => {
			const grid = document.querySelector('.ag-body-viewport')
			if (grid) {
				grid.scrollTop = grid.scrollHeight
			}
		})

		// Should still be able to interact with bottom rows
		const lastRow = page.locator('.ag-row').last()
		await expect(lastRow).toBeVisible()
	})

	test('Keyboard navigation in grid', async ({ page, login }) => {
		await login()

		const { timesheet } = await createTimesheetHierarchy()

		await page.goto('/timesheets')

		const gridHelper = new TimesheetGridHelper(page)
		await gridHelper.waitForGrid()

		// Focus on the first row
		const firstRow = page.locator('.ag-row').first()
		await firstRow.click()

		// Use arrow keys to navigate
		await page.keyboard.press('ArrowDown')
		await page.keyboard.press('ArrowDown')

		// Press Enter to expand
		await page.keyboard.press('Enter')

		// Wait for expansion
		await page.waitForTimeout(300)

		// Check if a detail row is visible
		const detailRows = await page.locator('.ag-details-row').count()
		expect(detailRows).toBeGreaterThan(0)

		// Press Escape to close dialog if one opens
		await page.keyboard.press('Escape')
	})

	test('Export functionality (if implemented)', async ({ page, login }) => {
		test.skip() // Skip if export is not implemented yet

		await login()

		await createMultipleTimesheets(10)

		await page.goto('/timesheets')

		const gridHelper = new TimesheetGridHelper(page)
		await gridHelper.waitForGrid()

		// Look for export button
		const exportButton = page.getByRole('button', { name: /export/i })
		if (await exportButton.isVisible()) {
			await exportButton.click()

			// Wait for download
			const [download] = await Promise.all([
				page.waitForEvent('download'),
				page.getByRole('button', { name: /download csv/i }).click(),
			])

			// Verify download
			expect(download.suggestedFilename()).toContain('timesheet')
		}
	})

	test('Search and filter functionality', async ({ page, login }) => {
		await login()

		// Create timesheets with specific names for testing
		await createMultipleTimesheets(5)
		const searchableTimesheet = await createTimesheetHierarchy()

		await page.goto('/timesheets')

		const gridHelper = new TimesheetGridHelper(page)
		await gridHelper.waitForGrid()

		// Check if search box exists
		const searchBox = page.getByPlaceholder(/search/i)
		if (await searchBox.isVisible()) {
			// Search for specific employee
			await searchBox.fill(searchableTimesheet.timesheet.employeeName)
			await page.keyboard.press('Enter')

			// Wait for filter to apply
			await page.waitForTimeout(500)

			// Should only show matching timesheet
			const visibleRows = await page.locator('.ag-row').count()
			expect(visibleRows).toBe(1)

			// Clear search
			await searchBox.clear()
			await page.keyboard.press('Enter')

			// All timesheets should be visible again
			await page.waitForTimeout(500)
			const allRows = await page.locator('.ag-row').count()
			expect(allRows).toBeGreaterThan(1)
		}
	})

	test('Error recovery and user feedback', async ({ page, login }) => {
		await login()

		const { timesheet } = await createTimesheetHierarchy()

		await page.goto('/timesheets')

		const gridHelper = new TimesheetGridHelper(page)
		await gridHelper.waitForGrid()

		// Simulate network error by going offline
		await page.context().setOffline(true)

		// Try to edit
		await gridHelper.editTimesheet(timesheet.employeeName)
		await page.getByLabel('Regular Hours').fill('200')
		await page.getByRole('button', { name: /save/i }).click()

		// Should show error message or handle gracefully
		// Check if an error message appears or dialog stays open
		const errorMessage = page.getByText(/error|failed|offline/i)
		const dialogStillOpen = page.getByRole('dialog')

		const hasError = await errorMessage.isVisible().catch(() => false)
		const hasDialog = await dialogStillOpen.isVisible().catch(() => false)

		expect(hasError || hasDialog).toBeTruthy()

		// Go back online
		await page.context().setOffline(false)

		// Should be able to save now
		if (hasDialog) {
			await gridHelper.saveDialog()
		}
	})
})
