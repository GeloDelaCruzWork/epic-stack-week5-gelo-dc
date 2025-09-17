/**
 * Helper utilities for timesheet tests
 * This module provides utilities for setting up test data and interacting with the timesheet UI
 */

import { type Page } from '@playwright/test'
import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'

export interface TestTimesheet {
	id: string
	employeeName: string
	payPeriod: string
	detachment: string
	shift: 'Day Shift' | 'Night Shift' | 'Mid Shift'
	regularHours: number
	overtimeHours: number
	nightDifferential: number
}

export interface TestDTR {
	id: string
	date: Date
	regularHours: number
	overtimeHours: number
	nightDifferential: number
	timesheetId: string
}

export interface TestTimeLog {
	id: string
	mode: 'in' | 'out'
	timestamp: Date
	dtrId: string
}

export interface TestClockEvent {
	id: string
	clockTime: Date
	timelogId: string
}

/**
 * Creates a complete timesheet hierarchy for testing
 */
export async function createTimesheetHierarchy() {
	// Create timesheet
	const timesheet = await prisma.timesheet.create({
		data: {
			employeeName: faker.person.fullName(),
			payPeriod: `${faker.date.recent().toISOString().split('T')[0]} - ${faker.date.soon().toISOString().split('T')[0]}`,
			detachment: faker.company.name(),
			shift: faker.helpers.arrayElement([
				'Day Shift',
				'Night Shift',
				'Mid Shift',
			]),
			regularHours: 0,
			overtimeHours: 0,
			nightDifferential: 0,
		},
	})

	// Create DTRs for the timesheet
	const dtrs = await Promise.all([
		prisma.dTR.create({
			data: {
				date: faker.date.recent(),
				regularHours: 8,
				overtimeHours: 0,
				nightDifferential: 0,
				timesheetId: timesheet.id,
			},
		}),
		prisma.dTR.create({
			data: {
				date: faker.date.recent(),
				regularHours: 8,
				overtimeHours: 2,
				nightDifferential: 0,
				timesheetId: timesheet.id,
			},
		}),
	])

	// Create TimeLogs for each DTR
	const timelogs = await Promise.all([
		// Morning time in for first DTR
		prisma.timelog.create({
			data: {
				mode: 'in',
				timestamp: new Date('2024-01-15T08:00:00'),
				dtrId: dtrs[0].id,
			},
		}),
		// Evening time out for first DTR
		prisma.timelog.create({
			data: {
				mode: 'out',
				timestamp: new Date('2024-01-15T17:00:00'),
				dtrId: dtrs[0].id,
			},
		}),
		// Morning time in for second DTR
		prisma.timelog.create({
			data: {
				mode: 'in',
				timestamp: new Date('2024-01-16T08:00:00'),
				dtrId: dtrs[1].id,
			},
		}),
		// Evening time out for second DTR
		prisma.timelog.create({
			data: {
				mode: 'out',
				timestamp: new Date('2024-01-16T19:00:00'),
				dtrId: dtrs[1].id,
			},
		}),
	])

	// Create ClockEvents for each TimeLog
	const clockEvents = await Promise.all(
		timelogs.map((timelog) =>
			prisma.clockEvent.create({
				data: {
					clockTime: timelog.timestamp,
					timelogId: timelog.id,
				},
			}),
		),
	)

	// Update timesheet totals
	const totalRegular = dtrs.reduce((sum, dtr) => sum + dtr.regularHours, 0)
	const totalOvertime = dtrs.reduce((sum, dtr) => sum + dtr.overtimeHours, 0)
	const totalNightDiff = dtrs.reduce(
		(sum, dtr) => sum + dtr.nightDifferential,
		0,
	)

	await prisma.timesheet.update({
		where: { id: timesheet.id },
		data: {
			regularHours: totalRegular,
			overtimeHours: totalOvertime,
			nightDifferential: totalNightDiff,
		},
	})

	return {
		timesheet,
		dtrs,
		timelogs,
		clockEvents,
	}
}

/**
 * Utility functions for interacting with AG-Grid in timesheet tests
 */
export class TimesheetGridHelper {
	constructor(private page: Page) {}

	/**
	 * Waits for the AG-Grid to be fully loaded
	 */
	async waitForGrid() {
		await this.page.locator('.ag-root').waitFor({ state: 'visible' })
		await this.page.waitForTimeout(500) // Allow time for data to load
	}

	/**
	 * Expands a row in the grid by employee name
	 */
	async expandTimesheet(employeeName: string) {
		const row = this.page
			.locator('.ag-row')
			.filter({ hasText: employeeName })
			.first()
		const expandButton = row.locator('.ag-group-contracted')
		if (await expandButton.isVisible()) {
			await expandButton.click()
			await this.page.waitForTimeout(300) // Allow animation to complete
		}
	}

	/**
	 * Expands a DTR row by date
	 */
	async expandDTR(date: Date | string) {
		const dateString =
			typeof date === 'string' ? date : date.toLocaleDateString('en-US')
		const row = this.page
			.locator('.ag-details-row .ag-row')
			.filter({ hasText: dateString })
			.first()
		const expandButton = row.locator('.ag-group-contracted')
		if (await expandButton.isVisible()) {
			await expandButton.click()
			await this.page.waitForTimeout(300) // Allow animation to complete
		}
	}

