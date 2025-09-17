# Comprehensive Leave Management Workflow System

## System Overview

```typescript
interface LeaveManagementSystem {
	purpose: 'Centralized leave administration for all employee types'
	scope: {
		coverage: ['Guards', 'Regular Employees', 'Executives', 'Contractual']
		processes: [
			'Application',
			'Approval',
			'Balance Tracking',
			'Payroll Integration',
		]
		compliance: ['Labor Code', 'Company Policy', 'Government Mandates']
	}
}
```

## Database Schema

```prisma
// Leave Configuration
model LeaveType {
  id                String   @id @default(cuid())
  code              String   @unique // VL, SL, EL, ML, PL, BL, LWOP
  name              String   // Vacation Leave, Sick Leave, etc.
  description       String?
  isPaid            Boolean  @default(true)
  requiresDocument  Boolean  @default(false)
  documentDays      Int?     // After how many days document required
  advanceNotice     Int?     // Required advance notice in days
  maxDaysPerYear    Float?   // Maximum days allowed per year
  isStatutory       Boolean  @default(false) // Required by law
  allowNegative     Boolean  @default(false) // Allow negative balance
  active            Boolean  @default(true)

  // Relationships
  entitlements      LeaveEntitlement[]
  applications      LeaveApplication[]
  balances          LeaveBalance[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Leave Entitlement Rules
model LeaveEntitlement {
  id                String   @id @default(cuid())
  employeeTypeId    String
  leaveTypeId       String

  // Entitlement Configuration
  annualEntitlement Float    // Days per year
  accrualRate       Float?   // Days per month (if monthly accrual)
  accrualStart      String   // HIRE_DATE or CALENDAR_YEAR
  carryOverLimit    Float?   // Maximum days to carry over
  expiryMonths      Int?     // Months before unused leaves expire
  probationDays     Int      @default(0) // Days before eligible

  // Monetization Rules
  canMonetize       Boolean  @default(false)
  maxMonetizeDays   Float?
  monetizationRate  Float    @default(1.0) // Multiplier for monetization

  // Relationships
  employeeType      EmployeeType @relation(fields: [employeeTypeId], references: [id])
  leaveType         LeaveType @relation(fields: [leaveTypeId], references: [id])

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([employeeTypeId, leaveTypeId])
}

// Employee Leave Balance
model LeaveBalance {
  id                String   @id @default(cuid())
  employeeId        String
  leaveTypeId       String
  year              Int

  // Balance Tracking
  entitlement       Float    // Total entitled for the year
  earned            Float    // Accrued/earned to date
  carriedOver       Float    @default(0) // From previous year
  adjusted          Float    @default(0) // Manual adjustments
  used              Float    @default(0) // Approved and taken
  pending           Float    @default(0) // Pending approval
  available         Float    // Calculated: earned + carriedOver + adjusted - used - pending
  forfeited         Float    @default(0) // Expired/forfeited leaves
  monetized         Float    @default(0) // Converted to cash

  // Relationships
  employee          Employee @relation(fields: [employeeId], references: [id])
  leaveType         LeaveType @relation(fields: [leaveTypeId], references: [id])
  transactions      LeaveTransaction[]

  lastCalculated    DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([employeeId, leaveTypeId, year])
  @@index([employeeId, year])
}

// Leave Application
model LeaveApplication {
  id                String   @id @default(cuid())
  applicationNumber String   @unique // Auto-generated: LV-2025-0001
  employeeId        String
  leaveTypeId       String

  // Leave Details
  startDate         DateTime
  endDate           DateTime
  numberOfDays      Float    // Can be 0.5 for half-day
  isHalfDay         Boolean  @default(false)
  halfDayPeriod     String?  // AM or PM

  // Application Info
  reason            String   @db.Text
  contactDuring     String?  // Contact number during leave
  address           String?  // Address during leave

  // Coverage/Backup
  backupEmployeeId  String?  // Suggested backup person
  handoverNotes     String?  @db.Text

  // Status Tracking
  status            LeaveStatus @default(DRAFT)
  submittedAt       DateTime?

  // Approval Chain
  level1ApproverId  String?  // Immediate supervisor
  level1Status      ApprovalStatus?
  level1Comments    String?
  level1Date        DateTime?

  level2ApproverId  String?  // Department head
  level2Status      ApprovalStatus?
  level2Comments    String?
  level2Date        DateTime?

  level3ApproverId  String?  // HR
  level3Status      ApprovalStatus?
  level3Comments    String?
  level3Date        DateTime?

  // Final Processing
  hrProcessedBy     String?
  hrProcessedAt     DateTime?
  payrollProcessed  Boolean  @default(false)

  // Cancellation
  isCancelled       Boolean  @default(false)
  cancelledBy       String?
  cancelledAt       DateTime?
  cancellationReason String?

  // Relationships
  employee          Employee @relation(fields: [employeeId], references: [id])
  leaveType         LeaveType @relation(fields: [leaveTypeId], references: [id])
  backupEmployee    Employee? @relation("BackupEmployee", fields: [backupEmployeeId], references: [id])
  documents         LeaveDocument[]
  transactions      LeaveTransaction[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([employeeId, status])
  @@index([startDate, endDate])
}

// Leave Documents
model LeaveDocument {
  id                String   @id @default(cuid())
  applicationId     String
  documentType      String   // Medical Certificate, Death Certificate, etc.
  fileName          String
  fileUrl           String
  fileSize          Int
  uploadedBy        String

  // Verification
  isVerified        Boolean  @default(false)
  verifiedBy        String?
  verifiedAt        DateTime?
  verificationNotes String?

  // Relationships
  application       LeaveApplication @relation(fields: [applicationId], references: [id])

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Leave Transactions (Audit Trail)
model LeaveTransaction {
  id                String   @id @default(cuid())
  employeeId        String
  leaveTypeId       String
  balanceId         String
  applicationId     String?

  // Transaction Details
  transactionType   LeaveTransactionType
  transactionDate   DateTime
  days              Float    // Positive for credit, negative for debit
  balanceBefore     Float
  balanceAfter      Float

  // Context
  description       String
  reference         String?  // Reference number
  performedBy       String

  // Relationships
  employee          Employee @relation(fields: [employeeId], references: [id])
  leaveType         LeaveType @relation(fields: [leaveTypeId], references: [id])
  balance           LeaveBalance @relation(fields: [balanceId], references: [id])
  application       LeaveApplication? @relation(fields: [applicationId], references: [id])

  createdAt         DateTime @default(now())

  @@index([employeeId, transactionDate])
  @@index([applicationId])
}

// Enums
enum LeaveStatus {
  DRAFT
  SUBMITTED
  APPROVED_L1    // Approved by immediate supervisor
  APPROVED_L2    // Approved by department head
  APPROVED_L3    // Approved by HR
  FULLY_APPROVED
  REJECTED
  CANCELLED
  TAKEN         // Leave period completed
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  RETURNED      // Sent back for clarification
}

enum LeaveTransactionType {
  OPENING_BALANCE
  MONTHLY_ACCRUAL
  LEAVE_TAKEN
  LEAVE_CANCELLED
  ADJUSTMENT_CREDIT
  ADJUSTMENT_DEBIT
  CARRY_OVER
  FORFEITURE
  MONETIZATION
}

// Leave Calendar for visibility
model LeaveCalendar {
  id                String   @id @default(cuid())
  employeeId        String
  date              DateTime
  leaveTypeId       String
  applicationId     String
  status            String   // Approved, Pending
  isHoliday         Boolean  @default(false)

  // For team visibility
  departmentId      String
  teamId            String?

  createdAt         DateTime @default(now())

  @@unique([employeeId, date])
  @@index([departmentId, date])
  @@index([teamId, date])
}
```

