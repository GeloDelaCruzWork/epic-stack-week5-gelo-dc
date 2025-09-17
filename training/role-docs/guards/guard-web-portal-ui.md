# Guard Web Self-Service Portal - UI Specifications

## 1. Login Page

```typescript
interface WebLoginPage {
	layout: 'centered-card'

	components: {
		header: {
			logo: 'company-logo.svg'
			title: 'Guard Self-Service Portal'
			subtitle: 'Secure Access to Your Employment Information'
		}

		loginForm: {
			fields: [
				{
					name: 'employeeId'
					type: 'text'
					label: 'Employee ID'
					placeholder: 'Enter your employee ID'
					validation: 'required|alphanumeric'
					icon: 'user'
				},
				{
					name: 'password'
					type: 'password'
					label: 'Password'
					placeholder: 'Enter your password'
					validation: 'required|min:8'
					icon: 'lock'
					showToggle: true
				},
			]

			rememberMe: {
				type: 'checkbox'
				label: 'Remember me on this device'
				default: false
			}

			submitButton: {
				label: 'Sign In'
				type: 'primary'
				fullWidth: true
			}

			links: [
				{
					text: 'Forgot Password?'
					href: '/forgot-password'
				},
				{
					text: 'First Time User?'
					href: '/register'
				},
			]
		}

		securityNotice: {
			type: 'info-box'
			message: 'This portal is for authorized personnel only. All activities are logged and monitored.'
		}
	}
}
```

## 2. Dashboard Page

```typescript
interface WebDashboard {
	layout: {
		type: 'sidebar-with-content'
		responsive: true
	}

	header: {
		greeting: 'Welcome, [Guard Name]'
		lastLogin: 'Last login: January 8, 2025 at 6:30 PM'
		quickActions: [
			{
				label: 'View Schedule'
				icon: 'calendar'
				href: '/schedule'
			},
			{
				label: 'Request Leave'
				icon: 'document-add'
				href: '/leave/new'
			},
			{
				label: 'Download Payslip'
				icon: 'download'
				href: '/payslips'
			},
		]
	}

	widgets: {
		grid: 'responsive-3-column'
		cards: [
			{
				title: 'Current Month Schedule'
				content: {
					type: 'mini-calendar'
					highlights: {
						workDays: 'blue'
						restDays: 'gray'
						holidays: 'green'
						leave: 'yellow'
					}
				}
				link: '/schedule'
			},
			{
				title: 'Latest Payslip'
				content: {
					period: 'Dec 16-31, 2024'
					netPay: '₱12,500.00'
					status: 'Paid'
					downloadLink: true
				}
				link: '/payslips'
			},
			{
				title: 'Leave Balance'
				content: {
					type: 'progress-bars'
					items: [
						{ label: 'Vacation'; used: 10; total: 15 },
						{ label: 'Sick'; used: 12; total: 15 },
						{ label: 'Emergency'; used: 1; total: 3 },
					]
				}
				link: '/leave'
			},
			{
				title: 'Attendance Summary'
				content: {
					month: 'January 2025'
					stats: {
						present: 8
						late: 1
						absent: 0
						leave: 1
					}
				}
				link: '/attendance'
			},
			{
				title: 'Pending Requests'
				content: {
					type: 'list'
					items: [
						{ type: 'Leave Request'; status: 'Pending'; date: 'Jan 15-16' },
						{ type: 'Schedule Swap'; status: 'Under Review'; date: 'Jan 20' },
					]
				}
				link: '/requests'
			},
			{
				title: 'Important Documents'
				content: {
					type: 'document-list'
					items: [
						{
							name: 'Security License'
							expiry: 'Jun 30, 2025'
							status: 'active'
						},
						{
							name: 'NBI Clearance'
							expiry: 'Feb 15, 2025'
							status: 'expiring-soon'
						},
					]
				}
				link: '/documents'
			},
		]
	}

	announcements: {
		title: 'Latest Announcements'
		items: [
			{
				date: 'Jan 5, 2025'
				title: 'Annual Company Party'
				preview: 'Join us for the annual party on January 20...'
				priority: 'normal'
			},
			{
				date: 'Jan 3, 2025'
				title: 'New Uniform Distribution'
				preview: 'Please collect your new uniforms from HR...'
				priority: 'high'
			},
		]
		viewAll: '/announcements'
	}
}
```