	/**
	 * Expands a TimeLog row by mode
	 */
	async expandTimeLog(mode: 'in' | 'out') {
		const text = mode === 'in' ? 'TIME IN' : 'TIME OUT'
		const row = this.page
			.locator('.ag-details-row .ag-details-row .ag-row')
			.filter({ hasText: text })
			.first()
		const expandButton = row.locator('.ag-group-contracted')
		if (await expandButton.isVisible()) {
			await expandButton.click()
			await this.page.waitForTimeout(300) // Allow animation to complete
		}
	}

	/**
	 * Opens the edit dialog for a timesheet
	 */
	async editTimesheet(employeeName: string) {
		const row = this.page
			.locator('.ag-row')
			.filter({ hasText: employeeName })
			.first()
		await row.dblclick()
		await this.page.getByRole('dialog').waitFor({ state: 'visible' })
	}

	/**
	 * Opens the edit dialog for a DTR
	 */
	async editDTR(date: Date | string) {
		const dateString =
			typeof date === 'string' ? date : date.toLocaleDateString('en-US')
		const row = this.page
			.locator('.ag-details-row .ag-row')
			.filter({ hasText: dateString })
			.first()
		await row.dblclick()
		await this.page.getByRole('dialog').waitFor({ state: 'visible' })
	}

	/**
	 * Opens the edit dialog for a TimeLog
	 */
	async editTimeLog(mode: 'in' | 'out') {
		const text = mode === 'in' ? 'TIME IN' : 'TIME OUT'
		const row = this.page
			.locator('.ag-details-row .ag-details-row .ag-row')
			.filter({ hasText: text })
			.first()
		await row.dblclick()
		await this.page.getByRole('dialog').waitFor({ state: 'visible' })
	}

	/**
	 * Opens the edit dialog for a ClockEvent
	 */
	async editClockEvent(time: string) {
		const row = this.page
			.locator('.ag-details-row .ag-details-row .ag-details-row .ag-row')
			.filter({ hasText: time })
			.first()
		await row.dblclick()
		await this.page.getByRole('dialog').waitFor({ state: 'visible' })
	}

	/**
	 * Saves the current dialog
	 */
	async saveDialog() {
		await this.page.getByRole('button', { name: /save/i }).click()
		await this.page.getByRole('dialog').waitFor({ state: 'hidden' })
	}

	/**
	 * Cancels the current dialog
	 */
	async cancelDialog() {
		await this.page.getByRole('button', { name: /cancel/i }).click()
		await this.page.getByRole('dialog').waitFor({ state: 'hidden' })
	}

	/**
	 * Verifies a value exists in the grid
	 */
	async verifyValueInGrid(value: string) {
		await this.page
			.locator('.ag-cell')
			.filter({ hasText: value })
			.waitFor({ state: 'visible' })
	}

	/**
	 * Gets the current theme class
	 */
	async getCurrentTheme(): Promise<'light' | 'dark'> {
		const hasDarkTheme = await this.page
			.locator('.ag-theme-quartz-dark')
			.isVisible()
		return hasDarkTheme ? 'dark' : 'light'
	}

	/**
	 * Toggles the theme
	 */
	async toggleTheme() {
		const themeSwitcher = this.page
			.getByRole('button')
			.filter({
				has: this.page.locator(
					'[class*="sun"], [class*="moon"], [class*="laptop"]',
				),
			})
			.first()
		await themeSwitcher.click()
		await this.page.waitForTimeout(300) // Allow theme transition
	}
}

/**
 * Creates multiple timesheets for testing pagination and filtering
 */
export async function createMultipleTimesheets(count: number = 10) {
	const timesheets = []

	for (let i = 0; i < count; i++) {
		const timesheet = await prisma.timesheet.create({
			data: {
				employeeName: faker.person.fullName(),
				payPeriod: `${faker.date.recent().toISOString().split('T')[0]} - ${faker.date.soon().toISOString().split('T')[0]}`,
				detachment: faker.company.name(),
				shift: faker.helpers.arrayElement([
					'Day Shift',
					'Night Shift',
					'Mid Shift',
				]),
				regularHours: faker.number.float({
					min: 120,
					max: 180,
					fractionDigits: 2,
				}),
				overtimeHours: faker.number.float({
					min: 0,
					max: 40,
					fractionDigits: 2,
				}),
				nightDifferential: faker.number.float({
					min: 0,
					max: 20,
					fractionDigits: 2,
				}),
			},
		})
		timesheets.push(timesheet)
	}

	return timesheets
}

/**
 * Cleans up test data after tests
 */
export async function cleanupTestData() {
	// Delete in reverse order of dependencies
	await prisma.clockEvent.deleteMany({})
	await prisma.timelog.deleteMany({})
	await prisma.dTR.deleteMany({})
	await prisma.timesheet.deleteMany({})
}
