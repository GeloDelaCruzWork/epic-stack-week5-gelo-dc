import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'
import { expect, test } from '#tests/playwright-utils.ts'

// Helper function to create test timesheet data
function createTimesheet() {
	return {
		employeeName: faker.person.fullName(),
		payPeriod: `${faker.date.recent().toISOString().split('T')[0]} - ${faker.date.soon().toISOString().split('T')[0]}`,
		detachment: faker.company.name(),
		shift: faker.helpers.arrayElement([
			'Day Shift',
			'Night Shift',
			'Mid Shift',
		]),
		regularHours: faker.number.float({ min: 0, max: 160, fractionDigits: 2 }),
		overtimeHours: faker.number.float({ min: 0, max: 40, fractionDigits: 2 }),
		nightDifferential: faker.number.float({
			min: 0,
			max: 20,
			fractionDigits: 2,
		}),
	}
}

// Helper function to create test DTR data
function createDTR() {
	return {
		date: faker.date.recent(),
		regularHours: faker.number.float({ min: 0, max: 8, fractionDigits: 2 }),
		overtimeHours: faker.number.float({ min: 0, max: 4, fractionDigits: 2 }),
		nightDifferential: faker.number.float({
			min: 0,
			max: 2,
			fractionDigits: 2,
		}),
	}
}

// Helper function to create test TimeLog data
function createTimeLog() {
	return {
		mode: faker.helpers.arrayElement(['in', 'out'] as const),
		timestamp: faker.date.recent(),
	}
}

// Helper function to create test ClockEvent data
function createClockEvent() {
	return {
		clockTime: faker.date.recent(),
	}
}