## Leave Application UI Workflow

```typescript
interface LeaveApplicationUI {
	employeePortal: {
		dashboard: {
			widgets: [
				{
					title: 'Leave Balance Summary'
					display: 'circular-progress-charts'
					data: 'current-year-balances'
				},
				{
					title: 'Upcoming Leaves'
					display: 'calendar-view'
					filter: 'next-30-days'
				},
				{
					title: 'Recent Applications'
					display: 'status-cards'
					limit: 5
				},
			]
		}

		applicationForm: {
			step1_SelectType: {
				display: 'card-selection'
				showBalance: true
				disableIfNoBalance: true

				validation: {
					checkBalance: true
					checkBlackoutDates: true
					checkMinimumNotice: true
				}
			}

			step2_SelectDates: {
				calendar: {
					showHolidays: true
					showTeamLeaves: true
					disableWeekends: 'optional'
					disablePastDates: true
				}

				halfDayOption: {
					enabled: true
					periods: ['Morning (AM)', 'Afternoon (PM)']
				}

				autoCalculation: {
					workingDays: 'exclude weekends and holidays'
					display: 'real-time calculation'
				}
			}

			step3_ProvideDetails: {
				fields: [
					{
						name: 'reason'
						type: 'textarea'
						required: true
						maxLength: 500
					},
					{
						name: 'contactNumber'
						type: 'tel'
						required: 'for leaves > 3 days'
					},
					{
						name: 'address'
						type: 'textarea'
						required: 'for leaves > 5 days'
					},
					{
						name: 'backupPerson'
						type: 'employee-search'
						filter: 'same-department'
						optional: true
					},
					{
						name: 'handoverNotes'
						type: 'rich-text'
						optional: true
					},
				]

				attachments: {
					required: 'conditional'
					conditions: [
						'Sick leave > 2 days',
						'Bereavement leave',
						'Special leaves',
					]

					types: ['PDF', 'Image']
					maxSize: '5MB'
					multiple: true
				}
			}

			step4_Review: {
				summary: {
					show: [
						'Leave type and balance',
						'Date range and days',
						'Reason',
						'Backup arrangement',
						'Approval chain',
					]
				}

				actions: {
					submit: 'Send for approval'
					saveDraft: 'Save for later'
					cancel: 'Discard application'
				}
			}
		}
	}
}
```

