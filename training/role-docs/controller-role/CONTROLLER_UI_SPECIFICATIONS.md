# Controller UI Specifications

## Visual Identity

### Color Scheme

- **Primary Color**: Deep Blue (#1e3a8a)
- **Secondary Color**: Navy (#1e293b)
- **Accent Color**: Gold (#facc15)
- **Alert Color**: Amber (#f59e0b)
- **Success Color**: Green (#10b981)
- **Background**: Light Gray (#f8fafc)

### Role Badge

```tsx
<Badge className="bg-blue-900 text-white">
	<Calculator className="mr-1 h-4 w-4" />
	Controller
</Badge>
```

## Dashboard Layout

### Header Section

```tsx
interface ControllerHeader {
	title: 'Financial Control Center'
	subtitle: 'Budget Validation & Financial Oversight'
	userInfo: {
		name: string
		role: 'Controller'
		department: 'Finance'
		lastLogin: Date
	}
	notifications: {
		pendingReviews: number
		budgetAlerts: number
		escalations: number
	}
}
```

### Key Metrics Display

```tsx
interface FinancialMetrics {
	periodBudget: {
		allocated: number
		consumed: number
		remaining: number
		percentageUsed: number
	}
	payrollProjection: {
		base: number
		additions: number
		deductions: number
		total: number
	}
	fundStatus: {
		available: number
		committed: number
		reserved: number
	}
	complianceScore: {
		value: number
		trend: 'up' | 'down' | 'stable'
		lastAudit: Date
	}
}
```

## Main Navigation

### Menu Structure

```tsx
const controllerMenu = [
	{
		icon: <FileCheck />,
		label: 'Pending Reviews',
		badge: pendingCount,
		route: '/controller/reviews',
	},
	{
		icon: <DollarSign />,
		label: 'Budget Analysis',
		route: '/controller/budget',
	},
	{
		icon: <TrendingUp />,
		label: 'Financial Reports',
		route: '/controller/reports',
	},
	{
		icon: <AlertTriangle />,
		label: 'Exceptions',
		badge: exceptionCount,
		route: '/controller/exceptions',
	},
	{
		icon: <History />,
		label: 'Audit Trail',
		route: '/controller/audit',
	},
]
```

## Review Interface

### Payroll Review Grid

```tsx
interface PayrollReviewGrid {
	columns: [
		{ field: 'payPeriod'; header: 'Period'; width: 120 },
		{ field: 'department'; header: 'Department'; width: 150 },
		{ field: 'totalAmount'; header: 'Total'; width: 120; format: 'currency' },
		{
			field: 'budgetAllocation'
			header: 'Budget'
			width: 120
			format: 'currency'
		},
		{ field: 'variance'; header: 'Variance'; width: 100; format: 'percentage' },
		{ field: 'guards'; header: 'Guards'; width: 80 },
		{ field: 'verifierStatus'; header: 'Verifier'; width: 100; badge: true },
		{ field: 'complianceFlags'; header: 'Compliance'; width: 120 },
		{ field: 'actions'; header: 'Actions'; width: 150 },
	]
	features: {
		filtering: true
		sorting: true
		grouping: ['department', 'payPeriod']
		export: ['excel', 'pdf']
		bulkActions: true
	}
}
```

### Detailed Review Panel

```tsx
interface ReviewPanel {
	sections: {
		summary: {
			payPeriod: string
			preparedBy: string
			verifiedBy: string
			submissionDate: Date
			totalPayroll: number
			affectedGuards: number
		}

		budgetAnalysis: {
			allocatedBudget: number
			currentSpend: number
			projectedSpend: number
			variance: {
				amount: number
				percentage: number
				reason?: string
			}
			recommendations: string[]
		}

		breakdownTable: {
			categories: [
				{ name: 'Base Salary'; amount: number; budgeted: number },
				{ name: 'Overtime'; amount: number; budgeted: number },
				{ name: 'Non-Contracted'; amount: number; budgeted: number },
				{ name: 'Deductions'; amount: number; budgeted: number },
				{ name: 'Gov Contributions'; amount: number; budgeted: number },
			]
		}

		complianceChecks: {
			fundAvailability: boolean
			budgetCompliance: boolean
			policyAdherence: boolean
			auditRequirements: boolean
			flags: ComplianceFlag[]
		}
	}
}
```

## Budget Analysis Tools

### Budget Dashboard

```tsx
interface BudgetDashboard {
	visualizations: {
		consumptionChart: {
			type: 'doughnut'
			data: {
				consumed: number
				remaining: number
				overrun: number
			}
		}

		trendChart: {
			type: 'line'
			periods: string[]
			series: [
				{ name: 'Budget'; data: number[] },
				{ name: 'Actual'; data: number[] },
				{ name: 'Projection'; data: number[] },
			]
		}

		departmentBreakdown: {
			type: 'bar'
			departments: string[]
			allocated: number[]
			spent: number[]
		}
	}

	alerts: {
		overBudget: Department[]
		nearLimit: Department[]
		unusualSpending: Pattern[]
	}
}
```

### Variance Analysis

```tsx
interface VarianceAnalyzer {
	controls: {
		periodSelector: DateRange
		departmentFilter: string[]
		thresholdSetter: number
	}

	results: {
		significantVariances: [
			{
				department: string
				category: string
				expected: number
				actual: number
				variance: number
				percentage: number
				explanation?: string
			},
		]

		actions: {
			requestExplanation: boolean
			escalate: boolean
			approve: boolean
			reject: boolean
		}
	}
}
```

## Decision Interface

### Approval Controls

```tsx
interface ApprovalControls {
  mainActions: {
    approve: {
      label: "Approve Payroll"
      icon: <CheckCircle />
      color: "green"
      confirmation: true
    }

    conditionalApprove: {
      label: "Approve with Conditions"
      icon: <AlertCircle />
      color: "yellow"
      requiresComment: true
    }

    reject: {
      label: "Reject"
      icon: <XCircle />
      color: "red"
      requiresReason: true
    }

    escalate: {
      label: "Escalate to CFO"
      icon: <ArrowUp />
      color: "blue"
      requiresJustification: true
    }
  }

  supportingActions: {
    requestInfo: "Request Additional Information"
    scheduleReview: "Schedule Review Meeting"
    exportReport: "Export Analysis Report"
  }
}
```

### Decision Form

```tsx
interface DecisionForm {
	decision: 'approve' | 'conditional' | 'reject' | 'escalate'

	conditionalFields?: {
		conditions: string[]
		deadline: Date
		responsibleParty: string
	}

	rejectionFields?: {
		reason: string
		categories: string[]
		requiredCorrections: string[]
	}

	escalationFields?: {
		urgency: 'high' | 'medium' | 'low'
		justification: string
		recommendedAction: string
		attachments: File[]
	}

	commonFields: {
		comments: string
		internalNotes: string
		followUpRequired: boolean
		notifyParties: string[]
	}
}
```

## Financial Reports

### Report Generator

```tsx
interface ReportGenerator {
	templates: [
		'Budget Utilization Report',
		'Variance Analysis Report',
		'Compliance Summary',
		'Exception Report',
		'Trend Analysis',
	]

	configuration: {
		period: DateRange
		departments: string[]
		includeCharts: boolean
		includeDetails: boolean
		format: 'pdf' | 'excel' | 'web'
	}

	scheduling: {
		frequency: 'daily' | 'weekly' | 'monthly'
		recipients: Email[]
		autoGenerate: boolean
	}
}
```

### Executive Summary View

```tsx
interface ExecutiveSummary {
	header: {
		period: string
		preparedFor: 'CFO' | 'Board'
		generatedDate: Date
	}

	keyFindings: {
		totalPayroll: number
		budgetUtilization: number
		majorVariances: Finding[]
		recommendations: string[]
	}

	riskAssessment: {
		level: 'low' | 'medium' | 'high'
		factors: string[]
		mitigations: string[]
	}

	visualSummary: {
		charts: Chart[]
		tables: Table[]
		highlights: Highlight[]
	}
}
```

## Exception Management

### Exception Queue

```tsx
interface ExceptionQueue {
	filters: {
		severity: 'critical' | 'high' | 'medium' | 'low'
		type: 'budget' | 'compliance' | 'policy' | 'unusual'
		status: 'new' | 'investigating' | 'resolved'
		age: number // days
	}

	exceptions: [
		{
			id: string
			type: string
			severity: string
			description: string
			amount: number
			department: string
			detectedDate: Date
			status: string
			assignedTo?: string
			resolution?: string
		},
	]

	bulkActions: {
		assign: User
		escalate: boolean
		close: boolean
		export: boolean
	}
}
```

### Exception Investigation

```tsx
interface Investigation {
	exceptionDetails: {
		fullDescription: string
		impactAssessment: string
		relatedTransactions: Transaction[]
		historicalPattern: Pattern[]
	}

	investigationTools: {
		transactionDrill: boolean
		trendAnalysis: boolean
		peerComparison: boolean
		policyCheck: boolean
	}

	resolution: {
		finding: string
		action: 'approve' | 'adjust' | 'reject'
		preventiveMeasure: string
		documentation: File[]
	}
}
```

## Audit Trail Interface

### Audit Log Viewer

```tsx
interface AuditViewer {
	filters: {
		dateRange: DateRange
		actionType: string[]
		user: string[]
		outcome: string[]
	}

	entries: [
		{
			timestamp: Date
			user: string
			action: string
			target: string
			details: string
			outcome: 'success' | 'failure'
			ipAddress: string
			changes?: ChangeSet
		},
	]

	export: {
		format: 'csv' | 'pdf' | 'json'
		includeDetails: boolean
		digitallySigned: boolean
	}
}
```

## Mobile Responsive Design

### Mobile Layout

```tsx
interface MobileController {
	navigation: 'bottom-tabs'

	priorityViews: ['Pending Reviews', 'Quick Approve', 'Budget Status', 'Alerts']

	gestures: {
		swipeToApprove: boolean
		pullToRefresh: boolean
		longPressDetails: boolean
	}

	offlineCapability: {
		viewData: true
		makeDecisions: false
		syncOnConnect: true
	}
}
```

## Integration Points

### External Systems

```tsx
interface SystemIntegrations {
	erp: {
		budgetSync: 'real-time'
		chartOfAccounts: 'daily'
		costCenters: 'on-change'
	}

	treasury: {
		fundAvailability: 'real-time'
		cashFlow: 'hourly'
	}

	audit: {
		logStreaming: 'continuous'
		reportGeneration: 'on-demand'
	}
}
```

## Performance Requirements

### Response Times

- Dashboard load: < 2 seconds
- Report generation: < 5 seconds
- Budget calculation: < 1 second
- Search results: < 500ms

### Data Handling

- Support 10,000+ transactions per view
- Real-time budget updates
- Concurrent user support: 20+
- Data retention: 7 years

## Accessibility Features

### WCAG 2.1 AA Compliance

- High contrast mode
- Keyboard navigation
- Screen reader support
- Focus indicators
- Error announcements
- Alternative text for charts

## Security Features

### Access Controls

- Multi-factor authentication required
- Session timeout: 15 minutes
- Audit logging for all actions
- Encrypted data transmission
- Role-based permissions
- IP whitelisting option

## Notification System

### Alert Configuration

```tsx
interface NotificationSettings {
	channels: ['email', 'sms', 'in-app']

	triggers: {
		budgetExceeded: { threshold: 95; channel: ['email', 'sms'] }
		largeVariance: { threshold: 10; channel: ['email'] }
		pendingReview: { age: 24; channel: ['in-app'] }
		escalation: { immediate: true; channel: ['all'] }
	}

	digest: {
		enabled: true
		frequency: 'daily'
		time: '08:00'
	}
}
```
