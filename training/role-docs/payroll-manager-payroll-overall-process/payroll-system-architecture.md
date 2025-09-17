# Payroll System Architecture & Requirements

## Executive Summary

This document outlines the comprehensive payroll management system requirements
for handling guard payroll operations. The system integrates with existing
timesheet functionality to calculate pay, manage deductions, allowances, and
government contributions while providing role-based interfaces for payroll
officers, verifiers, and controllers.

## System Overview

### Core Objectives

1. Aggregate timesheet data into paysheets for each guard per pay period
2. Calculate base pay from multiple timesheets with different contract rates
3. Manage allowances, deductions, loans, and government contributions
4. Provide approval workflow for payroll officer → verifier → controller
5. Enable schedule-based payment management

### Key Stakeholders

- **Payroll Officer**: Primary user responsible for payroll setup and processing
- **Verifier**: Reviews and verifies payroll calculations
- **Controller**: Final approval authority for payroll

## Data Model Architecture

### Core Reference Entities

#### 1. Guards

- `id`: Unique identifier
- `firstName`: First name
- `lastName`: Last name
- `employeeId`: Employee number
- Status and other employee details

#### 2. Pay Periods

- `id`: Unique identifier
- `startDate`: Period start date
- `endDate`: Period end date
- `status`: Active/Closed/Processing

#### 3. Locations & Detachments

- **Locations**
  - `id`: Unique identifier
  - `name`: Location name
  - `code`: Location code
- **Detachments**
  - `id`: Unique identifier
  - `locationId`: Foreign key to location
  - `name`: Detachment name
  - `subArea`: Optional sub-area designation

#### 4. Shifts

- `id`: Unique identifier
- `name`: Shift name (Day/Night)
- `startTime`: Shift start (e.g., 06:00)
- `endTime`: Shift end (e.g., 18:00)

#### 5. Positions

- `id`: Unique identifier
- `name`: Position title (Guard/Supervisor)
- `level`: Position level/rank

#### 6. Contract Rates

- `id`: Unique identifier
- `locationId`: Foreign key
- `shiftId`: Foreign key
- `positionId`: Foreign key
- `baseRate`: Hourly base rate
- `overtimeRate`: Overtime rate multiplier
- `nightDifferential`: Night differential rate
- `effectiveDate`: Rate effective date

### Payroll Processing Entities

#### 7. Timesheets (Modified)

```
- id
- guardId (FK)
- payPeriodId (FK)
- locationId (FK)
- detachmentId (FK)
- shiftId (FK)
- positionId (FK)
- contractRateId (FK)
- totalRegularHours
- totalOvertimeHours
- totalNightHours
- status (Draft/Submitted/Approved)
```

#### 8. Paysheets

```
- id
- guardId (FK)
- payPeriodId (FK)
- basicPay (computed from timesheets)
- overtimePay
- nightDifferential
- totalAllowances
- totalDeductions
- taxAmount
- netPay
- status (Draft/Verified/Approved)
- createdDate
- verifiedDate
- approvedDate
```

#### 9. Paysheet-Timesheet Association

```
- paysheetId (FK)
- timesheetId (FK)
```

### Payroll Components

#### 10. Loans

```
- id
- name (e.g., "SSS Loan", "Emergency Loan")
- category
- description
```

#### 11. Allowances

```
- id
- name (e.g., "Transportation", "Meal")
- category
- taxable (boolean)
```

#### 12. Government Contributions

```
- SSS (Social Security System)
- PhilHealth
- Pag-IBIG (HDMF)
```

### Guard-Component Associations

#### 13. Guard Loans

```
- id
- guardId (FK)
- loanId (FK)
- totalAmount
- remainingBalance
- monthlyPayment
- startDate
- endDate
- status
```

#### 14. Guard Loan Schedule

```
- id
- guardLoanId (FK)
- payPeriodId (FK)
- scheduledAmount
- actualAmount
- status (Pending/Paid/Waived)
- waivedBy
- waivedReason
- paymentDate
```

#### 15. Guard Allowances

```
- id
- guardId (FK)
- allowanceId (FK)
- amount
- frequency (Monthly/Per Period)
- startDate
- endDate
- status
```

#### 16. Guard Allowance Schedule