## Approval Workflow Engine

```typescript
interface ApprovalWorkflowEngine {
	configuration: {
		approvalMatrix: {
			byLeaveType: {
				vacation: {
					'1-2 days': ['Immediate Supervisor']
					'3-5 days': ['Immediate Supervisor', 'Department Head']
					'6+ days': ['Immediate Supervisor', 'Department Head', 'HR']
				}

				sick: {
					'1-2 days': ['Immediate Supervisor']
					'3+ days': ['Immediate Supervisor', 'HR'] // HR validates medical cert
				}

				emergency: {
					all: ['Immediate Supervisor', 'HR'] // HR validates documentation
				}

				maternity_paternity: {
					all: ['HR', 'Department Head'] // HR validates eligibility
				}
			}

			byEmployeeLevel: {
				staff: 'Standard approval chain'
				supervisor: 'Skip immediate, go to department head'
				manager: 'Department head + HR'
				executive: 'CEO approval required'
			}
		}
	}

	approverInterface: {
		dashboard: {
			pendingApprovals: {
				display: 'priority-sorted-list'

				card: {
					employee: 'Photo + Name + Position'
					leave: 'Type + Dates + Days'
					urgency: 'Days until start'
					teamImpact: 'Others on leave'

					quickActions: ['Approve', 'Reject', 'View Details']
				}

				bulkActions: {
					enabled: true
					options: ['Approve Selected', 'Reject Selected']
				}
			}

			detailView: {
				sections: [
					{
						title: 'Application Details'
						content: 'Full application form'
					},
					{
						title: 'Employee History'
						content: {
							leavesTaken: 'Current year'
							attendance: 'Last 3 months'
							previousApplications: 'Last 5'
						}
					},
					{
						title: 'Team Impact'
						content: {
							teamCalendar: 'Show conflicts'
							coverage: 'Backup person availability'
							workload: 'Current projects'
						}
					},
					{
						title: 'Documents'
						content: 'Attached files with preview'
					},
				]

				actions: {
					approve: {
						button: 'Approve'
						withComments: 'optional'
						autoRoute: 'to next approver'
					}

					reject: {
						button: 'Reject'
						withReason: 'required'
						notifyEmployee: 'immediate'
					}

					return: {
						button: 'Return for Clarification'
						withQuestions: 'required'
						allowResubmit: true
					}

					delegate: {
						button: 'Forward'
						selectApprover: 'from authorized list'
						withNote: 'optional'
					}
				}
			}
		}

		mobileApp: {
			pushNotifications: true
			quickApprove: 'swipe or face ID'
			offlineQueue: 'sync when online'
		}
	}
}
```

## Leave Balance Management

