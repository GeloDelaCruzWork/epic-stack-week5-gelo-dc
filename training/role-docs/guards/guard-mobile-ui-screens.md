# Guard Mobile Application - Detailed UI Screens

## 1. Login Screen

```typescript
interface LoginScreen {
	layout: {
		type: 'vertical-center'
		components: {
			logo: {
				src: '/assets/company-logo.png'
				size: '120x120'
			}

			employeeIdInput: {
				type: 'text'
				placeholder: 'Employee ID'
				icon: 'user'
				validation: 'alphanumeric'
			}

			passwordInput: {
				type: 'password'
				placeholder: 'Password'
				icon: 'lock'
				showToggle: true
			}

			biometricButton: {
				type: 'icon-button'
				icon: 'fingerprint'
				label: 'Use Biometric'
				position: 'center'
			}

			loginButton: {
				type: 'primary-button'
				label: 'Sign In'
				fullWidth: true
			}

			forgotPasswordLink: {
				type: 'text-link'
				label: 'Forgot Password?'
				align: 'center'
			}
		}
	}
}
```

## 2. Dashboard Screen

```typescript
interface DashboardScreen {
	header: {
		greeting: 'Good Morning, [Name]'
		date: 'Today, January 9, 2025'
		profilePicture: 'circular-avatar'
	}

	quickActions: {
		grid: '2x2'
		cards: [
			{
				id: 'clock-in-out'
				icon: 'clock'
				label: 'Clock In/Out'
				status: 'CLOCKED_OUT' | 'CLOCKED_IN'
				backgroundColor: 'dynamic' // Green when out, Red when in
			},
			{
				id: 'schedule'
				icon: 'calendar'
				label: 'My Schedule'
				badge: 'Next: 6:00 AM'
			},
			{
				id: 'payslip'
				icon: 'money'
				label: 'Payslip'
				badge: 'Latest: Dec 31'
			},
			{
				id: 'requests'
				icon: 'document'
				label: 'Requests'
				badge: '2 Pending'
			},
		]
	}

	todaySchedule: {
		title: "Today's Assignment"
		card: {
			location: 'Main Gate - Tower A'
			shift: '6:00 AM - 2:00 PM'
			status: 'SCHEDULED' | 'ON_DUTY' | 'COMPLETED'
			supervisor: 'Juan Dela Cruz'
			postInstructions: 'Check all vehicles, verify IDs'
		}
	}

	recentActivities: {
		title: 'Recent Activities'
		list: [
			{
				icon: 'clock-in'
				description: 'Clocked In'
				time: '6:05 AM'
				location: 'Main Gate'
			},
			{
				icon: 'document-approved'
				description: 'Leave Request Approved'
				time: 'Yesterday'
			},
		]
	}
}
```

## 3. Clock In/Out Screen

```typescript
interface ClockInOutScreen {
	currentStatus: {
		display: 'large-status-card'
		status: 'CLOCKED_IN' | 'CLOCKED_OUT'
		lastAction: {
			type: 'Clock In' | 'Clock Out'
			time: '6:05 AM'
			location: 'Main Gate'
		}
	}

	clockButton: {
		type: 'large-circular-button'
		label: 'CLOCK IN' | 'CLOCK OUT'
		color: 'green' | 'red'
		animation: 'pulse'
		requireConfirmation: true
	}

	locationVerification: {
		gpsStatus: {
			icon: 'location'
			status: 'Verified' | 'Verifying' | 'Failed'
			coordinates: '14.5995° N, 120.9842° E'
		}
		nearbyPost: {
			detected: 'Main Gate - Tower A'
			distance: 'Within 50 meters'
		}
	}

	manualOverride: {
		button: 'Request Manual Clock'
		requiresReason: true
		options: [
			'GPS not working',
			'Biometric device issue',
			'Emergency deployment',
			'Other (specify)',
		]
	}

	todayLog: {
		title: "Today's Time Log"
		entries: [
			{
				type: 'IN'
				time: '6:05 AM'
				location: 'Main Gate'
				method: 'Mobile App'
			},
			{
				type: 'OUT'
				time: '2:10 PM'
				location: 'Main Gate'
				method: 'Biometric Device'
			},
		]
	}
}
```

## 4. Schedule Screen

