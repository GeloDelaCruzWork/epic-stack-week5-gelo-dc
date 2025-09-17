# Payroll Officer Implementation Plan

## Phase 1: Foundation Setup (Week 1-2)

### Database Schema

```prisma
// Add to schema.prisma

model PayrollEntry {
  id                String   @id @default(cuid())
  payPeriodId       String
  payPeriod         PayPeriod @relation(fields: [payPeriodId], references: [id])

  // Employee Information
  employeeId        String
  employee          User     @relation(fields: [employeeId], references: [id])
  department        String
  position          String
  payGrade          String

  // Time Records
  regularHours      Decimal  @db.Decimal(5, 2)
  overtimeHours     Decimal  @db.Decimal(5, 2)
  holidayHours      Decimal  @db.Decimal(5, 2)
  sickLeave         Decimal  @db.Decimal(5, 2)
  vacation          Decimal  @db.Decimal(5, 2)
  otherLeave        Decimal  @db.Decimal(5, 2)

  // Pay Rates
  baseRate          Decimal  @db.Decimal(10, 2)
  overtimeRate      Decimal  @db.Decimal(10, 2)
  shiftDifferential Decimal  @db.Decimal(10, 2)
  holidayRate       Decimal  @db.Decimal(10, 2)

  // Calculated Amounts
  regularPay        Decimal  @db.Decimal(10, 2)
  overtimePay       Decimal  @db.Decimal(10, 2)
  shiftPay          Decimal  @db.Decimal(10, 2)
  holidayPay        Decimal  @db.Decimal(10, 2)
  grossPay          Decimal  @db.Decimal(10, 2)

  // Status Tracking
  status            EntryStatus @default(DRAFT)
  validationStatus  ValidationStatus?

  // Metadata
  createdBy         String
  creator           User     @relation("PayrollEntryCreator", fields: [createdBy], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  calculations      PayrollCalculation[]
  validations       PayrollValidation[]

  @@index([payPeriodId])
  @@index([employeeId])
  @@index([status])
  @@unique([payPeriodId, employeeId])
}

model PayrollCalculation {
  id                String   @id @default(cuid())
  entryId           String
  entry             PayrollEntry @relation(fields: [entryId], references: [id])

  // Calculation Details
  calculationType   CalculationType
  inputValue        Decimal  @db.Decimal(10, 2)
  rate              Decimal  @db.Decimal(10, 2)
  multiplier        Decimal  @db.Decimal(5, 2) @default(1.0)
  result            Decimal  @db.Decimal(10, 2)

  // Audit Trail
  formula           String
  notes             String?

  calculatedAt      DateTime @default(now())
  calculatedBy      String

  @@index([entryId])
}

model PayrollValidation {
  id                String   @id @default(cuid())
  entryId           String
  entry             PayrollEntry @relation(fields: [entryId], references: [id])

  // Validation Details
  validationType    ValidationType
  fieldName         String
  expectedValue     String?
  actualValue       String?
  passed            Boolean
  severity          Severity
  message           String

  // Resolution
  resolved          Boolean  @default(false)
  resolvedBy        String?
  resolvedAt        DateTime?
  resolutionNotes   String?

  validatedAt       DateTime @default(now())

  @@index([entryId])
  @@index([resolved])
}

model PayrollPackage {
  id                String   @id @default(cuid())
  payPeriodId       String   @unique
  payPeriod         PayPeriod @relation(fields: [payPeriodId], references: [id])

  // Package Summary
  totalEmployees    Int
  totalRegularHours Decimal  @db.Decimal(10, 2)
  totalOvertimeHours Decimal @db.Decimal(10, 2)
  totalGrossPay     Decimal  @db.Decimal(15, 2)

  // Status
  status            PackageStatus @default(DRAFT)

  // Submission Details
  preparedBy        String
  preparer          User     @relation(fields: [preparedBy], references: [id])
  preparedAt        DateTime @default(now())
  submittedAt       DateTime?
  submittedTo       String?

  // Validation Summary
  validationScore   Int?
  validationPassed  Boolean  @default(false)
  criticalIssues    Int      @default(0)
  warnings          Int      @default(0)

  // Documents
  attachments       Json?

  // Verifier Response
  verifierResponse  VerifierResponse?

  @@index([status])
  @@index([preparedBy])
}

model TimesheetReceival {
  id                String   @id @default(cuid())
  payPeriodId       String

  // Source Information
  employeeId        String
  department        String
  receivedFrom      String   // HR Manager ID

  // Tracking
  receivedAt        DateTime @default(now())
  processedAt       DateTime?
  processedBy       String?

  // Status
  status            ReceivalStatus @default(PENDING)

  // Validation
  hasHRApproval     Boolean
  hasSupervisorApproval Boolean
  isComplete        Boolean

  // Issues
  issues            String?

  @@index([payPeriodId])
  @@index([status])
  @@index([employeeId])
}

enum EntryStatus {
  DRAFT
  IN_PROGRESS
  CALCULATED
  VALIDATED
  COMPLETED
  SUBMITTED
}

enum ValidationStatus {
  NOT_VALIDATED
  PASSED
  FAILED
  PASSED_WITH_WARNINGS
}

enum CalculationType {
  REGULAR_PAY
  OVERTIME_PAY
  SHIFT_DIFFERENTIAL
  HOLIDAY_PAY
  SICK_PAY
  VACATION_PAY
  OTHER
}

enum ValidationType {
  REQUIRED_FIELD
  RANGE_CHECK
  CALCULATION_CHECK
  COMPLIANCE_CHECK
  DUPLICATE_CHECK
  CONSISTENCY_CHECK
}

enum Severity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
  INFO
}

enum PackageStatus {
  DRAFT
  IN_PROGRESS
  READY
  SUBMITTED
  ACCEPTED
  REJECTED
}

enum ReceivalStatus {
  PENDING
  PROCESSING
  COMPLETED
  REJECTED
}
```