## 3. Schedule Management Page

```typescript
interface SchedulePage {
	controls: {
		viewSelector: {
			options: ['Month View', 'Week View', 'List View']
			default: 'Month View'
		}

		monthNavigator: {
			previous: 'button'
			current: 'January 2025'
			next: 'button'
			jumpTo: 'month-year-picker'
		}

		filters: {
			location: 'dropdown:all-locations'
			shift: 'dropdown:all-shifts'
			showOnly: 'checkboxes:[Regular, Overtime, Holiday]'
		}

		exportButton: {
			label: 'Export Schedule'
			formats: ['PDF', 'Excel', 'ICS Calendar']
		}
	}

	calendarView: {
		type: 'full-month-grid'
		dayCell: {
			date: 'number'
			content: {
				shift: '6AM-2PM'
				location: 'Main Gate'
				type: 'color-coded-badge'
			}
			onClick: 'show-day-details'
		}

		legend: {
			position: 'bottom'
			items: [
				{ color: 'blue'; label: 'Regular Shift' },
				{ color: 'orange'; label: 'Overtime' },
				{ color: 'green'; label: 'Holiday' },
				{ color: 'gray'; label: 'Rest Day' },
				{ color: 'yellow'; label: 'Leave' },
			]
		}
	}

	weekView: {
		type: 'horizontal-timeline'
		days: '7-day-view'
		timeSlots: 'hourly-grid'
		shiftBlocks: {
			display: 'colored-blocks'
			showDetails: 'on-hover'
			clickAction: 'edit-request'
		}
	}

	listView: {
		groupBy: 'week'
		columns: [
			'Date',
			'Day',
			'Shift Time',
			'Location',
			'Type',
			'Hours',
			'Status',
		]

		rowActions: {
			swapRequest: 'icon-button'
			viewDetails: 'icon-button'
		}

		summary: {
			position: 'bottom'
			shows: ['Total Regular Hours', 'Total OT Hours', 'Total Rest Days']
		}
	}

	swapRequestModal: {
		title: 'Request Schedule Swap'
		form: {
			yourShift: {
				display: 'readonly'
				shows: 'selected-shift-details'
			}

			availableGuards: {
				type: 'searchable-table'
				columns: ['Name', 'Current Schedule', 'Availability']
				selection: 'single'
			}

			reason: {
				type: 'textarea'
				label: 'Reason for swap'
				required: true
				maxLength: 500
			}

			submitButton: {
				label: 'Submit Request'
				confirmation: 'Are you sure you want to request this swap?'
			}
		}
	}
}
```

## 4. Attendance & Timesheet Page

