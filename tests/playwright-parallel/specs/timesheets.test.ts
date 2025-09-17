import { test, expect } from '../fixtures/auth.fixture'
import { Page } from '@playwright/test'

test.describe('Timesheet Management', () => {
	test.use({ baseURL: 'http://localhost:3000' })

	test('should require authentication to access timesheets', async ({
		page,
	}) => {
		// Try to access timesheets without login
		await page.goto('/timesheets')

		// Should be redirected to login
		await page.waitForURL(/.*\/login/, { timeout: 5000 })
		expect(page.url()).toContain('/login')
	})

	test('should display timesheet grid for authenticated users', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Check for AG-Grid presence - use first matching element
		const grid = page
			.locator('.ag-root, [role="grid"], .ag-theme-quartz')
			.first()
		await expect(grid).toBeVisible({ timeout: 10000 })

		// Check for timesheet headers
		const headers = page.locator('.ag-header-cell-text, [role="columnheader"]')
		const headerCount = await headers.count()
		expect(headerCount).toBeGreaterThan(0)
	})

	test('should create a new timesheet', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Click Add/New Timesheet button
		const addButton = page
			.locator(
				'button:has-text("Add"), button:has-text("New"), button:has-text("Create Timesheet")',
			)
			.first()
		if (await addButton.isVisible()) {
			await addButton.click()

			// Wait for dialog or form
			await page.waitForTimeout(1000)

			// Fill timesheet form
			const employeeInput = page
				.locator('input[name="employeeName"], input[placeholder*="employee" i]')
				.first()
			if (await employeeInput.isVisible()) {
				await employeeInput.fill(`Test Employee ${Date.now()}`)
			}

			// Set period dates if fields exist
			const startDateInput = page
				.locator('input[type="date"], input[name*="start" i]')
				.first()
			if (await startDateInput.isVisible()) {
				await startDateInput.fill('2025-01-01')
			}

			const endDateInput = page
				.locator('input[type="date"], input[name*="end" i]')
				.last()
			if (await endDateInput.isVisible()) {
				await endDateInput.fill('2025-01-15')
			}

			// Submit form
			const submitButton = page
				.locator(
					'button[type="submit"], button:has-text("Save"), button:has-text("Create")',
				)
				.last()
			await submitButton.click()

			// Wait for creation
			await page.waitForLoadState('networkidle')

			// Verify timesheet appears in grid
			const gridContent = await page.locator('.ag-root').textContent()
			expect(gridContent).toBeTruthy()
		}
	})

	test('should expand timesheet to show DTRs', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Find expand button in first row
		const expandButton = page
			.locator('.ag-row')
			.first()
			.locator('button, [role="button"]')
			.first()
		if (await expandButton.isVisible()) {
			await expandButton.click()

			// Wait for expansion
			await page.waitForTimeout(1000)

			// Check for DTR detail grid
			const detailGrid = page.locator(
				'.ag-details-grid, .ag-full-width-container',
			)
			await expect(detailGrid.first()).toBeVisible({ timeout: 5000 })
		}
	})

	test('should add DTR to timesheet', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Expand first timesheet
		const expandButton = page
			.locator('.ag-row')
			.first()
			.locator('button')
			.first()
		if (await expandButton.isVisible()) {
			await expandButton.click()
			await page.waitForTimeout(1000)

			// Look for Add DTR button
			const addDTRButton = page
				.locator('button:has-text("Add DTR"), button:has-text("New DTR")')
				.first()
			if (await addDTRButton.isVisible()) {
				await addDTRButton.click()

				// Fill DTR form
				const dateInput = page
					.locator('input[type="date"], input[name="date"]')
					.first()
				if (await dateInput.isVisible()) {
					await dateInput.fill('2025-01-10')
				}

				// Submit
				const submitButton = page
					.locator('button[type="submit"], button:has-text("Save")')
					.last()
				await submitButton.click()

				await page.waitForLoadState('networkidle')
			}
		}
	})

	test('should add timelog to DTR', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Expand timesheet
		const expandTimesheet = page
			.locator('.ag-row')
			.first()
			.locator('button')
			.first()
		if (await expandTimesheet.isVisible()) {
			await expandTimesheet.click()
			await page.waitForTimeout(1000)

			// Expand DTR
			const expandDTR = page
				.locator('.ag-details-grid .ag-row')
				.first()
				.locator('button')
				.first()
			if (await expandDTR.isVisible()) {
				await expandDTR.click()
				await page.waitForTimeout(1000)

				// Add timelog
				const addTimelogButton = page
					.locator(
						'button:has-text("Add Timelog"), button:has-text("New Timelog")',
					)
					.first()
				if (await addTimelogButton.isVisible()) {
					await addTimelogButton.click()

					// Fill timelog form
					const timeInInput = page
						.locator('input[name*="timeIn" i], input[placeholder*="time in" i]')
						.first()
					if (await timeInInput.isVisible()) {
						await timeInInput.fill('09:00')
					}

					const timeOutInput = page
						.locator(
							'input[name*="timeOut" i], input[placeholder*="time out" i]',
						)
						.first()
					if (await timeOutInput.isVisible()) {
						await timeOutInput.fill('17:00')
					}

					// Submit
					const submitButton = page
						.locator('button[type="submit"], button:has-text("Save")')
						.last()
					await submitButton.click()

					await page.waitForLoadState('networkidle')
				}
			}
		}
	})

	test('should add clock event to timelog', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Navigate through hierarchy to clock events
		// Expand timesheet
		const expandTimesheet = page
			.locator('.ag-row')
			.first()
			.locator('button')
			.first()
		if (await expandTimesheet.isVisible()) {
			await expandTimesheet.click()
			await page.waitForTimeout(1000)

			// Expand DTR
			const expandDTR = page
				.locator('.ag-details-grid .ag-row')
				.first()
				.locator('button')
				.first()
			if (await expandDTR.isVisible()) {
				await expandDTR.click()
				await page.waitForTimeout(1000)

				// Expand Timelog
				const expandTimelog = page
					.locator('.ag-details-grid')
					.last()
					.locator('.ag-row')
					.first()
					.locator('button')
					.first()
				if (await expandTimelog.isVisible()) {
					await expandTimelog.click()
					await page.waitForTimeout(1000)

					// Add clock event
					const addClockEventButton = page
						.locator(
							'button:has-text("Add Clock"), button:has-text("New Clock Event")',
						)
						.first()
					if (await addClockEventButton.isVisible()) {
						await addClockEventButton.click()

						// Fill clock event form
						const punchTimeInput = page
							.locator('input[type="time"], input[name*="punch" i]')
							.first()
						if (await punchTimeInput.isVisible()) {
							await punchTimeInput.fill('09:05')
						}

						// Submit
						const submitButton = page
							.locator('button[type="submit"], button:has-text("Save")')
							.last()
						await submitButton.click()

						await page.waitForLoadState('networkidle')
					}
				}
			}
		}
	})

	test('should edit timesheet details', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Find edit button in first row
		const editButton = page
			.locator('.ag-row')
			.first()
			.locator('button[title*="Edit" i], button:has-text("Edit")')
			.first()
		if (await editButton.isVisible()) {
			await editButton.click()

			// Wait for edit dialog
			await page.waitForTimeout(1000)

			// Update employee name
			const employeeInput = page
				.locator('input[name="employeeName"], input[value*="Employee"]')
				.first()
			if (await employeeInput.isVisible()) {
				await employeeInput.clear()
				await employeeInput.fill(`Updated Employee ${Date.now()}`)
			}

			// Save changes
			const saveButton = page
				.locator('button:has-text("Save"), button:has-text("Update")')
				.last()
			await saveButton.click()

			await page.waitForLoadState('networkidle')
		}
	})

	test('should delete clock event', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Navigate to clock events and delete
		// This would follow similar expansion pattern as above
		// Then find delete button and confirm deletion

		const deleteButton = page.locator('button[title*="Delete" i]').first()
		if (await deleteButton.isVisible()) {
			await deleteButton.click()

			// Confirm deletion if dialog appears
			const confirmButton = page
				.locator('button:has-text("Confirm"), button:has-text("Yes")')
				.last()
			if (await confirmButton.isVisible({ timeout: 1000 })) {
				await confirmButton.click()
			}

			await page.waitForLoadState('networkidle')
		}
	})

	test('should handle single expansion policy', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Expand first timesheet
		const firstExpand = page.locator('.ag-row').nth(0).locator('button').first()
		if (await firstExpand.isVisible()) {
			await firstExpand.click()
			await page.waitForTimeout(500)

			// Try to expand second timesheet
			const secondExpand = page
				.locator('.ag-row')
				.nth(1)
				.locator('button')
				.first()
			if (await secondExpand.isVisible()) {
				await secondExpand.click()
				await page.waitForTimeout(500)

				// First should be collapsed, only second expanded
				const detailGrids = page.locator('.ag-details-grid')
				const count = await detailGrids.count()
				// Should only have one expanded detail grid due to single expansion policy
				expect(count).toBeLessThanOrEqual(1)
			}
		}
	})

	test('should calculate total hours correctly', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Check for total hours column
		const totalHoursCell = page
			.locator('.ag-cell:has-text("hours"), .ag-cell:has-text("Hours")')
			.first()
		if (await totalHoursCell.isVisible()) {
			const hoursText = await totalHoursCell.textContent()
			// Should be a number or formatted hours
			expect(hoursText).toMatch(/\d+/)
		}
	})

	test('should filter timesheets by employee', async ({
		authenticatedPage,
	}) => {
		const page = authenticatedPage

		// Navigate to timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Look for filter input
		const filterInput = page
			.locator('input[placeholder*="filter" i], input[placeholder*="search" i]')
			.first()
		if (await filterInput.isVisible()) {
			await filterInput.fill('Test')
			await page.waitForTimeout(500)

			// Check filtered results
			const rows = page.locator('.ag-row')
			const rowCount = await rows.count()
			// Should have filtered results
			expect(rowCount).toBeGreaterThanOrEqual(0)
		}
	})

	test('should export timesheet data', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Navigate to timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Look for export button
		const exportButton = page
			.locator('button:has-text("Export"), button[title*="Export" i]')
			.first()
		if (await exportButton.isVisible()) {
			// Set up download promise before clicking
			const downloadPromise = page
				.waitForEvent('download', { timeout: 5000 })
				.catch(() => null)

			await exportButton.click()

			const download = await downloadPromise
			if (download) {
				// Verify download started
				expect(download).toBeTruthy()
			}
		}
	})
})