### Permission Structure

```typescript
// app/utils/permissions.payroll-officer.ts

export const payrollOfficerPermissions = {
	// Timesheet permissions
	'payroll:timesheet:view': 'View timesheets',
	'payroll:timesheet:receive': 'Receive timesheets from HR',
	'payroll:timesheet:process': 'Process timesheet data',
	'payroll:timesheet:validate': 'Validate timesheet entries',

	// Entry permissions
	'payroll:entry:create': 'Create payroll entries',
	'payroll:entry:edit': 'Edit payroll entries',
	'payroll:entry:delete': 'Delete draft entries',
	'payroll:entry:calculate': 'Calculate payroll amounts',

	// Validation permissions
	'payroll:validation:run': 'Run validation checks',
	'payroll:validation:override': 'Override validation warnings',
	'payroll:validation:report': 'Generate validation reports',

	// Submission permissions
	'payroll:package:create': 'Create payroll package',
	'payroll:package:submit': 'Submit to Verifier',
	'payroll:package:recall': 'Recall submitted package',

	// Report permissions
	'payroll:report:generate': 'Generate payroll reports',
	'payroll:report:export': 'Export payroll data',
} as const

export const payrollOfficerRole = {
	name: 'payroll_officer',
	displayName: 'Payroll Officer',
	permissions: Object.keys(payrollOfficerPermissions),
	description: 'Primary payroll data entry and processing',
}
```

## Phase 2: Core Processing System (Week 3-4)

### Timesheet Processing Service

