# Non-Guard Employee Payroll System Documentation

## Overview

This document outlines the payroll processing requirements for non-guard
employees, including leave management, absence tracking, and handling of
different employee classifications. Unlike guards who have strict
time-and-attendance requirements, non-guard employees have varying attendance
policies, leave entitlements, and payroll processing needs.

## Employee Type Classifications

```typescript
interface EmployeeClassification {
	categories: {
		regular: {
			description: 'Full-time permanent employees'
			timeTracking: 'FULL_DTR' | 'TIMESHEET_ONLY' | 'NO_TRACKING'
			leaveEntitled: true
			benefits: 'COMPLETE'
			overtimeEligible: boolean
			examples: ['Office Staff', 'Supervisors', 'HR Personnel']
		}

		probationary: {
			description: 'Employees under evaluation period'
			timeTracking: 'FULL_DTR'
			leaveEntitled: false // Until regularization
			benefits: 'PARTIAL'
			overtimeEligible: true
			probationPeriod: '3-6 months'
		}

		contractual: {
			description: 'Fixed-term contract employees'
			timeTracking: 'FULL_DTR' | 'PROJECT_BASED'
			leaveEntitled: false // Unless specified in contract
			benefits: 'AS_PER_CONTRACT'
			overtimeEligible: 'AS_PER_CONTRACT'
			contractDuration: 'variable'
		}

		executive: {
			description: 'Senior management and executives'
			timeTracking: 'NO_TRACKING' // Trust-based
			leaveEntitled: true
			benefits: 'EXECUTIVE_PACKAGE'
			overtimeEligible: false // Fixed compensation
			examples: ['Directors', 'VPs', 'C-Suite']
		}

		consultant: {
			description: 'Professional consultants'
			timeTracking: 'TIMESHEET_ONLY' // Hours for billing
			leaveEntitled: false
			benefits: 'NONE'
			overtimeEligible: false
			billing: 'HOURLY' | 'DAILY' | 'PROJECT'
		}

		partTime: {
			description: 'Part-time employees'
			timeTracking: 'FULL_DTR'
			leaveEntitled: 'PRORATED'
			benefits: 'PARTIAL'
			overtimeEligible: true
			minHours: 20
			maxHours: 30
		}
	}
}
```

## Time Tracking Classifications

```typescript
interface TimeTrackingTypes {
	FULL_DTR: {
		description: 'Complete Daily Time Record tracking'
		requirements: {
			clockIn: 'REQUIRED'
			clockOut: 'REQUIRED'
			breaks: 'TRACKED'
			overtime: 'CALCULATED'
		}
		processing: {
			tardiness: 'DEDUCTED'
			undertime: 'DEDUCTED'
			overtime: 'COMPENSATED'
			absences: 'DEDUCTED'
		}
		employees: ['Regular Staff', 'Probationary', 'Part-time']
	}

	TIMESHEET_ONLY: {
		description: 'Self-reported timesheet without DTR'
		requirements: {
			weeklySubmission: true
			projectCodes: 'OPTIONAL'
			approverValidation: 'REQUIRED'
			supportingDocs: 'AS_NEEDED'
		}
		processing: {
			billing: 'BY_HOURS_REPORTED'
			validation: 'MANAGER_APPROVAL'
			disputes: 'EVIDENCE_BASED'
		}
		employees: ['Consultants', 'Project-based', 'Remote workers']
	}

	NO_TRACKING: {
		description: 'No time tracking required'
		compensation: 'FIXED_MONTHLY'
		attendance: 'NOT_MONITORED'
		leaves: 'TRUST_BASED'
		employees: ['Executives', 'Directors', 'Fixed-salary positions']
	}

	FLEXIBLE_HOURS: {
		description: 'Core hours with flexibility'
		coreHours: '10:00 AM - 3:00 PM'
		totalRequired: '8 hours daily'
		tracking: 'TOTAL_HOURS_ONLY'
		employees: ['Senior Staff', 'Specialists']
	}

	OUTPUT_BASED: {
		description: 'Deliverable-based tracking'
		measurement: 'COMPLETED_OUTPUTS'
		deadlines: 'PROJECT_MILESTONES'
		presence: 'NOT_REQUIRED'
		employees: ['Writers', 'Designers', 'Developers']
	}
}
```