```typescript
interface AttendancePage {
	header: {
		title: 'Attendance & Timesheet'
		periodSelector: {
			type: 'month-year-picker'
			default: 'current-month'
			range: 'last-12-months'
		}
	}

	summary: {
		cards: [
			{
				label: 'Days Worked'
				value: '22'
				icon: 'calendar-check'
			},
			{
				label: 'Total Hours'
				value: '176'
				icon: 'clock'
			},
			{
				label: 'Overtime Hours'
				value: '24'
				icon: 'clock-plus'
			},
			{
				label: 'Attendance Rate'
				value: '98%'
				icon: 'chart'
			},
		]
	}

	timesheetTable: {
		columns: [
			{
				key: 'date'
				header: 'Date'
				format: 'MMM DD, YYYY'
				sortable: true
			},
			{
				key: 'day'
				header: 'Day'
				format: 'day-of-week'
			},
			{
				key: 'scheduled'
				header: 'Scheduled'
				format: 'time-range'
			},
			{
				key: 'clockIn'
				header: 'Clock In'
				format: 'time'
				highlight: 'if-late'
			},
			{
				key: 'clockOut'
				header: 'Clock Out'
				format: 'time'
			},
			{
				key: 'regularHours'
				header: 'Regular'
				format: 'decimal'
			},
			{
				key: 'overtime'
				header: 'OT'
				format: 'decimal'
			},
			{
				key: 'status'
				header: 'Status'
				format: 'badge'
				colors: {
					present: 'green'
					late: 'yellow'
					absent: 'red'
					leave: 'blue'
					holiday: 'purple'
				}
			},
			{
				key: 'actions'
				header: ''
				content: 'view-details-button'
			},
		]

		features: {
			sorting: true
			filtering: true
			pagination: {
				rowsPerPage: [15, 30, 50]
				default: 30
			}
			export: {
				formats: ['CSV', 'Excel', 'PDF']
			}
		}

		rowExpansion: {
			trigger: 'click-on-row'
			content: {
				locationDetails: true
				breakTimes: true
				adjustments: true
				notes: true
			}
		}
	}

	discrepancySection: {
		title: 'Attendance Discrepancies'
		description: 'Review and dispute any attendance issues'

		list: [
			{
				date: 'Jan 7, 2025'
				issue: 'Late Clock In'
				scheduled: '6:00 AM'
				actual: '6:15 AM'
				status: 'Pending Review'
				action: 'File Dispute'
			},
		]

		disputeForm: {
			fields: [
				{
					name: 'date'
					type: 'readonly'
				},
				{
					name: 'issue'
					type: 'readonly'
				},
				{
					name: 'explanation'
					type: 'textarea'
					label: 'Your Explanation'
					required: true
				},
				{
					name: 'attachments'
					type: 'file-upload'
					accept: 'image/*,application/pdf'
					label: 'Supporting Documents (if any)'
				},
			]
		}
	}
}
```

## 5. Payslip & Compensation Page

```typescript
interface PayslipPage {
	header: {
		title: 'Payslips & Compensation'
		yearSelector: {
			type: 'dropdown'
			options: 'last-3-years'
			default: 'current-year'
		}
	}

	payslipList: {
		layout: 'card-grid'
		cards: {
			design: 'elevated'
			content: [
				{
					period: 'December 16-31, 2024'
					payDate: 'December 31, 2024'
					netPay: '₱12,500.00'
					status: 'paid'
					actions: [
						{ icon: 'view'; label: 'View Details' },
						{ icon: 'download'; label: 'Download PDF' },
						{ icon: 'email'; label: 'Email Copy' },
					]
				},
			]
		}
	}

	payslipDetails: {
		modal: true
		sections: [
			{
				title: 'Pay Period Information'
				fields: [
					{ label: 'Period'; value: 'December 16-31, 2024' },
					{ label: 'Pay Date'; value: 'December 31, 2024' },
					{ label: 'Days Worked'; value: '13' },
					{ label: 'Total Hours'; value: '104' },
				]
			},
			{
				title: 'Earnings'
				table: {
					headers: ['Description', 'Hours/Days', 'Rate', 'Amount']
					rows: [
						['Basic Pay', '104', '96.15', '10,000.00'],
						['Overtime Pay', '16', '156.25', '2,500.00'],
						['Holiday Pay', '8', '187.50', '1,500.00'],
						['Night Differential', '32', '25.00', '800.00'],
					]
					footer: ['Total Earnings', '', '', '14,800.00']
				}
			},
			{
				title: 'Deductions'
				table: {
					headers: ['Description', 'Amount']
					rows: [
						['SSS', '500.00'],
						['PhilHealth', '200.00'],
						['Pag-IBIG', '100.00'],
						['Withholding Tax', '1,500.00'],
					]
					footer: ['Total Deductions', '2,300.00']
				}
			},
			{
				title: 'Net Pay'
				amount: '₱12,500.00'
				emphasis: 'large'
				paymentMethod: 'Bank Transfer - BDO ****1234'
			},
		]

		actions: {
			download: {
				button: 'Download PDF'
				filename: 'payslip_dec2024.pdf'
			}
			print: {
				button: 'Print'
				format: 'A4'
			}
			email: {
				button: 'Email to Me'
				recipient: 'employee-email'
			}
		}
	}

	compensationSummary: {
		title: 'Annual Compensation Summary'
		year: '2024'

		ytdTotals: {
			cards: [
				{ label: 'YTD Gross'; value: '₱195,000' },
				{ label: 'YTD Deductions'; value: '₱31,200' },
				{ label: 'YTD Net'; value: '₱163,800' },
				{ label: 'YTD Tax'; value: '₱18,000' },
			]
		}

		monthlyTrend: {
			chart: {
				type: 'line-chart'
				xAxis: 'months'
				yAxis: 'amount'
				series: [
					{ name: 'Gross Pay'; color: 'blue' },
					{ name: 'Net Pay'; color: 'green' },
					{ name: 'Deductions'; color: 'red' },
				]
			}
		}

		benefitsContributions: {
			title: 'Government Contributions'
			items: [
				{ name: 'SSS'; ytd: '₱6,000'; status: 'Updated' },
				{ name: 'PhilHealth'; ytd: '₱2,400'; status: 'Updated' },
				{ name: 'Pag-IBIG'; ytd: '₱1,200'; status: 'Updated' },
			]
		}
	}
}
```