```typescript
// app/services/timesheet-processor.server.ts

import { prisma } from '#app/utils/db.server'
import type { User, PayPeriod } from '@prisma/client'

export class TimesheetProcessor {
	async receiveTimesheets(payPeriodId: string, hrManagerId: string) {
		// Get approved timesheets from HR system
		const timesheets = await prisma.timesheet.findMany({
			where: {
				payPeriodId,
				hrApprovalStatus: 'APPROVED',
				hrApprovedBy: hrManagerId,
			},
			include: {
				employee: true,
				dtrs: {
					include: {
						timelogs: true,
					},
				},
			},
		})

		// Create receival records
		const receivals = await Promise.all(
			timesheets.map((timesheet) =>
				prisma.timesheetReceival.create({
					data: {
						payPeriodId,
						employeeId: timesheet.employeeId,
						department: timesheet.employee.department,
						receivedFrom: hrManagerId,
						hasHRApproval: true,
						hasSupervisorApproval: true,
						isComplete: this.validateCompleteness(timesheet),
						status: 'PENDING',
					},
				}),
			),
		)

		// Notify payroll officer
		await this.notifyPayrollOfficer(payPeriodId, receivals.length)

		return receivals
	}

	async processTimesheet(receivalId: string, officerId: string) {
		const receival = await prisma.timesheetReceival.findUnique({
			where: { id: receivalId },
		})

		if (!receival) {
			throw new Error('Timesheet receival not found')
		}

		// Get timesheet data
		const timesheet = await prisma.timesheet.findFirst({
			where: {
				payPeriodId: receival.payPeriodId,
				employeeId: receival.employeeId,
			},
			include: {
				employee: true,
				dtrs: {
					include: {
						timelogs: true,
					},
				},
			},
		})

		// Calculate hours
		const hours = this.calculateHours(timesheet.dtrs)

		// Get employee rates
		const rates = await this.getEmployeeRates(receival.employeeId)

		// Create payroll entry
		const entry = await prisma.payrollEntry.create({
			data: {
				payPeriodId: receival.payPeriodId,
				employeeId: receival.employeeId,
				department: timesheet.employee.department,
				position: timesheet.employee.position,
				payGrade: timesheet.employee.payGrade,
				regularHours: hours.regular,
				overtimeHours: hours.overtime,
				holidayHours: hours.holiday,
				sickLeave: hours.sick,
				vacation: hours.vacation,
				otherLeave: hours.other,
				baseRate: rates.base,
				overtimeRate: rates.overtime,
				shiftDifferential: rates.shift,
				holidayRate: rates.holiday,
				regularPay: 0, // Will be calculated
				overtimePay: 0,
				shiftPay: 0,
				holidayPay: 0,
				grossPay: 0,
				status: 'IN_PROGRESS',
				createdBy: officerId,
			},
		})

		// Update receival status
		await prisma.timesheetReceival.update({
			where: { id: receivalId },
			data: {
				status: 'PROCESSING',
				processedAt: new Date(),
				processedBy: officerId,
			},
		})

		return entry
	}

	calculateHours(dtrs: any[]) {
		const hours = {
			regular: 0,
			overtime: 0,
			holiday: 0,
			sick: 0,
			vacation: 0,
			other: 0,
		}

		dtrs.forEach((dtr) => {
			dtr.timelogs.forEach((log) => {
				const hoursWorked = this.calculateLogHours(log)

				if (hoursWorked <= 8) {
					hours.regular += hoursWorked
				} else {
					hours.regular += 8
					hours.overtime += hoursWorked - 8
				}

				// Additional logic for special hours
				if (log.isHoliday) {
					hours.holiday += hoursWorked
				}
			})
		})

		return hours
	}

	calculateLogHours(log: any): number {
		const timeIn = new Date(log.actualTimeIn)
		const timeOut = new Date(log.actualTimeOut)
		const milliseconds = timeOut.getTime() - timeIn.getTime()
		return milliseconds / (1000 * 60 * 60) // Convert to hours
	}

	async getEmployeeRates(employeeId: string) {
		// Get from compensation system
		const compensation = await prisma.employeeCompensation.findFirst({
			where: {
				employeeId,
				effectiveDate: {
					lte: new Date(),
				},
			},
			orderBy: {
				effectiveDate: 'desc',
			},
		})

		return {
			base: compensation?.baseRate || 0,
			overtime: compensation?.baseRate * 1.5 || 0,
			shift: compensation?.shiftDifferential || 0,
			holiday: compensation?.baseRate * 2 || 0,
		}
	}

	validateCompleteness(timesheet: any): boolean {
		// Check if all required days have entries
		// Check if all entries have proper approvals
		// Check if hours are within expected ranges
		return true // Simplified
	}

	async notifyPayrollOfficer(payPeriodId: string, count: number) {
		await prisma.notification.create({
			data: {
				type: 'TIMESHEETS_RECEIVED',
				title: `${count} Timesheets Received`,
				message: `Timesheets for pay period are ready for processing`,
				targetRole: 'payroll_officer',
				relatedId: payPeriodId,
				priority: 'HIGH',
			},
		})
	}
}
```

### Calculation Service