## Leave Management System

```typescript
interface LeaveManagementSystem {
  leaveTypes: {
    vacation: {
      name: "Vacation Leave (VL)";
      entitlement: {
        regular: 15; // days per year
        probationary: 0;
        contractual: "AS_PER_CONTRACT";
      };
      accumulation: "1.25 days per month";
      carryOver: "Max 5 days";
      monetization: "Allowed up to 10 days";
      advanceNotice: "5 working days";
    };

    sick: {
      name: "Sick Leave (SL)";
      entitlement: {
        regular: 15; // days per year
        probationary: 0;
        contractual: "AS_PER_CONTRACT";
      };
      accumulation: "1.25 days per month";
      carryOver: "Not allowed";
      monetization: "Not allowed";
      requirements: {
        1_2_days: "None";
        3_plus_days: "Medical certificate";
      };
    };

    emergency: {
      name: "Emergency Leave (EL)";
      entitlement: {
        regular: 3; // days per year
        allEmployees: true; // By law
      };
      valid_reasons: [
        "Death of immediate family",
        "Hospitalization of immediate family",
        "Natural disasters",
        "Fire/accident at residence"
      ];
      notice: "Within 24 hours";
      documentation: "Required within 5 days";
    };

    maternity: {
      name: "Maternity Leave";
      entitlement: 105; // days (expanded by law)
      coverage: "Female employees";
      sssPayment: true;
      additionalCompanyBenefit: "Top-up to 100% salary";
      requirements: ["SSS MAT-1", "Medical certificate"];
    };

    paternity: {
      name: "Paternity Leave";
      entitlement: 7; // days
      coverage: "Married male employees";
      requirements: ["Marriage certificate", "Birth certificate"];
      validity: "Within 60 days of childbirth";
    };

    soloParent: {
      name: "Solo Parent Leave";
      entitlement: 7; // days per year
      requirements: ["Solo Parent ID"];
      nonCumulative: true;
    };

    specialLeaveForWomen: {
      name: "Special Leave for Women";
      entitlement: 60; // days (RA 9710)
      purpose: "Gynecological surgery";
      requirements: ["Medical certificate"];
      salary: "Full pay";
    };

    bereavement: {
      name: "Bereavement Leave";
      entitlement: {
        immediate_family: 5; // days
        extended_family: 3; // days
      };
      definition: {
        immediate: ["Spouse", "Children", "Parents", "Siblings"];
        extended: ["Grandparents", "In-laws", "Grandchildren"];
      };
    };

    leaveWithoutPay: {
      name: "Leave Without Pay (LWOP)";
      when: "Exhausted all leave credits";
      approval: "Discretionary";
      impact: {
        salary: "No pay for days absent";
        benefits: "May be affected";
        thirteenthMonth: "Prorated deduction";
      };
    };
  };

  leaveBalance: {
    calculation: {
      opening: "Previous year carry-over";
      earned: "Monthly accrual";
      used: "Approved leaves taken";
      available: "Opening + Earned - Used";
      forfeited: "Unused beyond carry-over limit";
    };

    tracking: {
      realTime: true;
      visibility: ["Employee", "HR", "Manager"];
      notifications: {
        lowBalance: "< 3 days remaining";
        expiring: "Use-or-lose by year-end";
      };
    };
  };
}
```

## Absence Management System