## 6. Leave Management Page

```typescript
interface LeavePage {
	header: {
		title: 'Leave Management'
		quickAction: {
			button: 'Apply for Leave'
			icon: 'plus'
			primary: true
		}
	}

	leaveBalance: {
		title: 'Leave Balance for 2025'
		cards: [
			{
				type: 'Vacation Leave'
				visual: {
					type: 'circular-progress'
					used: 10
					total: 15
					color: 'blue'
				}
				details: {
					available: 5
					pending: 2
					used: 10
					total: 15
				}
			},
			{
				type: 'Sick Leave'
				visual: {
					type: 'circular-progress'
					used: 12
					total: 15
					color: 'green'
				}
				details: {
					available: 3
					pending: 0
					used: 12
					total: 15
				}
			},
			{
				type: 'Emergency Leave'
				visual: {
					type: 'circular-progress'
					used: 1
					total: 3
					color: 'orange'
				}
				details: {
					available: 2
					pending: 0
					used: 1
					total: 3
				}
			},
		]
	}

	leaveApplication: {
		form: {
			layout: 'single-column'
			sections: [
				{
					title: 'Leave Details'
					fields: [
						{
							name: 'leaveType'
							type: 'select'
							label: 'Type of Leave'
							options: [
								'Vacation Leave',
								'Sick Leave',
								'Emergency Leave',
								'Maternity Leave',
								'Paternity Leave',
								'Bereavement Leave',
							]
							required: true
						},
						{
							name: 'startDate'
							type: 'date'
							label: 'Start Date'
							min: 'today'
							required: true
						},
						{
							name: 'endDate'
							type: 'date'
							label: 'End Date'
							min: 'startDate'
							required: true
						},
						{
							name: 'numberOfDays'
							type: 'number'
							label: 'Number of Days'
							readonly: true
							calculated: 'from-dates'
						},
					]
				},
				{
					title: 'Reason & Supporting Documents'
					fields: [
						{
							name: 'reason'
							type: 'textarea'
							label: 'Reason for Leave'
							rows: 4
							maxLength: 1000
							required: true
						},
						{
							name: 'attachments'
							type: 'file-upload'
							label: 'Supporting Documents'
							accept: 'image/*,application/pdf'
							multiple: true
							maxSize: '5MB'
							required: 'if-sick-leave'
						},
					]
				},
				{
					title: 'Coverage Arrangement'
					fields: [
						{
							name: 'reliever'
							type: 'select'
							label: 'Suggested Reliever'
							options: 'available-guards-api'
							helpText: 'Optional: Suggest a guard to cover your shift'
						},
						{
							name: 'handoverNotes'
							type: 'textarea'
							label: 'Handover Notes'
							rows: 3
							placeholder: 'Any special instructions for your reliever'
						},
					]
				},
			]

			validation: {
				checkBalance: true
				checkScheduleConflicts: true
				requireAttachmentForSickLeave: true
			}

			actions: {
				submit: {
					label: 'Submit Leave Request'
					confirmation: true
				}
				saveDraft: {
					label: 'Save as Draft'
				}
				cancel: {
					label: 'Cancel'
				}
			}
		}
	}

	leaveRequests: {
		tabs: [
			{ label: 'Pending'; badge: 2 },
			{ label: 'Approved'; badge: 0 },
			{ label: 'Rejected'; badge: 0 },
			{ label: 'All Requests'; badge: null },
		]

		table: {
			columns: [
				'Request Date',
				'Leave Type',
				'Period',
				'Days',
				'Status',
				'Approver',
				'Actions',
			]

			rows: {
				expandable: true
				expandedContent: [
					'reason',
					'approverComments',
					'attachments',
					'timeline',
				]

				actions: {
					pending: ['View', 'Edit', 'Cancel']
					approved: ['View', 'Download']
					rejected: ['View', 'Reapply']
				}
			}

			filters: {
				year: 'dropdown'
				type: 'multi-select'
				status: 'multi-select'
			}
		}
	}

	leaveCalendar: {
		title: 'Team Leave Calendar'
		view: 'month'

		display: {
			myLeaves: {
				color: 'blue'
				pattern: 'solid'
			}
			teamLeaves: {
				color: 'gray'
				pattern: 'striped'
			}
			holidays: {
				color: 'green'
				pattern: 'dotted'
			}
		}

		tooltip: {
			shows: ['guardName', 'leaveType', 'status']
		}
	}
}
```