```typescript
// app/services/payroll-calculator.server.ts

export class PayrollCalculator {
	async calculateEntry(entryId: string) {
		const entry = await prisma.payrollEntry.findUnique({
			where: { id: entryId },
		})

		if (!entry) {
			throw new Error('Payroll entry not found')
		}

		// Calculate regular pay
		const regularPay = await this.calculateRegularPay(entry)

		// Calculate overtime pay
		const overtimePay = await this.calculateOvertimePay(entry)

		// Calculate shift differential
		const shiftPay = await this.calculateShiftPay(entry)

		// Calculate holiday pay
		const holidayPay = await this.calculateHolidayPay(entry)

		// Calculate gross pay
		const grossPay = regularPay + overtimePay + shiftPay + holidayPay

		// Update entry with calculations
		const updatedEntry = await prisma.payrollEntry.update({
			where: { id: entryId },
			data: {
				regularPay,
				overtimePay,
				shiftPay,
				holidayPay,
				grossPay,
				status: 'CALCULATED',
			},
		})

		// Store calculation details
		await this.storeCalculationDetails(entryId, {
			regular: {
				hours: entry.regularHours,
				rate: entry.baseRate,
				result: regularPay,
			},
			overtime: {
				hours: entry.overtimeHours,
				rate: entry.overtimeRate,
				result: overtimePay,
			},
			shift: {
				hours: entry.regularHours,
				rate: entry.shiftDifferential,
				result: shiftPay,
			},
			holiday: {
				hours: entry.holidayHours,
				rate: entry.holidayRate,
				result: holidayPay,
			},
		})

		return updatedEntry
	}

	async calculateRegularPay(entry: any): Promise<number> {
		const calculation = Number(entry.regularHours) * Number(entry.baseRate)

		await prisma.payrollCalculation.create({
			data: {
				entryId: entry.id,
				calculationType: 'REGULAR_PAY',
				inputValue: entry.regularHours,
				rate: entry.baseRate,
				multiplier: 1,
				result: calculation,
				formula: `${entry.regularHours} hours × $${entry.baseRate}/hour`,
				calculatedBy: 'system',
			},
		})

		return calculation
	}

	async calculateOvertimePay(entry: any): Promise<number> {
		const calculation = Number(entry.overtimeHours) * Number(entry.overtimeRate)

		await prisma.payrollCalculation.create({
			data: {
				entryId: entry.id,
				calculationType: 'OVERTIME_PAY',
				inputValue: entry.overtimeHours,
				rate: entry.overtimeRate,
				multiplier: 1.5,
				result: calculation,
				formula: `${entry.overtimeHours} hours × $${entry.overtimeRate}/hour (1.5x)`,
				calculatedBy: 'system',
			},
		})

		return calculation
	}

	async calculateShiftPay(entry: any): Promise<number> {
		const calculation =
			Number(entry.regularHours) * Number(entry.shiftDifferential)

		await prisma.payrollCalculation.create({
			data: {
				entryId: entry.id,
				calculationType: 'SHIFT_DIFFERENTIAL',
				inputValue: entry.regularHours,
				rate: entry.shiftDifferential,
				multiplier: 1,
				result: calculation,
				formula: `${entry.regularHours} hours × $${entry.shiftDifferential}/hour differential`,
				calculatedBy: 'system',
			},
		})

		return calculation
	}

	async calculateHolidayPay(entry: any): Promise<number> {
		const calculation = Number(entry.holidayHours) * Number(entry.holidayRate)

		await prisma.payrollCalculation.create({
			data: {
				entryId: entry.id,
				calculationType: 'HOLIDAY_PAY',
				inputValue: entry.holidayHours,
				rate: entry.holidayRate,
				multiplier: 2,
				result: calculation,
				formula: `${entry.holidayHours} hours × $${entry.holidayRate}/hour (2x)`,
				calculatedBy: 'system',
			},
		})

		return calculation
	}

	async batchCalculate(payPeriodId: string) {
		const entries = await prisma.payrollEntry.findMany({
			where: {
				payPeriodId,
				status: { in: ['IN_PROGRESS', 'DRAFT'] },
			},
		})

		const results = await Promise.all(
			entries.map((entry) => this.calculateEntry(entry.id)),
		)

		return {
			processed: results.length,
			successful: results.filter((r) => r.status === 'CALCULATED').length,
			failed: results.filter((r) => r.status !== 'CALCULATED').length,
		}
	}
}
```

## Phase 3: Validation System (Week 5-6)

### Validation Service