```typescript
interface AbsenceManagement {
	absenceTypes: {
		authorized: {
			withPay: {
				types: ['Approved leave', 'Official business', 'Training']
				impact: 'No salary deduction'
			}

			withoutPay: {
				types: ['LWOP', 'Suspension', 'Extended leave']
				impact: 'Salary deduction'
			}
		}

		unauthorized: {
			awol: {
				definition: 'Absence Without Official Leave'
				threshold: 'No call/no show'
				consequences: {
					day1: 'Salary deduction + Warning'
					day2_3: 'Salary deduction + Written warning'
					day3_plus: 'Termination proceedings'
				}
			}

			tardiness: {
				graceperiod: '15 minutes'
				computation: {
					perMinute: 'Basic_Daily_Rate / 480'
					accumulated: 'Monthly total'
				}

				habitual: {
					definition: '10+ instances per month'
					action: 'Progressive discipline'
				}
			}

			undertime: {
				definition: 'Leaving before scheduled end'
				approval: 'Required from supervisor'
				unauthorized: 'Treated as half-day absence'
			}
		}
	}

	impactOnPayroll: {
		salaryComputation: {
			formula: 'Monthly_Salary - (Absences × Daily_Rate) - Tardiness_Deductions'

			dailyRate: {
				monthly: 'Monthly_Salary / Working_Days_In_Month'
				semiMonthly: 'Semi_Monthly_Salary / Working_Days_In_Period'
			}

			hourlyRate: 'Daily_Rate / 8'
			minuteRate: 'Hourly_Rate / 60'
		}

		benefits: {
			thirteenthMonth: {
				impact: 'Reduced by LWOP days'
				formula: 'Total_Basic_Pay_Received / 12'
			}

			sss_philhealth_pagibig: {
				impact: 'May affect if salary falls below threshold'
			}

			leaveCredits: {
				impact: 'No accrual during LWOP > 15 days'
			}
		}
	}
}
```

## Leave Application Workflow

```typescript
interface LeaveApplicationWorkflow {
  stages: {
    1_application: {
      actor: "Employee";
      actions: {
        selectDates: "Calendar picker";
        selectType: "Dropdown of eligible leaves";
        checkBalance: "Real-time availability";
        provideReason: "Text field";
        attachDocuments: "If required";
        suggestBackup: "Optional coverage";
      };

      validation: {
        balance: "Sufficient credits";
        notice: "Advance notice met";
        conflicts: "No critical events";
        documents: "Required attachments";
      };
    };

    2_routing: {
      system: "Auto-route based on rules";

      rules: {
        immediate_supervisor: "All leaves";
        department_head: "Leaves > 5 days";
        hr_review: "Special leaves";
        ceo_approval: "Executive leaves";
      };

      notifications: {
        approver: "Email + System notification";
        employee: "Submission confirmation";
        backup: "FYI if mentioned";
      };
    };

    3_review: {
      actor: "Approver(s)";

      considerations: {
        workload: "Current projects";
        teamCoverage: "Adequate staffing";
        history: "Previous leaves";
        policy: "Compliance check";
      };

      actions: {
        approve: "With or without conditions";
        reject: "With reason";
        return: "Request more info";
        delegate: "To another approver";
      };

      sla: "24-48 hours";
    };

    4_hr_processing: {
      actor: "HR Officer";

      tasks: {
        validateDocuments: "Medical certs, etc.";
        updateBalance: "Deduct from credits";
        notifyPayroll: "For salary computation";
        updateSchedule: "Workforce planning";
        fileDocuments: "201 file";
      };

      systemUpdates: {
        leaveBalance: "Real-time deduction";
        calendar: "Team visibility";
        payrollFlags: "Processing markers";
      };
    };

    5_payroll_impact: {
      actor: "Payroll Officer";

      processing: {
        paidLeaves: {
          action: "No deduction";
          code: "VL, SL, EL, etc.";
        };

        unpaidLeaves: {
          action: "Compute deduction";
          code: "LWOP";
          formula: "Days × Daily_Rate";
        };

        partialDays: {
          computation: "Hourly deduction";
          rounding: "Company policy";
        };
      };
    };
  };

  cancellation: {
    beforeStart: {
      process: "Simple cancellation";
      refund: "Full credit restoration";
    };

    duringLeave: {
      process: "Return to work request";
      approval: "Supervisor required";
      refund: "Unused days only";
    };
  };
}
```

## Tardiness and Undertime Processing

