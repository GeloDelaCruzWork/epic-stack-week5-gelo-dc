import { test, expect } from '@playwright/test'

test.describe('Timesheet Date Editing', () => {
	test.beforeEach(async ({ page }) => {
		// Login first
		await page.goto('http://localhost:3004/login')
		await page.fill('[name="username"]', 'kody')
		await page.fill('[name="password"]', 'kodylovesyou')
		await page.click('button[type="submit"]')

		// Wait for redirect (could be /users or /)
		await page.waitForURL(/http:\/\/localhost:3004\/(users)?/)

		// Navigate to timesheets
		await page.goto('http://localhost:3004/timesheets')
		await page.waitForSelector('.ag-root')
	})

	test('should allow editing DTR date in dialog', async ({ page }) => {
		// Expand the first timesheet
		await page.click('.ag-group-contracted:first-of-type')
		await page.waitForTimeout(500)

		// Double-click on the first DTR row to open edit dialog
		const dtrRow = page
			.locator('.ag-row')
			.filter({ hasText: /Regular Hours/ })
			.first()
		await dtrRow.dblclick()

		// Wait for dialog to open
		await page.waitForSelector('[role="dialog"]')

		// Check that date input exists and is editable
		const dateInput = page.locator('input[type="date"]')
		await expect(dateInput).toBeVisible()
		await expect(dateInput).toBeEditable()

		// Change the date
		await dateInput.fill('2024-03-15')

		// Save changes
		await page.click('button:has-text("Save Changes")')

		// Wait for dialog to close
		await page.waitForSelector('[role="dialog"]', { state: 'hidden' })

		// Verify the date was updated in the grid
		await expect(
			page.locator('.ag-cell').filter({ hasText: 'Mar 15, 2024' }),
		).toBeVisible()
	})

	test('should not allow inline editing of DTR date', async ({ page }) => {
		// Expand the first timesheet
		await page.click('.ag-group-contracted:first-of-type')
		await page.waitForTimeout(500)

		// Click on the date cell
		const dateCell = page
			.locator('.ag-cell')
			.filter({ hasText: /\w{3} \d{1,2}, \d{4}/ })
			.first()
		await dateCell.click()

		// Double-click should not enter edit mode for inline editing
		await dateCell.dblclick()

		// Check that no date editor appears inline
		const dateEditor = page.locator('input[type="date"]')

		// Either no editor appears or dialog opens (double-click opens dialog)
		const hasDialog = await page.locator('[role="dialog"]').isVisible()
		if (!hasDialog) {
			// No inline editor should appear
			await expect(dateEditor).not.toBeVisible()
		} else {
			// Dialog opened as expected for editing
			await expect(page.locator('[role="dialog"]')).toBeVisible()
		}
	})
})