```typescript
// app/services/payroll-validator.server.ts

export class PayrollValidator {
	async validateEntry(entryId: string): Promise<ValidationResult> {
		const entry = await prisma.payrollEntry.findUnique({
			where: { id: entryId },
			include: {
				employee: true,
				calculations: true,
			},
		})

		if (!entry) {
			throw new Error('Entry not found')
		}

		const validations = []

		// Required field validation
		validations.push(...(await this.validateRequiredFields(entry)))

		// Range validation
		validations.push(...(await this.validateRanges(entry)))

		// Calculation validation
		validations.push(...(await this.validateCalculations(entry)))

		// Compliance validation
		validations.push(...(await this.validateCompliance(entry)))

		// Duplicate check
		validations.push(...(await this.checkDuplicates(entry)))

		// Store validation results
		await Promise.all(
			validations.map((v) =>
				prisma.payrollValidation.create({
					data: {
						entryId,
						...v,
					},
				}),
			),
		)

		// Update entry status
		const hasCritical = validations.some(
			(v) => v.severity === 'CRITICAL' && !v.passed,
		)
		const hasFailures = validations.some((v) => !v.passed)

		let validationStatus: ValidationStatus
		if (hasCritical) {
			validationStatus = 'FAILED'
		} else if (hasFailures) {
			validationStatus = 'PASSED_WITH_WARNINGS'
		} else {
			validationStatus = 'PASSED'
		}

		await prisma.payrollEntry.update({
			where: { id: entryId },
			data: {
				validationStatus,
				status: validationStatus === 'PASSED' ? 'VALIDATED' : entry.status,
			},
		})

		return {
			entryId,
			status: validationStatus,
			validations,
			score: this.calculateScore(validations),
		}
	}

	async validateRequiredFields(entry: any) {
		const validations = []
		const requiredFields = [
			'employeeId',
			'department',
			'position',
			'baseRate',
			'regularHours',
		]

		requiredFields.forEach((field) => {
			const value = entry[field]
			validations.push({
				validationType: 'REQUIRED_FIELD',
				fieldName: field,
				actualValue: value?.toString() || 'null',
				passed: value !== null && value !== undefined && value !== '',
				severity: 'CRITICAL',
				message: value ? `${field} is present` : `${field} is required`,
			})
		})

		return validations
	}

	async validateRanges(entry: any) {
		const validations = []

		// Hours validation
		const totalHours = Number(entry.regularHours) + Number(entry.overtimeHours)
		validations.push({
			validationType: 'RANGE_CHECK',
			fieldName: 'totalHours',
			expectedValue: '≤ 96',
			actualValue: totalHours.toString(),
			passed: totalHours <= 96,
			severity: totalHours > 96 ? 'HIGH' : 'INFO',
			message:
				totalHours <= 96
					? 'Total hours within bi-weekly limit'
					: `Total hours (${totalHours}) exceeds bi-weekly limit of 96`,
		})

		// Rate validation
		const baseRate = Number(entry.baseRate)
		validations.push({
			validationType: 'RANGE_CHECK',
			fieldName: 'baseRate',
			expectedValue: '≥ 7.25',
			actualValue: baseRate.toString(),
			passed: baseRate >= 7.25,
			severity: baseRate < 7.25 ? 'CRITICAL' : 'INFO',
			message:
				baseRate >= 7.25
					? 'Base rate meets minimum wage'
					: `Base rate ($${baseRate}) below minimum wage`,
		})

		// Overtime validation
		const overtimeHours = Number(entry.overtimeHours)
		validations.push({
			validationType: 'RANGE_CHECK',
			fieldName: 'overtimeHours',
			expectedValue: '≤ 40',
			actualValue: overtimeHours.toString(),
			passed: overtimeHours <= 40,
			severity: overtimeHours > 40 ? 'MEDIUM' : 'INFO',
			message:
				overtimeHours <= 40
					? 'Overtime hours within limit'
					: `High overtime hours (${overtimeHours})`,
		})

		return validations
	}

	async validateCalculations(entry: any) {
		const validations = []

		// Recalculate to verify
		const expectedRegular = Number(entry.regularHours) * Number(entry.baseRate)
		const actualRegular = Number(entry.regularPay)

		validations.push({
			validationType: 'CALCULATION_CHECK',
			fieldName: 'regularPay',
			expectedValue: expectedRegular.toFixed(2),
			actualValue: actualRegular.toFixed(2),
			passed: Math.abs(expectedRegular - actualRegular) < 0.01,
			severity: 'HIGH',
			message:
				Math.abs(expectedRegular - actualRegular) < 0.01
					? 'Regular pay calculation correct'
					: `Regular pay mismatch: expected $${expectedRegular.toFixed(2)}, got $${actualRegular.toFixed(2)}`,
		})

		// Gross pay verification
		const expectedGross =
			Number(entry.regularPay) +
			Number(entry.overtimePay) +
			Number(entry.shiftPay) +
			Number(entry.holidayPay)
		const actualGross = Number(entry.grossPay)

		validations.push({
			validationType: 'CALCULATION_CHECK',
			fieldName: 'grossPay',
			expectedValue: expectedGross.toFixed(2),
			actualValue: actualGross.toFixed(2),
			passed: Math.abs(expectedGross - actualGross) < 0.01,
			severity: 'CRITICAL',
			message:
				Math.abs(expectedGross - actualGross) < 0.01
					? 'Gross pay calculation correct'
					: `Gross pay mismatch: expected $${expectedGross.toFixed(2)}, got $${actualGross.toFixed(2)}`,
		})

		return validations
	}

	async validateCompliance(entry: any) {
		const validations = []

		// FLSA overtime compliance
		const regularHours = Number(entry.regularHours)
		const overtimeHours = Number(entry.overtimeHours)
		const weeklyAverage = (regularHours + overtimeHours) / 2

		validations.push({
			validationType: 'COMPLIANCE_CHECK',
			fieldName: 'flsaCompliance',
			expectedValue: 'Overtime after 40 hours/week',
			actualValue:
				weeklyAverage > 40 && overtimeHours > 0
					? 'Compliant'
					: 'Check required',
			passed: weeklyAverage <= 40 || overtimeHours > 0,
			severity: 'HIGH',
			message:
				weeklyAverage <= 40 || overtimeHours > 0
					? 'FLSA overtime rules followed'
					: 'Potential FLSA overtime violation',
		})

		return validations
	}

	async checkDuplicates(entry: any) {
		const validations = []

		// Check for duplicate entries
		const duplicates = await prisma.payrollEntry.count({
			where: {
				payPeriodId: entry.payPeriodId,
				employeeId: entry.employeeId,
				id: { not: entry.id },
			},
		})

		validations.push({
			validationType: 'DUPLICATE_CHECK',
			fieldName: 'entry',
			expectedValue: '0 duplicates',
			actualValue: `${duplicates} duplicates`,
			passed: duplicates === 0,
			severity: duplicates > 0 ? 'CRITICAL' : 'INFO',
			message:
				duplicates === 0
					? 'No duplicate entries found'
					: `Found ${duplicates} duplicate entries for this employee`,
		})

		return validations
	}

	calculateScore(validations: any[]): number {
		const total = validations.length
		const passed = validations.filter((v) => v.passed).length
		return Math.round((passed / total) * 100)
	}
}
```