test.describe('Timesheet Management', () => {
	test('Users can view timesheets grid', async ({ page, login }) => {
		await login()
		await page.goto('/timesheets')

		// Wait for AG-Grid to load
		await expect(page.locator('.ag-root')).toBeVisible()

		// Check if the page title is displayed
		await expect(page.getByText('Timesheet Management')).toBeVisible()

		// Check if the grid header is visible
		await expect(page.locator('.ag-header')).toBeVisible()

		// Verify column headers
		await expect(
			page.locator('.ag-header-cell').filter({ hasText: 'Employee Name' }),
		).toBeVisible()
		await expect(
			page.locator('.ag-header-cell').filter({ hasText: 'Pay Period' }),
		).toBeVisible()
		await expect(
			page.locator('.ag-header-cell').filter({ hasText: 'Detachment' }),
		).toBeVisible()
		await expect(
			page.locator('.ag-header-cell').filter({ hasText: 'Shift' }),
		).toBeVisible()
	})

	test('Users can expand timesheet to view DTRs', async ({ page, login }) => {
		const user = await login()

		// Create test data
		const timesheet = await prisma.timesheet.create({
			data: createTimesheet(),
		})

		const dtr = await prisma.dTR.create({
			data: {
				...createDTR(),
				timesheetId: timesheet.id,
			},
		})

		await page.goto('/timesheets')

		// Wait for AG-Grid to load
		await expect(page.locator('.ag-root')).toBeVisible()

		// Find and expand the timesheet row
		const rowGroup = page
			.locator('.ag-row')
			.filter({ hasText: timesheet.employeeName })
			.first()
		await rowGroup.locator('.ag-group-contracted').click()

		// Wait for the detail grid to appear
		await expect(page.locator('.ag-details-row')).toBeVisible()

		// Verify DTR data is displayed
		const dtrDate = new Date(dtr.date).toLocaleDateString('en-US')
		await expect(
			page.locator('.ag-details-row').filter({ hasText: dtrDate }),
		).toBeVisible()
	})

	test('Users can edit timesheet details', async ({ page, login }) => {
		const user = await login()

		// Create test data
		const timesheet = await prisma.timesheet.create({
			data: createTimesheet(),
		})

		await page.goto('/timesheets')

		// Wait for AG-Grid to load
		await expect(page.locator('.ag-root')).toBeVisible()

		// Double-click on the timesheet row to open edit dialog
		const row = page
			.locator('.ag-row')
			.filter({ hasText: timesheet.employeeName })
			.first()
		await row.dblclick()

		// Wait for the edit dialog to appear
		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Edit Timesheet')).toBeVisible()

		// Update the employee name
		const updatedName = faker.person.fullName()
		await page.getByLabel('Employee Name').fill(updatedName)

		// Save the changes
		await page.getByRole('button', { name: /save/i }).click()

		// Wait for the dialog to close
		await expect(page.getByRole('dialog')).not.toBeVisible()

		// Verify the update is reflected in the grid
		await expect(
			page.locator('.ag-row').filter({ hasText: updatedName }),
		).toBeVisible()
	})

	test('Users can navigate through 4-level hierarchy', async ({
		page,
		login,
	}) => {
		const user = await login()

		// Create test data with complete hierarchy
		const timesheet = await prisma.timesheet.create({
			data: createTimesheet(),
		})

		const dtr = await prisma.dTR.create({
			data: {
				...createDTR(),
				timesheetId: timesheet.id,
			},
		})

		const timelog = await prisma.timelog.create({
			data: {
				...createTimeLog(),
				dtrId: dtr.id,
			},
		})

		const clockEvent = await prisma.clockEvent.create({
			data: {
				...createClockEvent(),
				timelogId: timelog.id,
			},
		})

		await page.goto('/timesheets')

		// Wait for AG-Grid to load
		await expect(page.locator('.ag-root')).toBeVisible()

		// Level 1: Expand timesheet to view DTRs
		const timesheetRow = page
			.locator('.ag-row')
			.filter({ hasText: timesheet.employeeName })
			.first()
		await timesheetRow.locator('.ag-group-contracted').click()
		await expect(page.locator('.ag-details-row').first()).toBeVisible()

		// Level 2: Expand DTR to view TimeLogs
		const dtrDate = new Date(dtr.date).toLocaleDateString('en-US')
		const dtrRow = page
			.locator('.ag-details-row .ag-row')
			.filter({ hasText: dtrDate })
			.first()
		await dtrRow.locator('.ag-group-contracted').click()

		// Wait for nested detail grid
		await page.waitForTimeout(500) // Small delay for nested grid to render

		// Level 3: Expand TimeLog to view ClockEvents
		const timelogText = timelog.mode === 'in' ? 'TIME IN' : 'TIME OUT'
		const timelogRow = page
			.locator('.ag-details-row .ag-details-row .ag-row')
			.filter({ hasText: timelogText })
			.first()
		await timelogRow.locator('.ag-group-contracted').click()

		// Wait for the deepest detail grid
		await page.waitForTimeout(500) // Small delay for nested grid to render

		// Level 4: Verify ClockEvent is visible
		const clockTime = new Date(clockEvent.clockTime).toLocaleTimeString('en-US')
		await expect(
			page.locator('.ag-details-row').filter({ hasText: clockTime }),
		).toBeVisible()
	})

	test('Users can edit DTR details', async ({ page, login }) => {
		const user = await login()

		// Create test data
		const timesheet = await prisma.timesheet.create({
			data: createTimesheet(),
		})

		const dtr = await prisma.dTR.create({
			data: {
				...createDTR(),
				timesheetId: timesheet.id,
			},
		})

		await page.goto('/timesheets')

		// Wait for AG-Grid to load
		await expect(page.locator('.ag-root')).toBeVisible()

		// Expand the timesheet
		const timesheetRow = page
			.locator('.ag-row')
			.filter({ hasText: timesheet.employeeName })
			.first()
		await timesheetRow.locator('.ag-group-contracted').click()
		await expect(page.locator('.ag-details-row').first()).toBeVisible()

		// Double-click on the DTR row to open edit dialog
		const dtrDate = new Date(dtr.date).toLocaleDateString('en-US')
		const dtrRow = page
			.locator('.ag-details-row .ag-row')
			.filter({ hasText: dtrDate })
			.first()
		await dtrRow.dblclick()

		// Wait for the edit dialog to appear
		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Edit Daily Time Record')).toBeVisible()

		// Update regular hours
		await page.getByLabel('Regular Hours').fill('8.5')

		// Save the changes
		await page.getByRole('button', { name: /save/i }).click()

		// Wait for the dialog to close
		await expect(page.getByRole('dialog')).not.toBeVisible()

		// Verify the update is reflected in the grid
		await expect(
			page.locator('.ag-details-row .ag-row').filter({ hasText: '8.5' }),
		).toBeVisible()
	})

	test('Users can edit TimeLog details', async ({ page, login }) => {
		const user = await login()

		// Create test data
		const timesheet = await prisma.timesheet.create({
			data: createTimesheet(),
		})

		const dtr = await prisma.dTR.create({
			data: {
				...createDTR(),
				timesheetId: timesheet.id,
			},
		})

		const timelog = await prisma.timelog.create({
			data: {
				...createTimeLog(),
				mode: 'in',
				dtrId: dtr.id,
			},
		})

		await page.goto('/timesheets')

		// Wait for AG-Grid to load
		await expect(page.locator('.ag-root')).toBeVisible()

		// Expand timesheet
		const timesheetRow = page
			.locator('.ag-row')
			.filter({ hasText: timesheet.employeeName })
			.first()
		await timesheetRow.locator('.ag-group-contracted').click()
		await expect(page.locator('.ag-details-row').first()).toBeVisible()

		// Expand DTR
		const dtrDate = new Date(dtr.date).toLocaleDateString('en-US')
		const dtrRow = page
			.locator('.ag-details-row .ag-row')
			.filter({ hasText: dtrDate })
			.first()
		await dtrRow.locator('.ag-group-contracted').click()
		await page.waitForTimeout(500)

		// Double-click on the TimeLog row to open edit dialog
		const timelogRow = page
			.locator('.ag-details-row .ag-details-row .ag-row')
			.filter({ hasText: 'TIME IN' })
			.first()
		await timelogRow.dblclick()

		// Wait for the edit dialog to appear
		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Edit Time Log Entry')).toBeVisible()

		// Change mode to TIME OUT
		await page.getByRole('button', { name: /TIME OUT/i }).click()

		// Save the changes
		await page.getByRole('button', { name: /save/i }).click()

		// Wait for the dialog to close
		await expect(page.getByRole('dialog')).not.toBeVisible()

		// Verify the update is reflected in the grid
		await expect(
			page
				.locator('.ag-details-row .ag-details-row .ag-row')
				.filter({ hasText: 'TIME OUT' }),
		).toBeVisible()
	})

	test('Users can edit ClockEvent details', async ({ page, login }) => {
		const user = await login()

		// Create test data
		const timesheet = await prisma.timesheet.create({
			data: createTimesheet(),
		})

		const dtr = await prisma.dTR.create({
			data: {
				...createDTR(),
				timesheetId: timesheet.id,
			},
		})

		const timelog = await prisma.timelog.create({
			data: {
				...createTimeLog(),
				dtrId: dtr.id,
			},
		})

		const clockEvent = await prisma.clockEvent.create({
			data: {
				...createClockEvent(),
				timelogId: timelog.id,
			},
		})

		await page.goto('/timesheets')

		// Wait for AG-Grid to load
		await expect(page.locator('.ag-root')).toBeVisible()

		// Navigate through hierarchy to clock event
		const timesheetRow = page
			.locator('.ag-row')
			.filter({ hasText: timesheet.employeeName })
			.first()
		await timesheetRow.locator('.ag-group-contracted').click()
		await expect(page.locator('.ag-details-row').first()).toBeVisible()

		const dtrDate = new Date(dtr.date).toLocaleDateString('en-US')
		const dtrRow = page
			.locator('.ag-details-row .ag-row')
			.filter({ hasText: dtrDate })
			.first()
		await dtrRow.locator('.ag-group-contracted').click()
		await page.waitForTimeout(500)

		const timelogText = timelog.mode === 'in' ? 'TIME IN' : 'TIME OUT'
		const timelogRow = page
			.locator('.ag-details-row .ag-details-row .ag-row')
			.filter({ hasText: timelogText })
			.first()
		await timelogRow.locator('.ag-group-contracted').click()
		await page.waitForTimeout(500)

		// Double-click on the ClockEvent row to open edit dialog
		const clockEventRow = page
			.locator('.ag-details-row .ag-details-row .ag-details-row .ag-row')
			.first()
		await clockEventRow.dblclick()

		// Wait for the edit dialog to appear
		await expect(page.getByRole('dialog')).toBeVisible()
		await expect(page.getByText('Edit Clock Event')).toBeVisible()

		// Update the time
		await page.getByLabel('Time').fill('14:30:00')

		// Save the changes
		await page.getByRole('button', { name: /save/i }).click()

		// Wait for the dialog to close
		await expect(page.getByRole('dialog')).not.toBeVisible()

		// Verify the update is reflected in the grid
		await expect(
			page.locator('.ag-details-row').filter({ hasText: '2:30' }),
		).toBeVisible()
	})

	test('Theme switching works with AG-Grid', async ({ page, login }) => {
		await login()
		await page.goto('/timesheets')

		// Wait for AG-Grid to load
		await expect(page.locator('.ag-root')).toBeVisible()

		// Check initial theme (should be light by default)
		await expect(page.locator('.ag-theme-quartz')).toBeVisible()

		// Click theme switcher to dark mode
		const themeSwitcher = page
			.getByRole('button')
			.filter({
				has: page.locator('[class*="sun"], [class*="moon"], [class*="laptop"]'),
			})
			.first()
		await themeSwitcher.click()

		// Check if dark theme is applied
		await expect(page.locator('.ag-theme-quartz-dark')).toBeVisible()

		// Switch back to light mode
		await themeSwitcher.click()

		// Verify light theme is back
		await expect(page.locator('.ag-theme-quartz')).toBeVisible()
	})

	test('Single expansion policy works correctly', async ({ page, login }) => {
		const user = await login()

		// Create test data with multiple timesheets
		const timesheet1 = await prisma.timesheet.create({
			data: createTimesheet(),
		})

		const timesheet2 = await prisma.timesheet.create({
			data: createTimesheet(),
		})

		await prisma.dTR.create({
			data: {
				...createDTR(),
				timesheetId: timesheet1.id,
			},
		})

		await prisma.dTR.create({
			data: {
				...createDTR(),
				timesheetId: timesheet2.id,
			},
		})

		await page.goto('/timesheets')

		// Wait for AG-Grid to load
		await expect(page.locator('.ag-root')).toBeVisible()

		// Expand first timesheet
		const row1 = page
			.locator('.ag-row')
			.filter({ hasText: timesheet1.employeeName })
			.first()
		await row1.locator('.ag-group-contracted').click()

		// Verify first timesheet is expanded
		await expect(page.locator('.ag-details-row')).toBeVisible()

		// Expand second timesheet
		const row2 = page
			.locator('.ag-row')
			.filter({ hasText: timesheet2.employeeName })
			.first()
		await row2.locator('.ag-group-contracted').click()

		// Wait a moment for the transition
		await page.waitForTimeout(300)

		// Verify only one detail row is visible (single expansion policy)
		const detailRows = await page.locator('.ag-details-row').count()
		expect(detailRows).toBe(1)

		// Verify the second timesheet is the one expanded
		const expandedRow = page
			.locator('.ag-row-group-expanded')
			.filter({ hasText: timesheet2.employeeName })
		await expect(expandedRow).toBeVisible()
	})

	test('Data persists after edit without page refresh', async ({
		page,
		login,
	}) => {
		const user = await login()

		// Create test data
		const timesheet = await prisma.timesheet.create({
			data: createTimesheet(),
		})

		await page.goto('/timesheets')

		// Wait for AG-Grid to load
		await expect(page.locator('.ag-root')).toBeVisible()

		// Store the initial URL
		const initialUrl = page.url()

		// Double-click to edit
		const row = page
			.locator('.ag-row')
			.filter({ hasText: timesheet.employeeName })
			.first()
		await row.dblclick()

		// Update the employee name
		const updatedName = faker.person.fullName()
		await page.getByLabel('Employee Name').fill(updatedName)

		// Save the changes
		await page.getByRole('button', { name: /save/i }).click()

		// Wait for the dialog to close
		await expect(page.getByRole('dialog')).not.toBeVisible()

		// Verify the URL hasn't changed (no page refresh)
		expect(page.url()).toBe(initialUrl)

		// Verify the update is reflected in the grid
		await expect(
			page.locator('.ag-row').filter({ hasText: updatedName }),
		).toBeVisible()

		// Verify the old name is no longer visible
		await expect(
			page.locator('.ag-row').filter({ hasText: timesheet.employeeName }),
		).not.toBeVisible()
	})
})
