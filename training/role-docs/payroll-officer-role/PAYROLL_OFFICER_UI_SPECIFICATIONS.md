# Payroll Officer UI Specifications

## Visual Identity

### Color Scheme

- **Primary Color**: Teal (#0f766e)
- **Secondary Color**: Cyan (#06b6d4)
- **Accent Color**: Emerald (#10b981)
- **Alert Color**: Yellow (#facc15)
- **Error Color**: Red (#ef4444)
- **Background**: White (#ffffff)
- **Surface**: Light Gray (#f9fafb)

### Role Badge

```tsx
<Badge className="bg-teal-700 text-white">
	<Calculator className="mr-1 h-4 w-4" />
	Payroll Officer
</Badge>
```

## Dashboard Layout

### Header Section

```tsx
interface PayrollOfficerHeader {
	title: 'Payroll Processing Center'
	subtitle: 'Data Entry & Initial Processing'
	userInfo: {
		name: string
		role: 'Payroll Officer'
		department: 'Payroll'
		currentPeriod: string
		lastActivity: Date
	}
	quickStats: {
		timesheetsReceived: number
		entriesCompleted: number
		pendingCalculations: number
		readyForSubmission: number
	}
}
```

### Main Dashboard Grid

```tsx
interface DashboardLayout {
	layout: 'grid'
	sections: [
		{
			id: 'current-period'
			title: 'Current Pay Period'
			size: 'full-width'
			content: CurrentPeriodSummary
		},
		{
			id: 'quick-actions'
			title: 'Quick Actions'
			size: '1/3'
			content: QuickActionButtons
		},
		{
			id: 'progress-tracker'
			title: 'Processing Progress'
			size: '2/3'
			content: ProgressTracker
		},
		{
			id: 'recent-entries'
			title: 'Recent Entries'
			size: '1/2'
			content: RecentEntriesTable
		},
		{
			id: 'validation-alerts'
			title: 'Validation Alerts'
			size: '1/2'
			content: ValidationAlerts
		},
	]
}
```

## Navigation Structure

### Primary Navigation

```tsx
const payrollOfficerMenu = [
	{
		icon: <FileText />,
		label: 'Timesheets',
		badge: unprocessedCount,
		route: '/payroll-officer/timesheets',
		subMenu: [
			{ label: 'Pending', route: '/timesheets/pending' },
			{ label: 'In Progress', route: '/timesheets/in-progress' },
			{ label: 'Completed', route: '/timesheets/completed' },
		],
	},
	{
		icon: <Calculator />,
		label: 'Calculations',
		route: '/payroll-officer/calculations',
		subMenu: [
			{ label: 'Regular Pay', route: '/calculations/regular' },
			{ label: 'Overtime', route: '/calculations/overtime' },
			{ label: 'Deductions', route: '/calculations/deductions' },
		],
	},
	{
		icon: <Users />,
		label: 'Employee Data',
		route: '/payroll-officer/employees',
	},
	{
		icon: <CheckSquare />,
		label: 'Validation',
		badge: issuesCount,
		route: '/payroll-officer/validation',
	},
	{
		icon: <Package />,
		label: 'Submissions',
		route: '/payroll-officer/submissions',
	},
	{
		icon: <BarChart />,
		label: 'Reports',
		route: '/payroll-officer/reports',
	},
]
```

## Timesheet Processing Interface

### Timesheet Queue

```tsx
interface TimesheetQueue {
	filters: {
		status: 'pending' | 'in-progress' | 'completed' | 'issues'
		department: string[]
		dateRange: DateRange
		urgency: 'normal' | 'urgent' | 'critical'
	}

	columns: [
		{ field: 'select'; type: 'checkbox'; width: 40 },
		{ field: 'employeeId'; header: 'Employee ID'; width: 100 },
		{ field: 'employeeName'; header: 'Name'; width: 200 },
		{ field: 'department'; header: 'Department'; width: 150 },
		{ field: 'period'; header: 'Period'; width: 120 },
		{ field: 'regularHours'; header: 'Regular'; width: 80 },
		{ field: 'overtimeHours'; header: 'OT'; width: 80 },
		{ field: 'status'; header: 'Status'; width: 100; badge: true },
		{ field: 'approvals'; header: 'Approvals'; width: 120 },
		{ field: 'actions'; header: 'Actions'; width: 150 },
	]

	bulkActions: {
		selectAll: boolean
		processSelected: () => void
		validateSelected: () => void
		exportSelected: () => void
	}

	rowActions: {
		view: (id: string) => void
		edit: (id: string) => void
		validate: (id: string) => void
		flag: (id: string) => void
	}
}
```

### Timesheet Entry Form

```tsx
interface TimesheetEntryForm {
  layout: "tabbed"

  tabs: {
    basic: {
      label: "Basic Information"
      fields: [
        { name: "employeeId", type: "select", required: true },
        { name: "payPeriod", type: "date-range", required: true },
        { name: "department", type: "select", required: true },
        { name: "position", type: "text", readonly: true },
        { name: "payGrade", type: "text", readonly: true }
      ]
    }

    hours: {
      label: "Hours Worked"
      sections: {
        regular: {
          title: "Regular Hours"
          fields: [
            { name: "weekOneRegular", type: "number", max: 40 },
            { name: "weekTwoRegular", type: "number", max: 40 },
            { name: "totalRegular", type: "calculated", readonly: true }
          ]
        }
        overtime: {
          title: "Overtime Hours"
          fields: [
            { name: "weekOneOvertime", type: "number" },
            { name: "weekTwoOvertime", type: "number" },
            { name: "totalOvertime", type: "calculated", readonly: true }
          ]
        }
        special: {
          title: "Special Hours"
          fields: [
            { name: "holidayHours", type: "number" },
            { name: "sickLeave", type: "number" },
            { name: "vacation", type: "number" },
            { name: "otherLeave", type: "number" }
          ]
        }
      }
    }

    calculations: {
      label: "Pay Calculations"
      display: "readonly"
      sections: {
        rates: {
          title: "Pay Rates"
          fields: [
            { name: "baseRate", type: "currency" },
            { name: "overtimeRate", type: "currency" },
            { name: "shiftDifferential", type: "currency" }
          ]
        }
        amounts: {
          title: "Calculated Amounts"
          fields: [
            { name: "regularPay", type: "currency" },
            { name: "overtimePay", type: "currency" },
            { name: "shiftPay", type: "currency" },
            { name: "grossPay", type: "currency", highlight: true }
          ]
        }
      }
    }

    validation: {
      label: "Validation"
      sections: {
        approvals: {
          title: "Approval Status"
          fields: [
            { name: "supervisorApproval", type: "status-badge" },
            { name: "hrApproval", type: "status-badge" },
            { name: "approvalDate", type: "date", readonly: true }
          ]
        }
        checks: {
          title: "Validation Checks"
          display: "checklist"
          items: [
            "Hours within limits",
            "Rates verified",
            "Calculations accurate",
            "Documentation complete"
          ]
        }
      }
    }
  }

  actions: {
    save: { label: "Save Draft", icon: <Save /> }
    validate: { label: "Validate", icon: <CheckCircle /> }
    calculate: { label: "Calculate", icon: <Calculator /> }
    submit: { label: "Mark Complete", icon: <Send /> }
    cancel: { label: "Cancel", icon: <X /> }
  }
}
```

## Calculation Interface

### Calculation Dashboard

```tsx
interface CalculationDashboard {
	summary: {
		totalEmployees: number
		totalRegularHours: number
		totalOvertimeHours: number
		totalGrossPay: number
		averagePayPerEmployee: number
	}

	breakdownChart: {
		type: 'pie'
		data: [
			{ label: 'Regular Pay'; value: number; color: '#0f766e' },
			{ label: 'Overtime Pay'; value: number; color: '#06b6d4' },
			{ label: 'Shift Differential'; value: number; color: '#10b981' },
			{ label: 'Holiday Pay'; value: number; color: '#facc15' },
		]
	}

	departmentGrid: {
		columns: [
			'Department',
			'Employees',
			'Regular Hours',
			'OT Hours',
			'Total Pay',
		]
		sortable: true
		exportable: true
	}
}
```

### Batch Calculation Tool

```tsx
interface BatchCalculator {
	selection: {
		criteria: 'all' | 'department' | 'custom'
		filters: {
			department?: string[]
			employeeIds?: string[]
			status?: string[]
		}
	}

	preview: {
		affectedRecords: number
		estimatedTime: string
		lastRun: Date
	}

	options: {
		validateFirst: boolean
		stopOnError: boolean
		generateReport: boolean
		notifyOnComplete: boolean
	}

	progress: {
		display: 'progress-bar'
		current: number
		total: number
		errors: number
		timeRemaining: string
	}

	results: {
		processed: number
		successful: number
		failed: number
		errors: Error[]
		report: CalculationReport
	}
}
```

## Validation Interface

### Validation Dashboard

```tsx
interface ValidationDashboard {
	statistics: {
		totalValidated: number
		passedValidation: number
		failedValidation: number
		pendingReview: number
		successRate: number
	}

	issuesList: {
		priority: 'high' | 'medium' | 'low'
		issues: [
			{
				id: string
				type: 'calculation' | 'data' | 'compliance'
				severity: 'critical' | 'warning' | 'info'
				description: string
				affectedEmployee: string
				suggestedAction: string
				status: 'open' | 'resolved' | 'escalated'
			},
		]

		actions: {
			resolve: (id: string) => void
			escalate: (id: string) => void
			bulkResolve: (ids: string[]) => void
		}
	}

	validationRules: {
		categories: [
			{
				name: 'Hours Validation'
				rules: ValidationRule[]
				enabled: boolean
			},
			{
				name: 'Rate Validation'
				rules: ValidationRule[]
				enabled: boolean
			},
			{
				name: 'Calculation Validation'
				rules: ValidationRule[]
				enabled: boolean
			},
		]
	}
}
```

### Validation Result Display

```tsx
interface ValidationResult {
	summary: {
		status: 'passed' | 'failed' | 'warning'
		score: number
		timestamp: Date
		validator: string
	}

	details: {
		checksPerformed: [
			{
				name: string
				result: 'pass' | 'fail' | 'warning'
				message?: string
				value?: any
				expected?: any
			},
		]
	}

	actions: {
		accept: boolean
		reject: boolean
		override: boolean
		requestReview: boolean
	}

	visualization: {
		type: 'status-grid'
		layout: '3x3'
		cells: ValidationCell[]
	}
}
```

## Employee Data Management

### Employee List View

```tsx
interface EmployeeListView {
	searchBar: {
		placeholder: 'Search by name, ID, or department'
		filters: {
			status: 'active' | 'inactive' | 'all'
			department: string[]
			payGrade: string[]
		}
	}

	grid: {
		columns: [
			{ field: 'employeeId'; header: 'ID'; width: 80 },
			{ field: 'fullName'; header: 'Name'; width: 200 },
			{ field: 'department'; header: 'Department'; width: 150 },
			{ field: 'position'; header: 'Position'; width: 150 },
			{ field: 'payGrade'; header: 'Grade'; width: 80 },
			{ field: 'baseRate'; header: 'Rate'; width: 100 },
			{ field: 'status'; header: 'Status'; width: 100; badge: true },
			{ field: 'lastPayroll'; header: 'Last Payroll'; width: 120 },
			{ field: 'actions'; header: 'Actions'; width: 100 },
		]

		features: {
			sorting: true
			filtering: true
			pagination: true
			export: ['csv', 'excel']
		}
	}

	quickActions: {
		addNew: 'Add Employee'
		import: 'Import CSV'
		export: 'Export All'
		sync: 'Sync with HR'
	}
}
```

### Employee Detail Panel

```tsx
interface EmployeeDetailPanel {
	layout: 'sidebar'

	header: {
		avatar: string
		name: string
		employeeId: string
		badge: 'active' | 'inactive'
	}

	sections: [
		{
			title: 'Basic Information'
			fields: EmployeeBasicInfo
			editable: false
		},
		{
			title: 'Payroll Information'
			fields: PayrollInfo
			editable: true
		},
		{
			title: 'Recent Payroll History'
			type: 'table'
			data: PayrollHistory[]
		},
		{
			title: 'Documents'
			type: 'file-list'
			files: Document[]
		},
	]

	actions: {
		edit: boolean
		viewHistory: boolean
		generateReport: boolean
		close: boolean
	}
}
```

## Submission Interface

### Submission Preparation

```tsx
interface SubmissionPreparation {
	checklist: {
		title: 'Pre-Submission Checklist'
		items: [
			{ label: 'All timesheets processed'; checked: boolean },
			{ label: 'Calculations completed'; checked: boolean },
			{ label: 'Validation passed'; checked: boolean },
			{ label: 'Exceptions resolved'; checked: boolean },
			{ label: 'Reports generated'; checked: boolean },
			{ label: 'Documentation complete'; checked: boolean },
		]
		allRequired: true
	}

	packageSummary: {
		payPeriod: string
		totalEmployees: number
		totalAmount: number
		processingTime: string
		preparedBy: string
		preparedAt: Date
	}

	attachments: {
		required: [
			'Payroll Summary Report',
			'Exception Report',
			'Validation Report',
		]
		optional: ['Supporting Documents', 'Adjustment Notes']
		uploadedFiles: File[]
	}

	reviewPanel: {
		type: 'collapsible'
		sections: [
			'Summary Statistics',
			'Department Breakdown',
			'Notable Changes',
			'Pending Issues',
		]
	}

	actions: {
		savePackage: 'Save as Draft'
		validatePackage: 'Final Validation'
		submitToVerifier: 'Submit to Verifier'
		cancel: 'Cancel'
	}
}
```

### Submission History

```tsx
interface SubmissionHistory {
	filters: {
		dateRange: DateRange
		status: 'submitted' | 'accepted' | 'rejected' | 'all'
		verifier: string
	}

	timeline: {
		view: 'list' | 'calendar'
		entries: [
			{
				id: string
				payPeriod: string
				submittedAt: Date
				status: string
				verifier: string
				turnaroundTime: string
				feedback?: string
			},
		]
	}

	metrics: {
		averageTurnaround: string
		acceptanceRate: number
		commonIssues: string[]
	}
}
```

## Reports Interface

### Report Generator

```tsx
interface ReportGenerator {
	templates: [
		{
			id: 'payroll-summary'
			name: 'Payroll Summary Report'
			description: 'Overall payroll statistics'
			parameters: ReportParameters
		},
		{
			id: 'exception-report'
			name: 'Exception Report'
			description: 'Validation issues and anomalies'
			parameters: ReportParameters
		},
		{
			id: 'department-breakdown'
			name: 'Department Breakdown'
			description: 'Payroll by department'
			parameters: ReportParameters
		},
	]

	configuration: {
		period: DateRange
		format: 'pdf' | 'excel' | 'csv'
		includeCharts: boolean
		includeDetails: boolean
		departments: string[]
	}

	preview: {
		enabled: true
		format: 'html'
		refreshButton: boolean
	}

	actions: {
		generate: 'Generate Report'
		download: 'Download'
		email: 'Email Report'
		schedule: 'Schedule'
	}
}
```

## Mobile Responsive Design

### Mobile Layout

```tsx
interface MobilePayrollOfficer {
	navigation: 'hamburger-menu'

	quickAccess: [
		'Current Timesheets',
		'Quick Entry',
		'Validation Issues',
		'Submit Package',
	]

	optimizedViews: {
		timesheetEntry: 'vertical-form'
		calculations: 'summary-only'
		validation: 'issue-cards'
	}

	gestures: {
		swipeToNavigate: true
		pullToRefresh: true
		pinchToZoom: false
	}

	offlineMode: {
		saveLocal: true
		queueSubmissions: true
		syncOnConnect: true
	}
}
```

## Keyboard Shortcuts

### Global Shortcuts

```typescript
const keyboardShortcuts = {
	'Ctrl+N': 'New timesheet entry',
	'Ctrl+S': 'Save current entry',
	'Ctrl+Enter': 'Submit/Complete',
	'Ctrl+V': 'Validate selection',
	'Ctrl+C': 'Calculate selection',
	'Ctrl+/': 'Show shortcuts',
	Tab: 'Next field',
	'Shift+Tab': 'Previous field',
	Esc: 'Cancel/Close',
	F1: 'Help',
	F5: 'Refresh data',
	'Alt+1-9': 'Navigate tabs',
}
```

## Accessibility Features

### WCAG 2.1 AA Compliance

- Form labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode option
- Focus indicators
- Error message announcements
- Alternative text for icons
- Logical tab order

## Performance Requirements

### Response Times

- Page load: < 2 seconds
- Form submission: < 1 second
- Calculation batch: < 5 seconds for 100 records
- Report generation: < 10 seconds
- Search results: < 500ms

### Data Handling

- Support 500+ timesheet entries per period
- Handle concurrent users: 10+
- Auto-save every 30 seconds
- Undo/Redo support for last 10 actions

## Security Features

### Access Controls

- Role-based permissions
- Session timeout: 30 minutes
- Audit trail for all actions
- Data encryption in transit
- Field-level security for sensitive data
- IP restriction option

## Notification System

### Alert Types

```tsx
interface NotificationConfig {
	types: {
		timesheetReceived: {
			channel: 'in-app'
			priority: 'normal'
			action: 'View timesheet'
		}
		validationFailed: {
			channel: 'in-app'
			priority: 'high'
			action: 'Review issues'
		}
		calculationComplete: {
			channel: 'in-app'
			priority: 'low'
			action: 'View results'
		}
		submissionFeedback: {
			channel: ['in-app', 'email']
			priority: 'high'
			action: 'View feedback'
		}
	}

	preferences: {
		enableDesktop: boolean
		enableEmail: boolean
		enableSound: boolean
		quietHours: TimeRange
	}
}
```

## Help & Support

### Contextual Help

```tsx
interface HelpSystem {
	tooltips: {
		enabled: true
		delay: 1000
		position: 'auto'
	}

	helpPanel: {
		position: 'right-sidebar'
		contextAware: true
		searchable: true
		categories: [
			'Getting Started',
			'Timesheet Entry',
			'Calculations',
			'Validation',
			'Troubleshooting',
		]
	}

	tutorials: {
		interactive: true
		progress: 'tracked'
		topics: [
			'First timesheet entry',
			'Handling exceptions',
			'Submitting to verifier',
		]
	}

	support: {
		chat: 'available'
		ticketSystem: 'integrated'
		faq: 'searchable'
		videoGuides: 'embedded'
	}
}
```