## Phase 4: Package & Submission (Week 7)

### Package Creation Service

```typescript
// app/services/payroll-package.server.ts

export class PayrollPackageService {
	async createPackage(payPeriodId: string, officerId: string) {
		// Check if all entries are ready
		const entries = await prisma.payrollEntry.findMany({
			where: { payPeriodId },
		})

		const notReady = entries.filter(
			(e) => !['CALCULATED', 'VALIDATED', 'COMPLETED'].includes(e.status),
		)

		if (notReady.length > 0) {
			throw new Error(`${notReady.length} entries are not ready for packaging`)
		}

		// Calculate totals
		const totals = await this.calculatePackageTotals(entries)

		// Get validation summary
		const validationSummary = await this.getValidationSummary(payPeriodId)

		// Create package
		const package = await prisma.payrollPackage.create({
			data: {
				payPeriodId,
				totalEmployees: entries.length,
				totalRegularHours: totals.regularHours,
				totalOvertimeHours: totals.overtimeHours,
				totalGrossPay: totals.grossPay,
				status: 'DRAFT',
				preparedBy: officerId,
				validationScore: validationSummary.score,
				validationPassed: validationSummary.passed,
				criticalIssues: validationSummary.criticalIssues,
				warnings: validationSummary.warnings,
			},
		})

		// Generate reports
		await this.generatePackageReports(package.id)

		return package
	}

	async calculatePackageTotals(entries: any[]) {
		return entries.reduce(
			(totals, entry) => ({
				regularHours: totals.regularHours + Number(entry.regularHours),
				overtimeHours: totals.overtimeHours + Number(entry.overtimeHours),
				grossPay: totals.grossPay + Number(entry.grossPay),
			}),
			{
				regularHours: 0,
				overtimeHours: 0,
				grossPay: 0,
			},
		)
	}

	async getValidationSummary(payPeriodId: string) {
		const validations = await prisma.payrollValidation.findMany({
			where: {
				entry: {
					payPeriodId,
				},
			},
		})

		const criticalIssues = validations.filter(
			(v) => v.severity === 'CRITICAL' && !v.passed && !v.resolved,
		).length

		const warnings = validations.filter(
			(v) => v.severity !== 'CRITICAL' && !v.passed && !v.resolved,
		).length

		const total = validations.length
		const passed = validations.filter((v) => v.passed || v.resolved).length

		return {
			score: Math.round((passed / total) * 100),
			passed: criticalIssues === 0,
			criticalIssues,
			warnings,
		}
	}

	async generatePackageReports(packageId: string) {
		// Generate summary report
		const summaryReport = await this.generateSummaryReport(packageId)

		// Generate exception report
		const exceptionReport = await this.generateExceptionReport(packageId)

		// Generate department breakdown
		const departmentReport = await this.generateDepartmentReport(packageId)

		// Store reports
		await prisma.payrollPackage.update({
			where: { id: packageId },
			data: {
				attachments: {
					summaryReport,
					exceptionReport,
					departmentReport,
				},
			},
		})
	}

	async submitToVerifier(packageId: string, officerId: string) {
		const package = await prisma.payrollPackage.findUnique({
			where: { id: packageId },
		})

		if (!package) {
			throw new Error('Package not found')
		}

		// Final validation
		if (!package.validationPassed) {
			throw new Error('Package has unresolved validation issues')
		}

		// Update package status
		const updatedPackage = await prisma.payrollPackage.update({
			where: { id: packageId },
			data: {
				status: 'SUBMITTED',
				submittedAt: new Date(),
				submittedTo: 'VERIFIER',
			},
		})

		// Lock all entries
		await prisma.payrollEntry.updateMany({
			where: { payPeriodId: package.payPeriodId },
			data: { status: 'SUBMITTED' },
		})

		// Create notification for Verifier
		await prisma.notification.create({
			data: {
				type: 'PAYROLL_READY_FOR_VERIFICATION',
				title: 'Payroll Package Ready for Review',
				message: `Payroll for ${package.totalEmployees} employees ready for verification`,
				targetRole: 'verifier',
				relatedId: packageId,
				priority: 'HIGH',
			},
		})

		// Log submission
		await this.logSubmission(packageId, officerId)

		return updatedPackage
	}

	async logSubmission(packageId: string, officerId: string) {
		await prisma.auditLog.create({
			data: {
				userId: officerId,
				userRole: 'payroll_officer',
				action: 'PACKAGE_SUBMITTED',
				target: packageId,
				details: {
					timestamp: new Date(),
					packageId,
					status: 'SUBMITTED_TO_VERIFIER',
				},
			},
		})
	}
}
```