## 7. Documents & Certifications Page

```typescript
interface DocumentsPage {
	header: {
		title: 'Documents & Certifications'
		description: 'Manage your employment documents and certifications'
	}

	categories: {
		tabs: [
			'Employment Documents',
			'Certifications',
			'Government IDs',
			'Requests',
		]
	}

	employmentDocuments: {
		grid: 'card-layout'
		cards: [
			{
				title: 'Employment Contract'
				icon: 'document'
				status: 'Active'
				dateIssued: 'Jan 15, 2024'
				actions: ['View', 'Download']
			},
			{
				title: 'Company ID'
				icon: 'id-card'
				status: 'Active'
				expiryDate: 'Dec 31, 2025'
				actions: ['View', 'Request Renewal']
			},
			{
				title: 'Certificate of Employment'
				icon: 'certificate'
				lastRequested: 'Nov 10, 2024'
				actions: ['Request New']
			},
		]
	}

	certifications: {
		table: {
			columns: [
				'Certification',
				'License No.',
				'Issue Date',
				'Expiry Date',
				'Status',
				'Actions',
			]

			rows: [
				{
					name: 'Security Guard License'
					number: 'SG-2024-12345'
					issued: 'Jan 1, 2024'
					expiry: 'Jun 30, 2025'
					status: {
						type: 'active'
						daysUntilExpiry: 173
					}
					actions: ['View', 'Upload New', 'Set Reminder']
				},
				{
					name: 'NBI Clearance'
					number: 'NBI-2024-67890'
					issued: 'Feb 15, 2024'
					expiry: 'Feb 15, 2025'
					status: {
						type: 'expiring-soon'
						daysUntilExpiry: 37
					}
					actions: ['View', 'Upload New', 'Set Reminder']
				},
			]
		}

		uploadSection: {
			title: 'Upload New Certification'
			form: {
				certificationType: 'dropdown'
				fileUpload: {
					accept: 'application/pdf,image/*'
					maxSize: '10MB'
				}
				licenseNumber: 'text-input'
				issueDate: 'date-picker'
				expiryDate: 'date-picker'
				setReminder: {
					type: 'checkbox'
					options: ['30 days', '60 days', '90 days']
				}
			}
		}
	}

	documentRequests: {
		newRequest: {
			button: 'Request Document'
			form: {
				documentType: {
					options: [
						'Certificate of Employment',
						'Payslip Copy',
						'Income Tax Certificate (2316)',
						'Service Record',
						'Clearance Certificate',
					]
				}
				purpose: {
					type: 'textarea'
					label: 'Purpose of Request'
					required: true
				}
				urgency: {
					type: 'radio'
					options: ['Regular (3-5 days)', 'Urgent (1-2 days)']
				}
				deliveryMethod: {
					type: 'radio'
					options: ['Email', 'Physical Copy']
				}
			}
		}

		requestHistory: {
			table: {
				columns: [
					'Request Date',
					'Document Type',
					'Purpose',
					'Status',
					'Ready Date',
					'Actions',
				]

				statuses: {
					pending: { color: 'yellow'; icon: 'clock' }
					processing: { color: 'blue'; icon: 'refresh' }
					ready: { color: 'green'; icon: 'check' }
					collected: { color: 'gray'; icon: 'archive' }
				}
			}
		}
	}
}
```