```typescript
interface ScheduleScreen {
	viewToggle: {
		options: ['Week', 'Month']
		default: 'Week'
	}

	weekView: {
		header: 'Jan 6 - Jan 12, 2025'
		days: [
			{
				date: 'Mon, Jan 6'
				shift: {
					time: '6:00 AM - 2:00 PM'
					location: 'Main Gate'
					type: 'Regular'
					status: 'completed'
				}
			},
			{
				date: 'Tue, Jan 7'
				shift: {
					time: '2:00 PM - 10:00 PM'
					location: 'Tower B - Lobby'
					type: 'Regular'
					status: 'completed'
				}
			},
			{
				date: 'Wed, Jan 8'
				shift: {
					time: 'OFF DAY'
					type: 'rest-day'
					status: 'rest'
				}
			},
			{
				date: 'Thu, Jan 9'
				shift: {
					time: '6:00 AM - 2:00 PM'
					location: 'Main Gate'
					type: 'Regular'
					status: 'current'
					highlight: true
				}
			},
			{
				date: 'Fri, Jan 10'
				shift: {
					time: '6:00 AM - 2:00 PM'
					location: 'Main Gate'
					type: 'Regular'
					status: 'upcoming'
				}
			},
		]
	}

	monthView: {
		calendar: {
			type: 'monthly-grid'
			colorCoding: {
				regular: 'blue'
				overtime: 'orange'
				holiday: 'green'
				restDay: 'gray'
				leave: 'yellow'
			}
		}
	}

	shiftDetails: {
		onTap: 'expandable-card'
		shows: {
			location: 'full-address'
			supervisor: 'name-and-contact'
			postInstructions: 'detailed-text'
			relieverInfo: 'if-applicable'
		}
	}

	swapRequest: {
		button: 'Request Schedule Swap'
		form: {
			selectDate: 'date-picker'
			selectGuard: 'searchable-dropdown'
			reason: 'text-area'
		}
	}
}
```

## 5. Attendance History Screen

```typescript
interface AttendanceHistoryScreen {
	filters: {
		dateRange: {
			type: 'date-range-picker'
			default: 'current-month'
			presets: ['This Week', 'This Month', 'Last Month', 'Custom']
		}

		statusFilter: {
			type: 'multi-select'
			options: ['Present', 'Late', 'Absent', 'Leave', 'Holiday']
		}
	}

	summary: {
		card: {
			period: 'January 2025'
			stats: {
				present: { count: 8; label: 'Present' }
				late: { count: 1; label: 'Late' }
				absent: { count: 0; label: 'Absent' }
				leave: { count: 1; label: 'Leave' }
			}
		}
	}

	detailsList: {
		groupBy: 'date'
		entries: [
			{
				date: 'January 9, 2025'
				dayType: 'Regular Day'
				scheduled: '6:00 AM - 2:00 PM'
				actual: {
					in: '6:05 AM'
					out: '2:10 PM'
					status: 'Present'
					totalHours: '8h 5m'
					overtime: '5 min'
				}
				location: 'Main Gate'
			},
			{
				date: 'January 8, 2025'
				dayType: 'Rest Day'
				status: 'OFF'
			},
		]
	}

	discrepancyFlag: {
		indicator: 'warning-icon'
		onTap: 'show-details'
		allows: 'file-dispute'
	}
}
```

## 6. Payslip Screen

```typescript
interface PayslipScreen {
	periodSelector: {
		type: 'dropdown'
		periods: 'last-6-months'
		format: 'Dec 16-31, 2024'
	}

	payslipSummary: {
		card: {
			period: 'December 16-31, 2024'
			netPay: {
				amount: '₱12,500.00'
				label: 'Net Pay'
				emphasis: 'large-bold'
			}

			paymentInfo: {
				method: 'Bank Transfer'
				account: '****1234'
				date: 'December 31, 2024'
			}
		}
	}

	earnings: {
		section: 'Earnings'
		items: [
			{ label: 'Basic Pay'; amount: '₱10,000.00' },
			{ label: 'Overtime Pay'; amount: '₱2,500.00' },
			{ label: 'Holiday Pay'; amount: '₱1,500.00' },
			{ label: 'Night Differential'; amount: '₱800.00' },
		]
		total: '₱14,800.00'
	}

	deductions: {
		section: 'Deductions'
		items: [
			{ label: 'SSS'; amount: '₱500.00' },
			{ label: 'PhilHealth'; amount: '₱200.00' },
			{ label: 'Pag-IBIG'; amount: '₱100.00' },
			{ label: 'Tax'; amount: '₱1,500.00' },
		]
		total: '₱2,300.00'
	}

	actions: {
		downloadPDF: {
			icon: 'download'
			label: 'Download PDF'
		}
		emailCopy: {
			icon: 'email'
			label: 'Email Copy'
		}
	}
}
```