## Phase 5: UI Implementation (Week 8-9)

### Main Dashboard Route

```typescript
// app/routes/payroll-officer.tsx

import { data, type LoaderFunctionArgs } from 'react-router'
import { requireUserWithRole } from '#app/utils/permissions.server'
import { PayrollOfficerDashboard } from '#app/components/payroll-officer/dashboard'

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserWithRole(request, 'payroll_officer')

  const currentPeriod = await getCurrentPayPeriod()
  const stats = await getOfficerStats(user.id, currentPeriod.id)
  const recentEntries = await getRecentEntries(user.id)
  const validationAlerts = await getValidationAlerts(currentPeriod.id)

  return data({
    user,
    currentPeriod,
    stats,
    recentEntries,
    validationAlerts
  })
}

export default function PayrollOfficerRoute() {
  const data = useLoaderData<typeof loader>()

  return <PayrollOfficerDashboard {...data} />
}
```

### Timesheet Processing Component

```tsx
// app/components/payroll-officer/timesheet-processor.tsx

export function TimesheetProcessor({ timesheets }: Props) {
	const [selectedTimesheets, setSelectedTimesheets] = useState<string[]>([])
	const [processing, setProcessing] = useState(false)
	const fetcher = useFetcher()

	const handleProcess = async () => {
		setProcessing(true)

		for (const timesheetId of selectedTimesheets) {
			fetcher.submit(
				{ _action: 'process', timesheetId },
				{ method: 'post', action: '/payroll-officer/timesheets' },
			)
		}
	}

	return (
		<div className="timesheet-processor">
			<div className="processor-header">
				<h2>Timesheet Queue</h2>
				<div className="actions">
					<Button
						onClick={handleProcess}
						disabled={selectedTimesheets.length === 0 || processing}
					>
						Process Selected ({selectedTimesheets.length})
					</Button>
				</div>
			</div>

			<AgGridReact
				rowData={timesheets}
				columnDefs={timesheetColumns}
				rowSelection="multiple"
				onSelectionChanged={(e) => {
					setSelectedTimesheets(e.api.getSelectedRows().map((r) => r.id))
				}}
				statusBar={{
					statusPanels: [
						{ statusPanel: 'agTotalRowCountComponent' },
						{ statusPanel: 'agSelectedRowCountComponent' },
					],
				}}
			/>
		</div>
	)
}
```

## Phase 6: Testing (Week 10)

### Unit Tests

```typescript
// app/services/payroll-calculator.test.ts

describe('PayrollCalculator', () => {
	let calculator: PayrollCalculator

	beforeEach(() => {
		calculator = new PayrollCalculator()
	})

	it('should calculate regular pay correctly', async () => {
		const entry = {
			regularHours: 80,
			baseRate: 15.0,
		}

		const result = await calculator.calculateRegularPay(entry)
		expect(result).toBe(1200.0)
	})

	it('should calculate overtime at 1.5x rate', async () => {
		const entry = {
			overtimeHours: 10,
			overtimeRate: 22.5, // 15 * 1.5
		}

		const result = await calculator.calculateOvertimePay(entry)
		expect(result).toBe(225.0)
	})

	it('should validate total hours limit', async () => {
		const validator = new PayrollValidator()
		const entry = {
			regularHours: 80,
			overtimeHours: 20, // Total: 100 hours
		}

		const validations = await validator.validateRanges(entry)
		const hoursValidation = validations.find(
			(v) => v.fieldName === 'totalHours',
		)

		expect(hoursValidation.passed).toBe(false)
		expect(hoursValidation.severity).toBe('HIGH')
	})
})
```

### E2E Tests