```
- id
- guardAllowanceId (FK)
- payPeriodId (FK)
- amount
- status (Pending/Applied/Waived)
- waivedBy
- waivedReason
```

#### 17. Guard Government Contributions

```
Tables for:
- GuardSSS
- GuardPhilHealth
- GuardPagIBIG

Each containing:
- guardId (FK)
- employeeShare
- employerShare
- effectiveDate
- status
```

#### 18. Tax Tables

```
- id
- minIncome
- maxIncome
- baseTax
- percentageOverMin
- effectiveDate
```

## User Interface Design

### UI Portal 1: Paysheet View (Shared Access)

**Users**: Payroll Officer, Verifier, Controller

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Pay Period: [Dropdown]     View Mode: [Guard/Location]  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────────────────────────┐ │
│  │              │  │        PAYSHEET SUMMARY           │ │
│  │   Left       │  │  Guard: [Name]                    │ │
│  │   Panel      │  │  Period: [Dates]                  │ │
│  │              │  │  Basic Pay: ₱XX,XXX              │ │
│  │  - Guards    │  │  Allowances: ₱X,XXX              │ │
│  │    List      │  │  Deductions: ₱X,XXX              │ │
│  │              │  │  Net Pay: ₱XX,XXX                │ │
│  │  OR          │  ├──────────────────────────────────┤ │
│  │              │  │                                   │ │
│  │  - Locations │  │  [Timesheets] [Allowances]       │ │
│  │    > Detach. │  │     [Deductions]                 │ │
│  │      > Guards│  │                                   │ │
│  │              │  │  Tab Content Area                │ │
│  └──────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### Features by Tab

**Timesheets Tab**:

- List all timesheets for the pay period
- Drill-down capability: Timesheet → DTR → Time Logs → Clock Events
- Display computed amounts (visible only to payroll roles)
- Aggregated totals for regular hours, OT, night differential

**Allowances Tab**:

- Three grids:
  1. Regular Allowances (Transportation, Meal, etc.)
  2. Rewards/Bonuses
  3. Benefits
- Each showing scheduled amounts for the period
- Waive functionality for payroll officer

**Deductions Tab**:

- Multiple grids:
  1. Loan Payments
  2. SSS Contributions
  3. PhilHealth
  4. Pag-IBIG
  5. Tax Withholding
- Display scheduled vs actual amounts
- Waive capability with reason tracking

### UI Portal 2: Reference Data Management

**Users**: Payroll Officer only

#### Main Sections

1. **Loans Management**
   - CRUD operations for loan types
   - Interest rate configuration
   - Payment term templates

2. **Allowances Management**
   - Define allowance categories
   - Set taxability rules
   - Configure standard amounts

3. **Government Contributions**
   - SSS contribution table maintenance
   - PhilHealth premium rates
   - Pag-IBIG contribution rules
   - Effectivity date management

4. **Tax Tables**
   - Income bracket configuration
   - Tax rate management
   - Exemption rules

#### Interface Layout

```
┌─────────────────────────────────────────────────────────┐
│  Reference Data Management                               │
├─────────────────────────────────────────────────────────┤
│  [Loans] [Allowances] [Gov Contributions] [Tax Tables]   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Active Tab Content:                                     │
│  ┌─────────────────────────────────────────────────────┐│
│  │  [Add New]  [Import]  [Export]                      ││
│  │                                                      ││
│  │  Data Grid with:                                    ││
│  │  - Search/Filter                                    ││
│  │  - Edit inline                                      ││
│  │  - Delete with confirmation                         ││
│  │  - Effectivity date tracking                        ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### UI Portal 3: Guard-Component Assignment

**Users**: Payroll Officer only

#### Purpose

Associate guards with loans, allowances, and benefits, then manage payment
schedules

#### Interface Design

```
┌─────────────────────────────────────────────────────────┐
│  Guard Payment Configuration                             │
├─────────────────────────────────────────────────────────┤
│  Guard: [Select Guard Dropdown]                          │
│  Component Type: [Loan/Allowance/Gov Contribution]       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Current Associations:                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Type    | Name          | Amount   | Status         ││
│  │ Loan    | SSS Loan      | ₱5,000  | Active         ││
│  │ Allow.  | Transportation| ₱2,000  | Active         ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  Schedule Management:                                    │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Pay Period | Scheduled | Actual | Status | Actions  ││
│  │ Jan 1-15   | ₱500     | ₱500   | Paid   | [View]   ││
│  │ Jan 16-31  | ₱500     | -      | Pending| [Waive]  ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