```typescript
interface LeaveBalanceManagement {
	accrualEngine: {
		monthlyJob: {
			schedule: '1st day of month, 12:00 AM'

			process: {
				1: 'Identify eligible employees'
				2: 'Calculate accrual based on rules'
				3: 'Check employment status changes'
				4: 'Apply proration if needed'
				5: 'Update leave balances'
				6: 'Create transaction records'
				7: 'Send notifications'
			}

			calculations: {
				regular: {
					formula: 'Annual_Entitlement / 12'
					proration: 'Days_Worked / Days_In_Month'
				}

				probationary: {
					eligible: false
					startAccrual: 'after probation'
				}

				newHire: {
					firstMonth: 'Prorated from hire date'
					formula: '(Days_In_Month - Hire_Date + 1) / Days_In_Month × Monthly_Accrual'
				}

				resignation: {
					lastMonth: 'Prorated to last day'
					formula: 'Last_Working_Day / Days_In_Month × Monthly_Accrual'
				}
			}
		}

		yearEndProcessing: {
			schedule: 'December 31, 11:59 PM'

			tasks: {
				carryOver: {
					process: 'Move unused balance to next year'
					limit: 'As per policy'
					excess: 'Forfeit or monetize'
				}

				forfeiture: {
					identify: 'Leaves beyond carry-over limit'
					notify: 'Employee and HR'
					process: 'Zero out excess'
				}

				monetization: {
					eligible: 'Vacation leaves only'
					limit: 'Max 10 days'
					rate: 'Daily rate × days'
					process: 'Add to December payroll'
				}

				reset: {
					initializeNewYear: true
					setOpeningBalance: 'Carry-over amount'
					resetAccruals: true
				}
			}
		}
	}

	adjustments: {
		scenarios: [
			{
				type: 'Policy Change'
				example: 'Increase VL from 15 to 18 days'
				process: 'Bulk update with audit trail'
			},
			{
				type: 'Error Correction'
				example: 'Wrong accrual calculated'
				process: 'Manual adjustment with approval'
			},
			{
				type: 'Special Grant'
				example: 'Compassionate leave'
				process: 'HR Manager approval required'
			},
			{
				type: 'Transfer Credit'
				example: 'From previous employer'
				process: 'With supporting documents'
			},
		]

		workflow: {
			request: 'HR Officer initiates'
			approval: 'HR Manager approves'
			audit: 'All adjustments logged'
			notification: 'Employee informed'
		}
	}
}
```

## Integration with Payroll

```typescript
interface LeavePayrollIntegration {
	payrollImpact: {
		paidLeaves: {
			calculation: 'No salary deduction'
			types: ['VL', 'SL', 'EL', 'ML', 'PL', 'BL']

			processing: {
				validate: 'Check leave approval status'
				verify: 'Match with attendance records'
				flag: 'Mark as paid leave in payroll'
			}
		}

		unpaidLeaves: {
			calculation: {
				daily: 'Monthly_Salary / Working_Days_In_Month'
				hourly: 'Daily_Rate / 8'

				deduction: 'Days_LWOP × Daily_Rate'
			}

			types: ['LWOP', 'Excessive absence']

			impactOn: {
				basicPay: 'Reduced'
				allowances: 'May be affected'
				thirteenthMonth: 'Prorated'
				benefits: 'Review eligibility'
			}
		}
	}

	dataExchange: {
		toPayroll: {
			frequency: 'Per payroll cut-off'

			data: [
				{
					field: 'approvedLeaves'
					format: 'Employee ID, Leave Type, Dates, Days'
				},
				{
					field: 'lwopDays'
					format: 'Employee ID, LWOP Days, Amount'
				},
				{
					field: 'monetizedLeaves'
					format: 'Employee ID, Days, Amount'
				},
			]

			validation: {
				crossCheck: 'With attendance data'
				reconcile: 'Any discrepancies'
				approve: 'Before payroll run'
			}
		}

		fromPayroll: {
			confirmation: 'Leaves processed'
			discrepancies: 'List of issues'
			queries: 'Clarifications needed'
		}
	}
}
```

## Reporting and Analytics