## 8. Profile & Settings Page

```typescript
interface ProfileSettingsPage {
	layout: 'tabbed-sections'

	personalInfo: {
		title: 'Personal Information'

		profileCard: {
			photo: {
				display: 'large-avatar'
				changeButton: true
			}
			name: 'Juan Dela Cruz'
			employeeId: 'EMP-2024-001'
			position: 'Security Guard'
			department: 'Security Services'
		}

		form: {
			sections: [
				{
					title: 'Contact Information'
					fields: [
						{
							name: 'email'
							type: 'email'
							label: 'Email Address'
							editable: true
							verification: 'required'
						},
						{
							name: 'mobile'
							type: 'tel'
							label: 'Mobile Number'
							editable: true
							format: '+63 XXX XXX XXXX'
						},
						{
							name: 'alternatePhone'
							type: 'tel'
							label: 'Alternate Phone'
							editable: true
							optional: true
						},
					]
				},
				{
					title: 'Address'
					fields: [
						{
							name: 'currentAddress'
							type: 'textarea'
							label: 'Current Address'
							editable: true
							rows: 3
						},
						{
							name: 'permanentAddress'
							type: 'textarea'
							label: 'Permanent Address'
							editable: true
							rows: 3
							sameAsCurrent: 'checkbox'
						},
					]
				},
				{
					title: 'Emergency Contact'
					fields: [
						{
							name: 'emergencyName'
							type: 'text'
							label: 'Contact Name'
							editable: true
						},
						{
							name: 'emergencyRelation'
							type: 'select'
							label: 'Relationship'
							options: ['Spouse', 'Parent', 'Sibling', 'Child', 'Other']
							editable: true
						},
						{
							name: 'emergencyPhone'
							type: 'tel'
							label: 'Contact Number'
							editable: true
						},
					]
				},
			]

			saveButton: {
				label: 'Save Changes'
				confirmation: 'update-notification'
			}
		}
	}

	accountSettings: {
		title: 'Account & Security'

		sections: [
			{
				title: 'Login Credentials'
				items: [
					{
						label: 'Password'
						value: '••••••••'
						action: {
							label: 'Change Password'
							modal: 'password-change-form'
						}
					},
					{
						label: 'Security Questions'
						value: 'Set up'
						action: {
							label: 'Manage'
							modal: 'security-questions-form'
						}
					},
				]
			},
			{
				title: 'Two-Factor Authentication'
				items: [
					{
						label: 'SMS Verification'
						toggle: true
						status: 'enabled'
						phone: '****6789'
					},
					{
						label: 'Email Verification'
						toggle: true
						status: 'disabled'
					},
				]
			},
			{
				title: 'Login History'
				table: {
					columns: ['Date & Time', 'Device', 'Location', 'Status']
					rows: 'last-10-logins'
					showMore: 'link'
				}
			},
		]
	}

	notificationPreferences: {
		title: 'Notification Preferences'

		categories: [
			{
				name: 'Schedule Updates'
				channels: {
					email: { toggle: true; enabled: true }
					sms: { toggle: true; enabled: false }
					push: { toggle: true; enabled: true }
				}
			},
			{
				name: 'Payroll Notifications'
				channels: {
					email: { toggle: true; enabled: true }
					sms: { toggle: true; enabled: true }
					push: { toggle: true; enabled: true }
				}
			},
			{
				name: 'Leave Updates'
				channels: {
					email: { toggle: true; enabled: true }
					sms: { toggle: true; enabled: false }
					push: { toggle: true; enabled: true }
				}
			},
			{
				name: 'Company Announcements'
				channels: {
					email: { toggle: true; enabled: true }
					sms: { toggle: true; enabled: false }
					push: { toggle: true; enabled: false }
				}
			},
		]

		frequency: {
			label: 'Notification Digest'
			options: ['Immediate', 'Daily Summary', 'Weekly Summary']
			current: 'Immediate'
		}
	}

	privacySettings: {
		title: 'Privacy & Data'

		options: [
			{
				label: 'Profile Visibility'
				description: 'Allow other guards to see your basic profile'
				toggle: true
				enabled: true
			},
			{
				label: 'Show in Team Calendar'
				description: 'Display your leave schedules to team members'
				toggle: true
				enabled: true
			},
			{
				label: 'Data Export'
				description: 'Download all your personal data'
				action: {
					button: 'Request Data Export'
					process: 'email-link-72-hours'
				}
			},
		]
	}
}
```