## 7. Leave Request Screen

```typescript
interface LeaveRequestScreen {
	leaveBalance: {
		card: {
			title: 'Leave Balance'
			balances: [
				{ type: 'Vacation Leave'; available: 5; used: 10; total: 15 },
				{ type: 'Sick Leave'; available: 3; used: 12; total: 15 },
				{ type: 'Emergency Leave'; available: 2; used: 1; total: 3 },
			]
		}
	}

	requestForm: {
		leaveType: {
			type: 'dropdown'
			options: ['Vacation', 'Sick', 'Emergency', 'Maternity', 'Paternity']
		}

		dateSelection: {
			type: 'date-range-picker'
			validation: 'check-balance'
			showAvailability: true
		}

		reason: {
			type: 'text-area'
			placeholder: 'Reason for leave'
			maxLength: 500
		}

		attachments: {
			type: 'file-upload'
			accept: 'image/*,application/pdf'
			required: 'for-sick-leave'
		}

		coverageArrangement: {
			type: 'dropdown'
			label: 'Suggested Reliever'
			options: 'available-guards'
		}
	}

	pendingRequests: {
		title: 'Pending Requests'
		list: [
			{
				type: 'Vacation Leave'
				dates: 'Jan 15-16, 2025'
				status: 'Pending Supervisor'
				submitted: 'Jan 5, 2025'
				actions: ['View', 'Cancel']
			},
		]
	}

	history: {
		title: 'Leave History'
		showLast: '6-months'
		entries: [
			{
				type: 'Sick Leave'
				dates: 'Dec 10, 2024'
				status: 'Approved'
				approvedBy: 'Juan Dela Cruz'
			},
		]
	}
}
```

## 8. Notifications Screen

```typescript
interface NotificationsScreen {
	tabs: {
		options: ['All', 'Schedule', 'Payroll', 'Requests', 'Announcements']
		badges: true
	}

	notificationList: {
		groupBy: 'date'
		swipeActions: {
			left: 'mark-read'
			right: 'delete'
		}

		items: [
			{
				category: 'schedule'
				icon: 'calendar'
				title: 'Schedule Change'
				message: 'Your shift tomorrow has been moved to 2:00 PM'
				time: '2 hours ago'
				priority: 'high'
				unread: true
				action: 'View Schedule'
			},
			{
				category: 'payroll'
				icon: 'money'
				title: 'Payslip Available'
				message: 'Your payslip for Dec 16-31 is ready'
				time: 'Yesterday'
				priority: 'normal'
				unread: false
				action: 'View Payslip'
			},
			{
				category: 'request'
				icon: 'check-circle'
				title: 'Leave Approved'
				message: 'Your vacation leave for Jan 15-16 has been approved'
				time: 'Jan 5'
				priority: 'normal'
				unread: false
			},
			{
				category: 'announcement'
				icon: 'megaphone'
				title: 'Company Announcement'
				message: 'Annual party scheduled for January 20, 2025'
				time: 'Jan 3'
				priority: 'low'
				unread: false
			},
		]
	}

	settings: {
		button: 'gear-icon'
		options: {
			pushNotifications: 'toggle'
			notificationSound: 'toggle'
			categories: {
				schedule: 'toggle'
				payroll: 'toggle'
				requests: 'toggle'
				announcements: 'toggle'
			}
		}
	}
}
```

## 9. Profile Screen