```typescript
interface TardinessUndertimeProcessing {
	tardiness: {
		definition: 'Clock-in after scheduled start + grace period'

		gracePeriod: {
			standard: 15 // minutes
			executive: 'Not applicable'
			flexible: 'Core hours based'
		}

		computation: {
			daily: {
				formula: 'Minutes_Late × Per_Minute_Rate'
				perMinuteRate: 'Monthly_Salary / (Working_Days × 8 × 60)'
			}

			accumulation: {
				period: 'Per cut-off'
				threshold: {
					warning: '5 instances'
					writeUp: '10 instances'
					suspension: '15 instances'
				}
			}
		}

		exceptions: {
			official_business: 'With travel order'
			emergency: 'With documentation'
			system_issues: 'IT-certified'
		}
	}

	undertime: {
		definition: 'Clock-out before scheduled end'

		types: {
			authorized: {
				process: 'Pre-approved by supervisor'
				forms: 'Undertime request form'
				deduction: 'As per policy'
			}

			unauthorized: {
				treatment: 'Absence without leave'
				deduction: 'Half-day or full-day'
			}
		}

		computation: {
			formula: 'Minutes_Early × Per_Minute_Rate'
			minimum: '30 minutes blocks'
		}
	}

	habitual_offenders: {
		tracking: {
			period: 'Monthly'
			metrics: [
				'Frequency',
				'Total minutes',
				'Pattern analysis',
				'Impact on operations',
			]
		}

		progressive_discipline: {
			level1: {
				trigger: '5 instances/month'
				action: 'Verbal warning'
				documentation: 'HR file note'
			}

			level2: {
				trigger: '10 instances/month'
				action: 'Written warning'
				documentation: 'Formal memo'
			}

			level3: {
				trigger: '15 instances/month'
				action: 'Suspension'
				duration: '1-3 days'
			}

			level4: {
				trigger: 'Continued violation'
				action: 'Termination'
				process: 'Due process required'
			}
		}
	}
}
```

## HR Officer Interface Enhancements

```typescript
interface HREmployeeManagement {
	employeeSetup: {
		classification: {
			field: 'employeeType'
			options: [
				'Regular',
				'Probationary',
				'Contractual',
				'Executive',
				'Consultant',
				'Part-time',
			]

			cascadeSettings: {
				timeTracking: 'Auto-set based on type'
				leaveEntitlement: 'Auto-calculate'
				benefits: 'Auto-assign package'
			}
		}

		attendanceSettings: {
			trackingMode: {
				options: [
					'Full DTR',
					'Timesheet Only',
					'No Tracking',
					'Flexible Hours',
					'Output Based',
				]
			}

			workSchedule: {
				regular: '8:00 AM - 5:00 PM'
				flexible: 'Core hours + flexi'
				shift: 'Rotating schedule'
				remote: 'No fixed schedule'
			}

			biometricRequired: boolean
			locationTracking: boolean
		}

		leaveConfiguration: {
			entitlements: {
				vacation: 'number'
				sick: 'number'
				emergency: 'number'
				special: 'based on eligibility'
			}

			accrualRules: {
				startDate: 'hire date or January 1'
				rate: 'monthly or annually'
				carryOver: 'policy-based'
			}
		}
	}

	bulkOperations: {
		importEmployees: {
			format: 'CSV/Excel template'
			validation: 'Pre-import check'
			fields: [
				'Employee ID',
				'Name',
				'Type',
				'Department',
				'Position',
				'Tracking Mode',
				'Leave Entitlements',
			]
		}

		leaveBalanceAdjustment: {
			scenarios: [
				'Year-end carry over',
				'New hire proration',
				'Policy changes',
				'Error corrections',
			]

			audit: 'Required justification'
			approval: 'HR Manager required'
		}
	}
}
```

## Timesheet Processing for Non-DTR Employees

```typescript
interface TimesheetProcessing {
	timesheetOnlyEmployees: {
		submission: {
			frequency: 'Weekly' | 'Bi-weekly' | 'Monthly'
			deadline: 'Sunday 11:59 PM'

			format: {
				webForm: {
					fields: [
						'Date',
						'Start Time',
						'End Time',
						'Break Duration',
						'Project/Task',
						'Description',
					]
				}

				excelUpload: {
					template: 'Standardized format'
					validation: 'Auto-check on upload'
				}
			}
		}

		approval: {
			workflow: {
				level1: 'Immediate supervisor'
				level2: 'Project manager (if applicable)'
				level3: 'HR review'
			}

			validation: {
				totalHours: 'Reasonable check'
				projectCodes: 'Valid codes'
				overlap: 'No double billing'
				compliance: 'Contract terms'
			}
		}

		integration: {
			withPayroll: {
				approved: 'Auto-feed to payroll'
				pending: 'Hold payment'
				disputed: 'Escalation process'
			}

			withBilling: {
				clientBillable: 'Separate tracking'
				internal: 'Cost center allocation'
			}
		}
	}

	executiveNoTracking: {
		payrollProcessing: {
			method: 'Fixed monthly salary'
			attendance: 'Not required'
			leaves: 'Courtesy notification only'

			components: {
				basicSalary: 'Fixed amount'
				allowances: 'Fixed amount'
				bonuses: 'Performance-based'
				benefits: 'Full package'
			}
		}

		reporting: {
			visibility: 'Executive dashboard'
			metrics: 'Business KPIs only'
			attendance: 'Not reported'
		}
	}
}
```