1. Database schema creation
2. Basic CRUD APIs for reference data
3. Migration of existing timesheet structure

### Phase 2: Core Processing (Weeks 3-4)

1. Paysheet generation from timesheets
2. Basic pay calculation engine
3. Allowance and deduction processing

### Phase 3: UI Development (Weeks 5-6)

1. Paysheet view interface
2. Reference data management screens
3. Guard-component assignment interface

### Phase 4: Workflow & Security (Week 7)

1. Approval workflow implementation
2. Role-based access control
3. Audit trail logging

### Phase 5: Testing & Refinement (Week 8)

1. End-to-end testing
2. Performance optimization
3. User acceptance testing

## Technical Considerations

### Performance Requirements

- Handle 500+ guards per pay period
- Process payroll calculations within 30 seconds
- Support concurrent users (3-5 payroll staff)

### Security Requirements

- Role-based access control
- Audit trail for all financial modifications
- Encryption for sensitive salary data
- Session management with timeout

### Integration Points

- Existing timesheet system
- Potential future integration with:
  - Banking systems for direct deposit
  - Government reporting systems
  - Accounting software

### Business Rules Engine

- Configurable minimum wage floor
- Automatic tax calculation
- Government contribution computation
- Loan payment scheduling with interest

## User Workflow

### Payroll Officer Workflow

1. **Setup Phase**
   - Configure pay period
   - Verify timesheet submissions
   - Review guard assignments

2. **Processing Phase**
   - Generate paysheets from timesheets
   - Apply allowances and deductions
   - Handle exceptions and waivers
   - Calculate taxes

3. **Review Phase**
   - Validate calculations
   - Generate reports
   - Submit for verification

### Verifier Workflow

1. Review paysheet summaries
2. Spot-check calculations
3. Verify exception handling
4. Approve or return for correction

### Controller Workflow

1. Final review of payroll batch
2. Approve for disbursement
3. Generate final reports

## Reporting Requirements

### Standard Reports

1. **Payroll Register** - Complete list of all payments
2. **Deduction Summary** - All deductions by category
3. **Government Remittance** - SSS, PhilHealth, Pag-IBIG reports
4. **Tax Remittance** - BIR compliance reports
5. **Loan Balance Report** - Outstanding loans per guard
6. **Payslip Generation** - Individual guard payslips

### Audit Reports

1. Waived deductions report
2. Manual adjustments log
3. Approval timeline report
4. System access audit trail

## Next Steps

1. **Immediate Actions**
   - Review and approve this architecture document
   - Prioritize features for MVP
   - Assign development resources

2. **Technical Setup**
   - Create development environment
   - Set up database migrations
   - Configure testing framework

3. **Stakeholder Alignment**
   - Conduct walkthrough with payroll team
   - Gather additional requirements
   - Define success metrics

## Appendix A: Sample Calculations

### Basic Pay Calculation

```
For each timesheet:
  Regular Pay = Regular Hours × Contract Rate
  OT Pay = OT Hours × (Contract Rate × OT Multiplier)
  Night Diff = Night Hours × Night Differential Rate

Total Basic Pay = Sum of all timesheet calculations
```

### Net Pay Calculation

```
Gross Pay = Basic Pay + Total Allowances
Taxable Income = Gross Pay - Non-taxable Allowances
Tax = Calculate from tax table
Total Deductions = Tax + Loans + Gov Contributions + Other
Net Pay = Gross Pay - Total Deductions
```

## Appendix B: Data Validation Rules

1. **Pay Period Validation**
   - No overlapping periods
   - Guards can have multiple timesheets per period
   - One paysheet per guard per period

2. **Schedule Validation**
   - Loan payments cannot exceed remaining balance
   - Government contributions follow statutory limits
   - Allowances respect defined frequencies

3. **Workflow Validation**
   - Paysheets must be verified before approval
   - Waivers require reason and authorization
   - Changes after approval require re-verification