```typescript
interface LeaveReporting {
	standardReports: {
		leaveBalanceReport: {
			frequency: 'On-demand'
			filters: ['Department', 'Employee Type', 'Leave Type']

			columns: [
				'Employee Name',
				'Leave Type',
				'Entitlement',
				'Used',
				'Pending',
				'Available',
				'Expiring',
			]

			export: ['PDF', 'Excel', 'CSV']
		}

		leaveUtilization: {
			metrics: [
				'Average days taken per employee',
				'Leave type distribution',
				'Peak leave periods',
				'Unplanned vs planned leaves',
			]

			visualization: ['Bar charts', 'Pie charts', 'Heat maps', 'Trend lines']
		}

		absenteeismReport: {
			track: [
				'Unauthorized absences',
				'Sick leave patterns',
				'Monday/Friday syndrome',
				'Department comparison',
			]

			alerts: {
				threshold: 'Configurable'
				notification: 'HR and Management'
			}
		}
	}

	analytics: {
		predictive: {
			burnoutRisk: {
				indicators: [
					'No leaves taken > 6 months',
					'High overtime hours',
					'Increased sick leaves',
				]

				action: 'Alert HR for intervention'
			}

			staffingForecast: {
				analyze: 'Historical leave patterns'
				predict: 'Future staffing needs'
				recommend: 'Optimal scheduling'
			}
		}

		compliance: {
			statutory: {
				check: 'Minimum leave requirements'
				flag: 'Non-compliance'
				report: 'Government submission'
			}

			policy: {
				monitor: 'Policy adherence'
				identify: 'Exceptions'
				audit: 'Trail completeness'
			}
		}
	}

	dashboards: {
		hr: {
			widgets: [
				'Leave requests pending',
				"Today's absences",
				'Upcoming leaves (week)',
				'Leave liability (monetary)',
				'Expiring leaves alert',
			]
		}

		manager: {
			widgets: [
				'Team availability',
				'Pending approvals',
				'Team leave calendar',
				'Coverage gaps',
			]
		}

		employee: {
			widgets: [
				'My leave balance',
				'Application status',
				'Team calendar',
				'Holiday calendar',
			]
		}
	}
}
```

## Mobile Application Features

```typescript
interface LeaveMobileApp {
	features: {
		quickApply: {
			widget: 'Home screen widget'
			voiceCommand: 'Apply for leave'
			templates: 'Saved leave applications'
		}

		notifications: {
			types: [
				'Application approved/rejected',
				'Approval required',
				'Leave balance update',
				'Expiring leaves reminder',
			]

			customization: {
				quiet_hours: true
				importance_levels: true
				sound_selection: true
			}
		}

		offlineMode: {
			viewBalance: 'Cached data'
			draftApplication: 'Save locally'
			syncOnConnect: 'Automatic'
		}

		teamView: {
			calendar: "Who's on leave"
			coverage: 'Backup assignments'
			contact: 'Quick call/message'
		}
	}

	security: {
		biometric: ['Fingerprint', 'Face ID']
		sessionTimeout: '15 minutes'
		dataEncryption: 'At rest and in transit'
	}
}
```

## Special Leave Scenarios

```typescript
interface SpecialLeaveScenarios {
	maternity: {
		eligibility: {
			requirements: [
				'Female employee',
				'SSS contributions',
				'Medical certificate',
			]

			duration: {
				normal: 105 // days
				cesarean: 105 // days (same as normal now)
				miscarriage: 60 // days
			}
		}

		processing: {
			advance_filing: 'At least 30 days'
			documents: [
				'MAT-1 form',
				'Ultrasound/Medical cert',
				'SSS maternity notification',
			]

			benefits: {
				sss: 'Full maternity benefit'
				company_topup: 'If salary > SSS benefit'
			}
		}
	}

	calamity: {
		trigger: 'Government declaration'
		automatic_grant: '5 days'
		affected_areas: 'As declared'
		documentation: 'Proof of residence'
	}

	quarantine: {
		covid_related: true
		with_pay: 'If with medical certificate'
		work_from_home: 'If capable'
		duration: 'As per DOH guidelines'
	}

	jury_duty: {
		with_pay: true
		documentation: 'Court summons'
		no_limit: true
	}

	rehabilitation: {
		drug_alcohol: 'As per company policy'
		with_pay: 'First occurrence only'
		max_days: 180
		requirements: 'Rehab facility certification'
	}
}
```