```typescript
interface ProfileScreen {
	header: {
		photo: {
			type: 'circular-avatar'
			size: 'large'
			editButton: true
		}
		name: 'Juan Dela Cruz'
		employeeId: 'EMP-2024-001'
		position: 'Security Guard'
		department: 'Security Services'
	}

	sections: [
		{
			title: 'Personal Information'
			fields: [
				{ label: 'Email'; value: 'juan.delacruz@email.com'; editable: true },
				{ label: 'Phone'; value: '+63 912 345 6789'; editable: true },
				{ label: 'Address'; value: '123 Main St, Manila'; editable: true },
				{
					label: 'Emergency Contact'
					value: 'Maria Dela Cruz - +63 912 345 6790'
					editable: true
				},
			]
		},
		{
			title: 'Employment Details'
			fields: [
				{ label: 'Date Hired'; value: 'January 15, 2024' },
				{ label: 'Employment Type'; value: 'Regular' },
				{ label: 'Current Post'; value: 'Main Gate - Tower A' },
				{ label: 'Supervisor'; value: 'Pedro Santos' },
			]
		},
		{
			title: 'Documents'
			items: [
				{ name: 'Company ID'; status: 'Active'; expiry: 'Dec 31, 2025' },
				{ name: 'Security License'; status: 'Active'; expiry: 'Jun 30, 2025' },
				{
					name: 'NBI Clearance'
					status: 'Expiring Soon'
					expiry: 'Feb 15, 2025'
				},
			]
		},
	]

	actions: {
		changePassword: {
			icon: 'lock'
			label: 'Change Password'
		}
		biometricSettings: {
			icon: 'fingerprint'
			label: 'Biometric Settings'
		}
		logout: {
			icon: 'logout'
			label: 'Sign Out'
			color: 'red'
		}
	}
}
```

## Common UI Components

```typescript
interface CommonComponents {
	navigation: {
		type: 'bottom-tab'
		items: [
			{ icon: 'home'; label: 'Home'; route: '/dashboard' },
			{ icon: 'clock'; label: 'Clock'; route: '/clock' },
			{ icon: 'calendar'; label: 'Schedule'; route: '/schedule' },
			{ icon: 'document'; label: 'Requests'; route: '/requests' },
			{ icon: 'user'; label: 'Profile'; route: '/profile' },
		]
	}

	pullToRefresh: {
		enabled: true
		onRefresh: 'sync-data'
	}

	offlineIndicator: {
		position: 'top-banner'
		message: 'Offline Mode - Data will sync when connected'
		color: 'warning-yellow'
	}

	loadingStates: {
		skeleton: true
		shimmer: true
		pullToRefreshIndicator: true
	}

	emptyStates: {
		illustration: true
		message: 'contextual'
		action: 'optional'
	}

	errorHandling: {
		toast: {
			position: 'bottom'
			duration: 3000
			types: ['success', 'error', 'warning', 'info']
		}

		modal: {
			for: 'critical-errors'
			actions: ['retry', 'dismiss']
		}
	}
}
```

## Offline Capabilities

```typescript
interface OfflineFeatures {
	dataStorage: {
		schedule: '7-days-ahead'
		attendance: 'current-month'
		payslips: 'last-3-months'
		profile: 'always-cached'
	}

	offlineActions: {
		allowed: [
			'view-schedule',
			'view-attendance',
			'view-payslips',
			'create-clock-events', // Queued for sync
			'draft-leave-requests', // Saved locally
		]

		queued: {
			clockEvents: {
				storage: 'local-sqlite'
				syncOnConnect: true
				conflictResolution: 'server-wins'
			}

			leaveRequests: {
				storage: 'local-draft'
				requiresConnection: 'to-submit'
			}
		}
	}

	syncMechanism: {
		trigger: 'on-network-restore'
		priority: ['clock-events', 'leave-requests', 'profile-updates']

		conflictHandling: {
			clockEvents: 'merge-by-timestamp'
			scheduleUpdates: 'server-overwrites'
			notifications: 'merge-unread'
		}
	}
}
```

## Security Features

```typescript
interface SecurityFeatures {
	authentication: {
		methods: ['password', 'biometric', 'pin']
		sessionTimeout: '30-minutes'
		autoLock: 'on-background'
	}

	biometric: {
		types: ['fingerprint', 'face-recognition']
		fallback: 'password'
		enrollment: 'in-app'
	}

	dataEncryption: {
		atRest: 'AES-256'
		inTransit: 'TLS-1.3'
		sensitiveFields: ['password', 'pin', 'payroll-data']
	}

	permissions: {
		location: 'when-clocking'
		camera: 'for-documents'
		storage: 'for-offline-data'
		notifications: 'for-alerts'
	}
}
```