## Common Web Components

```typescript
interface WebCommonComponents {
	navigation: {
		sidebar: {
			collapsible: true
			items: [
				{ icon: 'dashboard'; label: 'Dashboard'; route: '/' },
				{ icon: 'calendar'; label: 'Schedule'; route: '/schedule' },
				{ icon: 'clock'; label: 'Attendance'; route: '/attendance' },
				{ icon: 'money'; label: 'Payslips'; route: '/payslips' },
				{ icon: 'document'; label: 'Leave'; route: '/leave' },
				{ icon: 'folder'; label: 'Documents'; route: '/documents' },
				{ icon: 'user'; label: 'Profile'; route: '/profile' },
			]

			footer: {
				items: [
					{ icon: 'help'; label: 'Help Center' },
					{ icon: 'logout'; label: 'Sign Out' },
				]
			}
		}

		topBar: {
			elements: [
				'company-logo',
				'search-bar',
				'notifications-bell',
				'user-menu',
			]
		}
	}

	responsiveDesign: {
		breakpoints: {
			mobile: '< 768px'
			tablet: '768px - 1024px'
			desktop: '> 1024px'
		}

		mobileMenu: {
			type: 'hamburger'
			position: 'top-left'
			overlay: true
		}
	}

	dataTable: {
		features: {
			sorting: true
			filtering: true
			pagination: true
			columnToggle: true
			export: true
			search: true
		}

		responsive: {
			mobile: 'card-view'
			tablet: 'horizontal-scroll'
			desktop: 'full-table'
		}
	}

	forms: {
		validation: {
			realTime: true
			onSubmit: true
			errorDisplay: 'inline'
		}

		fieldTypes: {
			standard: ['text', 'email', 'tel', 'number', 'date', 'select', 'textarea']
			custom: ['date-range', 'time-picker', 'file-upload', 'rich-text']
		}
	}

	notifications: {
		types: {
			toast: {
				position: 'top-right'
				duration: 5000
				dismissible: true
			}

			banner: {
				position: 'top'
				persistent: true
			}

			modal: {
				centered: true
				backdrop: true
			}
		}
	}

	accessibility: {
		features: [
			'keyboard-navigation',
			'screen-reader-support',
			'high-contrast-mode',
			'font-size-adjustment',
			'focus-indicators',
		]
	}
}
```