## Payroll Integration Points

```typescript
interface PayrollIntegrationForNonGuards {
	dataFlow: {
		fromHR: {
			masterData: [
				'Employee classification',
				'Salary information',
				'Leave balances',
				'Benefit enrollments',
			]

			periodic: ['Leave applications', 'Status changes', 'Salary adjustments']
		}

		fromTimeKeeping: {
			dtrEmployees: [
				'Clock events',
				'Tardiness',
				'Undertime',
				'Overtime',
				'Absences',
			]

			timesheetEmployees: [
				'Approved timesheets',
				'Billable hours',
				'Project allocations',
			]

			noTracking: ['Fixed salary flag', 'Leave notifications']
		}

		toPayroll: {
			computations: {
				earnings: {
					basic: 'Based on attendance/fixed'
					overtime: 'If eligible'
					allowances: 'As configured'
				}

				deductions: {
					absences: 'Unauthorized days'
					tardiness: 'Accumulated minutes'
					undertime: 'Accumulated minutes'
					lwop: 'Leave without pay days'
				}

				statutory: {
					sss: 'Based on bracket'
					philhealth: 'Based on salary'
					pagibig: 'Fixed or percentage'
					tax: 'Based on bracket'
				}
			}
		}
	}

	specialCases: {
		newHires: {
			proration: 'Based on start date'
			leaveCredits: 'Prorated accrual'
			benefits: 'Effectivity dates'
		}

		resignations: {
			finalPay: {
				components: [
					'Last salary',
					'Pro-rated 13th month',
					'Leave conversion',
					'Separation pay if applicable',
				]

				deductions: ['Accountabilities', 'Loans', 'Advances']
			}
		}

		promotions: {
			salaryAdjustment: 'Mid-month handling'
			benefitUpgrade: 'Effectivity date'
			leaveUpgrade: 'If applicable'
		}
	}
}
```

## Implementation Priorities

```typescript
interface ImplementationRoadmap {
	phase1: {
		name: 'Foundation'
		duration: 'Month 1-2'
		deliverables: [
			'Employee classification setup',
			'Basic leave types configuration',
			'DTR vs Timesheet distinction',
			'Absence tracking basics',
		]
	}

	phase2: {
		name: 'Leave Management'
		duration: 'Month 2-3'
		deliverables: [
			'Leave application workflow',
			'Leave balance tracking',
			'Leave approval process',
			'Integration with payroll',
		]
	}

	phase3: {
		name: 'Advanced Features'
		duration: 'Month 3-4'
		deliverables: [
			'Timesheet processing',
			'Executive handling',
			'Tardiness analytics',
			'Compliance reporting',
		]
	}

	phase4: {
		name: 'Optimization'
		duration: 'Month 4-5'
		deliverables: [
			'Automated workflows',
			'Exception handling',
			'Analytics dashboard',
			'Mobile accessibility',
		]
	}
}
```

## Next Steps

Based on this comprehensive overview, we should create separate detailed
workflows for:

1. **Regular Employees Workflow** - Full DTR tracking with complete leave
   management
2. **Executive Employees Workflow** - No tracking, fixed compensation
3. **Consultant/Contractual Workflow** - Timesheet-based with project tracking
4. **Part-time Employees Workflow** - Prorated benefits and scheduling
5. **Leave Management System** - Standalone comprehensive leave workflow
6. **Absence and Tardiness Management** - Detailed tracking and progressive
   discipline

Each workflow will detail:

- Specific UI/UX requirements
- Database schema extensions
- Business rules and validations
- Integration touchpoints
- Reporting requirements