```typescript
// tests/e2e/payroll-officer-flow.spec.ts

test('Complete payroll processing flow', async ({ page }) => {
	// Login as payroll officer
	await loginAsPayrollOfficer(page)

	// Navigate to timesheets
	await page.goto('/payroll-officer/timesheets')

	// Select and process timesheets
	await page.click('[data-testid="select-all"]')
	await page.click('[data-testid="process-selected"]')

	// Wait for processing
	await page.waitForSelector('.processing-complete')

	// Navigate to calculations
	await page.goto('/payroll-officer/calculations')
	await page.click('[data-testid="calculate-all"]')

	// Validate entries
	await page.goto('/payroll-officer/validation')
	await expect(page.locator('.validation-score')).toContainText('100%')

	// Create and submit package
	await page.goto('/payroll-officer/submissions')
	await page.click('[data-testid="create-package"]')
	await page.click('[data-testid="submit-to-verifier"]')

	// Verify submission
	await expect(page.locator('.submission-success')).toBeVisible()
})
```

## Phase 7: Performance Optimization (Week 11)

### Batch Processing Optimization

```typescript
// app/utils/batch-processor.server.ts

export class BatchProcessor {
	async processBatch<T, R>(
		items: T[],
		processor: (item: T) => Promise<R>,
		options: {
			batchSize?: number
			concurrency?: number
			onProgress?: (processed: number, total: number) => void
		} = {},
	): Promise<R[]> {
		const { batchSize = 10, concurrency = 5, onProgress } = options

		const results: R[] = []
		const batches = this.createBatches(items, batchSize)

		for (let i = 0; i < batches.length; i++) {
			const batch = batches[i]
			const batchResults = await this.processWithConcurrency(
				batch,
				processor,
				concurrency,
			)

			results.push(...batchResults)

			if (onProgress) {
				onProgress(results.length, items.length)
			}
		}

		return results
	}

	private createBatches<T>(items: T[], size: number): T[][] {
		const batches: T[][] = []
		for (let i = 0; i < items.length; i += size) {
			batches.push(items.slice(i, i + size))
		}
		return batches
	}

	private async processWithConcurrency<T, R>(
		items: T[],
		processor: (item: T) => Promise<R>,
		concurrency: number,
	): Promise<R[]> {
		const results: R[] = []
		const executing: Promise<void>[] = []

		for (const item of items) {
			const promise = processor(item).then((result) => {
				results.push(result)
			})

			executing.push(promise)

			if (executing.length >= concurrency) {
				await Promise.race(executing)
				executing.splice(
					executing.findIndex((p) => p === promise),
					1,
				)
			}
		}

		await Promise.all(executing)
		return results
	}
}
```

## Phase 8: Deployment (Week 12)

### Deployment Checklist

```yaml
# deployment/payroll-officer-checklist.yaml

pre_deployment:
  database:
    - Run migrations
    - Create indexes
    - Set up backup schedule

  permissions:
    - Create payroll_officer role
    - Assign permissions
    - Set up test users

  configuration:
    - Set environment variables
    - Configure rate limits
    - Set up monitoring

deployment:
  steps:
    - Deploy to staging
    - Run smoke tests
    - Load test with sample data
    - Deploy to production
    - Monitor for 24 hours

post_deployment:
  validation:
    - Verify all routes accessible
    - Test timesheet processing
    - Test calculation accuracy
    - Test submission workflow

  training:
    - Conduct officer training
    - Provide documentation
    - Set up support channel

rollback_plan:
  triggers:
    - Critical errors in production
    - Data corruption
    - Performance degradation

  steps:
    - Revert code deployment
    - Restore database backup
    - Notify stakeholders
```

## Success Metrics

### Performance KPIs

- Data entry accuracy: > 99.5%
- Processing time per period: < 4 hours
- Calculation accuracy: 100%
- First-time submission success: > 95%

### Business KPIs

- Deadline compliance: 100%
- Rework rate: < 5%
- User satisfaction: > 4/5
- System uptime: > 99.9%

## Support Documentation

### User Manual Sections

1. Getting Started
2. Timesheet Processing
3. Data Entry Best Practices
4. Calculation Procedures
5. Validation and Error Resolution
6. Package Submission
7. Troubleshooting Guide

### Training Materials

- Video tutorials for each major function
- Interactive walkthrough for new users
- Quick reference cards
- Monthly best practices webinars

## Maintenance Plan

### Regular Maintenance

- Weekly: Clear temporary files, check logs
- Monthly: Performance analysis, user feedback review
- Quarterly: Security updates, feature enhancements
- Annually: Major version upgrades, architecture review

### Monitoring

- Real-time error tracking
- Performance metrics dashboard
- User activity analytics
- Audit log reviews
