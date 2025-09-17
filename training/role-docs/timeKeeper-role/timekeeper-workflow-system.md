# Timekeeper Workflow System

## Clock Event Synchronization, Timelog Management & DTR/Timesheet Processing

## Executive Summary

Based on the **Updated Role Narratives - Payroll System (Revised)** and
requirements from tk.txt and ops-tk.txt, this document provides a comprehensive
workflow and UI design for the Timekeeper role. The Timekeeper serves as the
critical bridge between raw clock events and finalized timesheets, ensuring
accurate time accounting while maintaining data integrity through the processing
hierarchy:

**Clock Events → Timelogs → DTR → Timesheets**

## Timekeeper Role Overview

As defined in the Updated Role Narratives, the Timekeeper:

- Processes clock events from multiple sources (biometric via mobile sync, Excel
  uploads)
- Creates and manages time pairs from clock events
- Manages both **actual** and **normalized** time records
- Validates time data against schedules
- Initiates change requests for time adjustments
- Submits completed timesheets to HR Manager for approval
- **Does NOT see cost/amount data** - focuses purely on hours rendered

## Core Concepts & Data Hierarchy

### 1. Data Processing Flow

```
TIMEKEEPER DATA FLOW
═══════════════════════════════════════

Clock Events (Source of Truth)
    ↓
Timelogs (Editable Processing Layer)
    ↓
DTR (Daily Time Record)
    ↓
Timesheet (Final Output)
    ↓
HR Manager Approval
```

### 2. Key Principles

1. **Clock Events are Immutable** - Never edited directly (source of truth)
2. **Timelogs are Adjustable** - Processing layer where corrections happen
3. **DTR is Generated** - Automatically created from validated timelogs
4. **Timesheets Aggregate DTRs** - Summarizes for pay period
5. **All Changes Require Approval** - Three-tier change request system

### 3. Data Synchronization Rules

- **Real-time Sync**: Biometric → Mobile → System (when online)
- **Batch Sync**: Accumulated events uploaded when connection restored
- **Excel Upload**: Manual entry processed as clock events
- **Validation**: All sources validated against schedules and business rules

## Database Schema Design

### Time Tracking Tables

```sql
-- Clock Events (Immutable Source of Truth)
model ClockEvent {
  id              String   @id @default(cuid())
  guardId         String
  eventType       ClockEventType
  eventTime       DateTime
  source          EventSource
  deviceId        String?
  locationId      String?
  rawData         Json?    -- Original data from source
  syncedAt        DateTime?
  createdAt       DateTime @default(now())

  guard           Guard @relation(fields: [guardId], references: [id])
  location        Location? @relation(fields: [locationId], references: [id])

  -- Cannot be edited, only referenced
  @@index([guardId, eventTime])
  @@index([source])
  @@index([syncedAt])
}

-- Timelogs (Editable Processing Layer)
model Timelog {
  id                String   @id @default(cuid())
  guardId           String
  date              DateTime @db.Date
  scheduleAssignmentId String?

  -- Original from clock events
  originalClockIn   DateTime?
  originalClockOut  DateTime?

  -- Adjusted times (editable)
  adjustedClockIn   DateTime?
  adjustedClockOut  DateTime?

  -- Break times
  breakStart        DateTime?
  breakEnd          DateTime?

  -- Overtime
  overtimeStart     DateTime?
  overtimeEnd       DateTime?

  -- Processing flags
  hasAdjustments    Boolean @default(false)
  adjustmentReason  String?

  -- Leave integration
  leaveTypeId       String?
  leaveHours        Decimal? @db.Decimal(5, 2)

  -- Status tracking
  status            TimelogStatus @default(PENDING)
  processedBy       String?
  processedAt       DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  guard             Guard @relation(fields: [guardId], references: [id])
  scheduleAssignment ScheduleAssignment? @relation(fields: [scheduleAssignmentId], references: [id])
  leaveType         LeaveType? @relation(fields: [leaveTypeId], references: [id])
  dtr               DTR?
  adjustmentRequests TimelogAdjustment[]

  @@unique([guardId, date])
  @@index([date])
  @@index([status])
}

-- Daily Time Record (Generated from Timelogs)
model DTR {
  id                String   @id @default(cuid())
  timelogId         String   @unique
  guardId           String
  date              DateTime @db.Date

  -- Computed values
  scheduledHours    Decimal  @db.Decimal(5, 2)
  actualHours       Decimal  @db.Decimal(5, 2)
  regularHours      Decimal  @db.Decimal(5, 2)
  overtimeHours     Decimal  @db.Decimal(5, 2)
  nightDiffHours    Decimal  @db.Decimal(5, 2)

  -- Attendance flags
  isPresent         Boolean
  isLate            Boolean
  hasUndertime      Boolean
  isAbsent          Boolean
  isOnLeave         Boolean

  -- Leave integration
  leaveHours        Decimal? @db.Decimal(5, 2)

  -- For billing (normalized)
  billableHours     Decimal  @db.Decimal(5, 2)

  status            DTRStatus @default(DRAFT)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  timelog           Timelog @relation(fields: [timelogId], references: [id])
  guard             Guard @relation(fields: [guardId], references: [id])
  timesheetDTRs     TimesheetDTR[]

  @@index([guardId, date])
  @@index([status])
}

-- Timesheet (Aggregates DTRs for Pay Period)
model Timesheet {
  id                String   @id @default(cuid())
  guardId           String
  payPeriodId       String

  -- Aggregated hours (actual for payroll)
  totalRegularHours Decimal  @db.Decimal(6, 2)
  totalOvertimeHours Decimal @db.Decimal(6, 2)
  totalNightDiffHours Decimal @db.Decimal(6, 2)
  totalLeaveHours   Decimal  @db.Decimal(6, 2)

  -- Normalized hours (for billing)
  totalBillableHours Decimal @db.Decimal(6, 2)

  -- Attendance summary
  daysPresent       Int
  daysAbsent        Int
  daysOnLeave       Int
  lateCount         Int
  undertimeCount    Int

  -- Status tracking
  status            TimesheetStatus @default(DRAFT)
  submittedBy       String?
  submittedAt       DateTime?
  approvedBy        String?
  approvedAt        DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  guard             Guard @relation(fields: [guardId], references: [id])
  payPeriod         PayPeriod @relation(fields: [payPeriodId], references: [id])
  dtrs              TimesheetDTR[]

  @@unique([guardId, payPeriodId])
  @@index([status])
}

-- Junction table for Timesheet-DTR relationship
model TimesheetDTR {
  timesheetId String
  dtrId       String

  timesheet   Timesheet @relation(fields: [timesheetId], references: [id])
  dtr         DTR @relation(fields: [dtrId], references: [id])

  @@id([timesheetId, dtrId])
}

-- Timelog Adjustment Requests
model TimelogAdjustment {
  id                String   @id @default(cuid())
  timelogId         String
  requestedBy       String

  -- What's being changed
  fieldName         String   -- e.g., "adjustedClockIn"
  originalValue     String
  requestedValue    String

  reason            String
  documentation     String?

  -- Approval workflow
  status            ChangeRequestStatus @default(PENDING)
  verifiedBy        String?
  verifiedAt        DateTime?
  verifierNotes     String?
  approvedBy        String?
  approvedAt        DateTime?
  approverNotes     String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  timelog           Timelog @relation(fields: [timelogId], references: [id])

  @@index([timelogId])
  @@index([status])
}

-- Leave Management
model LeaveType {
  id              String   @id @default(cuid())
  name            String   @unique
  code            String   @unique
  isPaid          Boolean
  maxDaysPerYear  Int?
  requiresApproval Boolean @default(true)

  timelogs        Timelog[]
  leaveBalances   LeaveBalance[]
  leaveRequests   LeaveRequest[]
}

model LeaveBalance {
  id              String   @id @default(cuid())
  guardId         String
  leaveTypeId     String
  year            Int
  entitled        Decimal  @db.Decimal(5, 2)
  used            Decimal  @db.Decimal(5, 2)
  remaining       Decimal  @db.Decimal(5, 2)

  guard           Guard @relation(fields: [guardId], references: [id])
  leaveType       LeaveType @relation(fields: [leaveTypeId], references: [id])

  @@unique([guardId, leaveTypeId, year])
}

model LeaveRequest {
  id              String   @id @default(cuid())
  guardId         String
  leaveTypeId     String
  startDate       DateTime
  endDate         DateTime
  days            Decimal  @db.Decimal(5, 2)
  reason          String?
  status          LeaveStatus @default(PENDING)
  approvedBy      String?
  approvedAt      DateTime?

  guard           Guard @relation(fields: [guardId], references: [id])
  leaveType       LeaveType @relation(fields: [leaveTypeId], references: [id])

  @@index([guardId])
  @@index([status])
}

-- Enums
enum TimelogStatus {
  PENDING
  PROCESSED
  ADJUSTED
  APPROVED
  ERROR
}

enum DTRStatus {
  DRAFT
  FINALIZED
  APPROVED
}

enum TimesheetStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
  PAID
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum ChangeRequestStatus {
  PENDING
  VERIFIED
  APPROVED
  REJECTED
}
```

## User Interface Design

### 1. Timekeeper Dashboard - Main Screen

```
┌────────────────────────────────────────────────────────────────────────┐
│  TIMEKEEPER MANAGEMENT SYSTEM                          [User] [Logout]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Pay Period: [Jan 1-15, 2024 ▼]    View Mode: (●) Guard  ( ) Location  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    PROCESSING OVERVIEW                           │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│  │
│  │  │ Clock Events│  │  Timelogs   │  │    DTRs     │  │Timesheets││  │
│  │  │    2,456    │  │   498/523   │  │   485/523   │  │  15/20   ││  │
│  │  │   Synced    │  │  Processed  │  │  Generated  │  │ Complete ││  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────┬──────────────────────────────────────────────┐│
│  │ NAVIGATION          │ TIMESHEET PROCESSING                         ││
│  │                     │                                               ││
│  │ [Search: ________] │ Selected: Juan Dela Cruz (G-001)             ││
│  │                     │ Pay Period: Jan 1-15, 2024                   ││
│  │ ○ Guards List      │                                               ││
│  │   □ Dela Cruz, J.  │ ┌─────────────────────────────────────────┐  ││
│  │   □ Santos, M.     │ │ Status: In Progress                     │  ││
│  │   □ Reyes, A.      │ │ Regular Hours: 96                       │  ││
│  │                     │ │ Overtime: 8                             │  ││
│  │ ○ By Location      │ │ Days Present: 12/15                     │  ││
│  │   ▷ Location A     │ │ Adjustments: 2 pending                  │  ││
│  │     ▷ Detach. 1    │ └─────────────────────────────────────────┘  ││
│  │       • Guard 1    │                                               ││
│  │       • Guard 2    │ [View Timelogs] [View DTRs] [View Timesheet]││
│  └─────────────────────┴──────────────────────────────────────────────┘│
│                                                                          │
│  ALERTS & NOTIFICATIONS                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ⚠️ 25 guards with missing clock events for yesterday              │  │
│  │ 🔴 3 timelogs require adjustment approval                         │  │
│  │ ℹ️ 12 DTRs ready for timesheet generation                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Clock Event Synchronization Monitor

```
┌────────────────────────────────────────────────────────────────────────┐
│  CLOCK EVENT SYNCHRONIZATION                           [Back to Dashboard]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SYNC STATUS OVERVIEW                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Source          │ Last Sync │ Pending │ Synced Today │ Status     │  │
│  │─────────────────┼───────────┼─────────┼──────────────┼────────────│  │
│  │ Biometric - A   │ 10:30 AM  │    0    │     156      │     ✓      │  │
│  │ Biometric - B   │ 10:45 AM  │    3    │     89       │     ⚠️     │  │
│  │ Biometric - C   │ OFFLINE   │   45    │     0        │     🔴     │  │
│  │ Excel Upload    │ 09:00 AM  │    0    │     23       │     ✓      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  RECENT CLOCK EVENTS                                   [Auto-refresh ✓] │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Time     │ Guard ID │ Name         │ Event  │ Location │ Source   │  │
│  │──────────┼──────────┼──────────────┼────────┼──────────┼──────────│  │
│  │ 10:58 AM │ G-001    │ J. Dela Cruz │ IN     │ Loc A    │ Biometric│  │
│  │ 10:57 AM │ G-023    │ M. Santos    │ OUT    │ Loc B    │ Biometric│  │
│  │ 10:55 AM │ G-045    │ P. Reyes     │ IN     │ Loc A    │ Excel    │  │
│  │ [View More...]                                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  PROCESSING QUEUE                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 48 clock events ready for timelog creation                        │  │
│  │ 12 unpaired clock events requiring attention                      │  │
│  │ 3 duplicate events detected                                        │  │
│  │                                                                     │  │
│  │ [Process All] [Review Unpaired] [Resolve Duplicates]              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 3. Timelog Management Interface

```
┌────────────────────────────────────────────────────────────────────────┐
│  TIMELOG MANAGEMENT                                    [Back to Dashboard]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Guard: Juan Dela Cruz (G-001)          Date Range: Jan 1-15, 2024     │
│                                                                          │
│  TIMELOG GRID                                          [Edit Mode: OFF] │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Date    │ Schedule │ Clock In │ Clock Out│ Hours │ Status │Actions│  │
│  │─────────┼──────────┼──────────┼──────────┼───────┼────────┼───────│  │
│  │ Jan 1   │ 06:00 AM │ 06:05 AM │ 06:00 PM │ 11:55 │   ✓    │ [View]│  │
│  │ Jan 2   │ 06:00 AM │ 06:02 AM │ 06:15 PM │ 12:13 │   ✓    │ [View]│  │
│  │ Jan 3   │ 06:00 AM │ --:-- -- │ 06:00 PM │  ⚠️   │ Missing│ [Edit]│  │
│  │ Jan 4   │ 06:00 AM │ 06:30 AM*│ 06:00 PM │ 11:30 │ Adjust │ [View]│  │
│  │ Jan 5   │ OFF      │ --:-- -- │ --:-- -- │   -   │   ✓    │   -   │  │
│  │ Jan 6   │ 06:00 AM │ LEAVE    │ LEAVE    │   8   │ Leave  │ [View]│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  * = Adjusted time (original: 07:15 AM)                                │
│                                                                          │
│  SELECTED TIMELOG: January 3, 2024                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ CLOCK EVENTS                          │ TIMELOG DETAILS          │  │
│  │────────────────────────────────────────┼──────────────────────────│  │
│  │ Source Events:                         │ Schedule: Day Shift      │  │
│  │ • No IN event found                    │ Location: Location A     │  │
│  │ • OUT: 06:00 PM (Biometric)          │ Position: Guard          │  │
│  │                                        │                          │  │
│  │ OPS Manual Entry:                      │ Adjusted Times:          │  │
│  │ • IN: 06:00 AM (Pending verification) │ Clock In: [06:00 AM]     │  │
│  │                                        │ Clock Out: [06:00 PM]    │  │
│  │ [View Source Data]                     │ Break: [12:00-01:00 PM]  │  │
│  │                                        │                          │  │
│  │                                        │ Reason: Biometric failure│  │
│  │                                        │ [Request Adjustment]     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 4. Timelog Adjustment Request Form

```
┌────────────────────────────────────────────────────────────────────────┐
│  TIMELOG ADJUSTMENT REQUEST                                        [X]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  GUARD INFORMATION                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Name: Juan Dela Cruz (G-001)                                     │  │
│  │ Date: January 4, 2024                                            │  │
│  │ Location: Location A - Main Gate                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ADJUSTMENT DETAILS                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Field to Adjust: [Clock In Time ▼]                               │  │
│  │                                                                   │  │
│  │ Current Value:    07:15 AM (Late - from biometric)               │  │
│  │ Requested Value:  [06:30] AM                                     │  │
│  │                                                                   │  │
│  │ Reason for Adjustment:                                           │  │
│  │ [Traffic accident caused delay, guard called supervisor ▼]       │  │
│  │ • Traffic accident                                               │  │
│  │ • Biometric malfunction                                          │  │
│  │ • Emergency situation                                            │  │
│  │ • Supervisor instruction                                         │  │
│  │ • Other (specify)                                                │  │
│  │                                                                   │  │
│  │ Additional Details:                                              │  │
│  │ [Guard was stuck in traffic due to vehicular accident on EDSA.   │  │
│  │  Called supervisor at 6:15 AM to inform. Arrived at 7:15 AM     │  │
│  │  but performed duty from 6:30 AM as instructed by supervisor.]  │  │
│  │                                                                   │  │
│  │ Supporting Documentation:                                        │  │
│  │ □ Supervisor confirmation attached                               │  │
│  │ □ Incident report attached                                       │  │
│  │ □ Photo evidence attached                                        │  │
│  │                                                                   │  │
│  │ [Upload Files]                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  IMPACT ANALYSIS                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Original Hours: 10.75 (Late by 1.25 hours)                       │  │
│  │ Adjusted Hours: 11.50 (Late by 0.50 hours)                       │  │
│  │ Difference: +0.75 hours                                          │  │
│  │ Effect on Overtime: None                                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Cancel]  [Save Draft]  [Submit for Verification]                      │
└────────────────────────────────────────────────────────────────────────┘
```

### 5. DTR Generation & Review

```
┌────────────────────────────────────────────────────────────────────────┐
│  DAILY TIME RECORD (DTR)                               [Back to Timelogs]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Guard: Juan Dela Cruz (G-001)          Period: Jan 1-15, 2024         │
│                                                                          │
│  DTR SUMMARY                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Date  │ Schedule │ Actual  │ Reg Hrs│ OT  │ ND  │ Status │ Remarks│  │
│  │───────┼──────────┼─────────┼────────┼─────┼─────┼────────┼────────│  │
│  │ Jan 1 │ 6A-6P    │ 6A-6P   │   8.0  │ 3.0 │ 0.0 │   ✓    │        │  │
│  │ Jan 2 │ 6A-6P    │ 6A-6P   │   8.0  │ 3.5 │ 0.0 │   ✓    │ OT     │  │
│  │ Jan 3 │ 6A-6P    │ 6A-6P   │   8.0  │ 3.0 │ 0.0 │   ✓    │ Manual │  │
│  │ Jan 4 │ 6A-6P    │ 6:30A-6P│   7.5  │ 3.0 │ 0.0 │   ✓    │ Late   │  │
│  │ Jan 5 │ OFF      │   -     │   0.0  │ 0.0 │ 0.0 │   ✓    │ Rest   │  │
│  │ Jan 6 │ 6A-6P    │ LEAVE   │   8.0  │ 0.0 │ 0.0 │ Leave  │ VL     │  │
│  │ Jan 7 │ 6P-6A    │ 6P-6A   │   8.0  │ 3.0 │ 8.0 │   ✓    │ Night  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ATTENDANCE SUMMARY                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Days Present: 13/15        Late Count: 1                        │  │
│  │ Days Absent: 0             Undertime Count: 0                    │  │
│  │ Days on Leave: 2           Perfect Attendance: No               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  HOURS BREAKDOWN                                                        │
│  ┌─────────────────────────────────────┬────────────────────────────┐  │
│  │ ACTUAL (For Payroll)                │ NORMALIZED (For Billing)   │  │
│  │─────────────────────────────────────┼────────────────────────────│  │
│  │ Regular Hours:        95.5          │ Billable Regular:    96.0  │  │
│  │ Overtime Hours:       18.5          │ Billable OT:         18.0  │  │
│  │ Night Differential:    8.0          │ Billable ND:          8.0  │  │
│  │ Leave Hours:          16.0          │ Billable Leave:      16.0  │  │
│  │ Total Hours:         138.0          │ Total Billable:     138.0  │  │
│  └─────────────────────────────────────┴────────────────────────────┘  │
│                                                                          │
│  [Print DTR] [Export] [Generate Timesheet] [Request Correction]         │
└────────────────────────────────────────────────────────────────────────┘
```

### 6. Timesheet Generation & Submission

```
┌────────────────────────────────────────────────────────────────────────┐
│  TIMESHEET GENERATION                                  [Back to Dashboard]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Pay Period: Jan 1-15, 2024              Status: Ready for Submission   │
│                                                                          │
│  BATCH SELECTION                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ □ Select All  [Filter: All ▼]  [Location: All ▼]  [Status: All ▼]│  │
│  │                                                                   │  │
│  │ □ │ Guard ID │ Name         │ Location │ Hours │ Status │ Action │  │
│  │───┼──────────┼──────────────┼──────────┼───────┼────────┼────────│  │
│  │ ☑ │ G-001    │ J. Dela Cruz │ Loc A    │ 138.0 │ Ready  │ [View]│  │
│  │ ☑ │ G-002    │ M. Santos    │ Loc A    │ 136.5 │ Ready  │ [View]│  │
│  │ ☐ │ G-003    │ P. Reyes     │ Loc B    │ 125.0 │ Incomp │ [Fix] │  │
│  │ ☑ │ G-004    │ A. Garcia    │ Loc B    │ 140.0 │ Ready  │ [View]│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  GENERATION SUMMARY                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Selected Guards: 3                                                │  │
│  │ Total Regular Hours: 409.5                                        │  │
│  │ Total Overtime Hours: 55.5                                        │  │
│  │ Total Night Diff: 24.0                                           │  │
│  │                                                                   │  │
│  │ Issues Detected:                                                  │  │
│  │ • 1 guard with incomplete DTRs                                    │  │
│  │ • 2 pending adjustment requests                                   │  │
│  │                                                                   │  │
│  │ ⚠️ Note: Cost amounts will be calculated by Payroll Officer      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  SUBMISSION OPTIONS                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Submission Notes:                                                 │  │
│  │ [3 timesheets ready for submission. All DTRs verified.________]   │  │
│  │                                                                   │  │
│  │ □ Include guards with warnings                                    │  │
│  │ □ Auto-fix minor discrepancies                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Save Draft] [Validate All] [Submit to HR Manager for Approval]        │
└────────────────────────────────────────────────────────────────────────┘
```

### 7. Leave Integration Interface

```
┌────────────────────────────────────────────────────────────────────────┐
│  LEAVE MANAGEMENT INTEGRATION                          [Back to Timelogs]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Guard: Juan Dela Cruz (G-001)          Year: 2024                     │
│                                                                          │
│  LEAVE BALANCES                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Leave Type        │ Entitled │ Used  │ Remaining │ Status         │  │
│  │───────────────────┼──────────┼───────┼───────────┼────────────────│  │
│  │ Vacation Leave    │   15.0   │  3.0  │   12.0    │ Available      │  │
│  │ Sick Leave        │   15.0   │  1.0  │   14.0    │ Available      │  │
│  │ Emergency Leave   │    3.0   │  0.0  │    3.0    │ Available      │  │
│  │ Paternity Leave   │    7.0   │  0.0  │    7.0    │ Available      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  APPROVED LEAVES FOR PERIOD                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Date     │ Type      │ Days │ Status   │ Applied to Timelog      │  │
│  │──────────┼───────────┼──────┼──────────┼─────────────────────────│  │
│  │ Jan 6    │ Vacation  │  1.0 │ Approved │ ✓ Applied               │  │
│  │ Jan 13   │ Sick      │  1.0 │ Approved │ ⏳ Pending              │  │
│  │ Jan 20   │ Vacation  │  2.0 │ Approved │ Future                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  APPLY LEAVE TO TIMELOG                                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Date: [Jan 13, 2024 ▼]                                           │  │
│  │ Current Status: Absent (No clock events)                         │  │
│  │                                                                   │  │
│  │ Apply Leave:                                                      │  │
│  │ Type: [Sick Leave ▼]                                             │  │
│  │ Hours: [8.0] (Full day)                                          │  │
│  │                                                                   │  │
│  │ [Apply Leave] [Skip] [Mark as Absent Without Pay]                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 8. Audit Trail & Change History

```
┌────────────────────────────────────────────────────────────────────────┐
│  TIMELOG AUDIT TRAIL                                   [Back to Timelog]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Guard: Juan Dela Cruz (G-001)          Date: January 4, 2024          │
│                                                                          │
│  CHANGE HISTORY                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Timestamp      │ User       │ Action          │ Details          │  │
│  │────────────────┼────────────┼─────────────────┼──────────────────│  │
│  │ Jan 4, 7:15 AM │ System     │ Clock Event     │ IN: 7:15 AM      │  │
│  │ Jan 4, 8:00 AM │ OPS-001    │ Manual Entry    │ Attempted 6:00 AM│  │
│  │ Jan 4, 9:30 AM │ TK-001     │ Adjustment Req  │ Request 6:30 AM  │  │
│  │ Jan 4, 10:00 AM│ OPS-002    │ Verified        │ Confirmed late   │  │
│  │ Jan 4, 11:00 AM│ HR-001     │ Approved        │ Adjusted to 6:30 │  │
│  │ Jan 4, 11:01 AM│ System     │ DTR Updated     │ Recalculated hrs │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  DETAILED CHANGE: Adjustment Request #ADJ-2024-0145                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Requested by: TK-001 (Timekeeper)                                │  │
│  │ Request Date: Jan 4, 2024 9:30 AM                                │  │
│  │                                                                   │  │
│  │ Original Value: 07:15 AM (Biometric)                             │  │
│  │ Requested Value: 06:30 AM                                        │  │
│  │ Reason: Traffic incident, supervisor approved early start        │  │
│  │                                                                   │  │
│  │ Verification:                                                     │  │
│  │ • Verified by: OPS-002                                           │  │
│  │ • Verification Note: Confirmed with supervisor                   │  │
│  │                                                                   │  │
│  │ Approval:                                                         │  │
│  │ • Approved by: HR-001                                            │  │
│  │ • Approval Note: Valid reason, documentation provided            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Export Audit Log] [Print] [View Related Changes]                      │
└────────────────────────────────────────────────────────────────────────┘
```

## Integration with Other Roles

### 1. OPS Integration

The Timekeeper receives from OPS:

- Manual clock event entries via Excel upload
- Schedule information for validation
- Initial timelog adjustments that need verification

```
OPS Workflow → Timekeeper Processing
- OPS creates manual entries
- OPS identifies missing clock events
- OPS initiates preliminary adjustments
- Timekeeper validates and processes
```

### 2. HR Manager Integration

The Timekeeper submits to HR Manager:

- Completed timesheets for approval
- Adjustment requests for final approval
- Exception reports for review

```
Timekeeper → HR Manager (First Hat)
- Submit timesheets for approval
- Submit adjustment requests
- Provide attendance summaries
```

### 3. Payroll Officer Integration

After HR Manager approval:

- Approved timesheets flow to Payroll Officer
- Payroll Officer applies rates (not visible to Timekeeper)
- Timekeeper provides hours only, no cost data

## Business Rules

### Clock Event Processing Rules

1. **Pairing Rules**
   - IN must precede OUT
   - Maximum 4 hours between break start/end
   - Overnight shifts span two dates
   - Unpaired events flagged for review

2. **Validation Rules**
   - Events must be within ±2 hours of schedule
   - Duplicate events (within 5 minutes) auto-merged
   - Future events rejected
   - Weekend/holiday rules applied

### Timelog Adjustment Rules

1. **Adjustment Limits**
   - Cannot adjust more than 2 hours from original
   - Cannot create time exceeding 24 hours/day
   - Cannot adjust to future time
   - Must have supporting documentation

2. **Approval Requirements**
   - All adjustments require three-tier approval
   - Adjustments affecting overtime need Controller review
   - Retroactive adjustments (>3 days) need escalation

### DTR Generation Rules

1. **Automatic Generation**
   - Triggered when timelog is approved
   - Calculates all hour types automatically
   - Applies schedule rules and exceptions
   - Separates actual vs normalized hours

2. **Recalculation Triggers**
   - Timelog adjustment approved
   - Schedule change applied
   - Leave application processed
   - Manual override by supervisor

### Timesheet Submission Rules

1. **Completeness Requirements**
   - All DTRs for period must exist
   - No pending adjustment requests
   - All leaves must be processed
   - Minimum 80% attendance (configurable)

2. **Submission Window**
   - Can submit 1 day before period end
   - Must submit within 2 days after period
   - Late submissions require justification
   - Rejected timesheets must be resubmitted within 24 hours

## Reporting Capabilities

### 1. Operational Reports

- Daily attendance summary
- Missing clock events report
- Adjustment request status
- Processing bottleneck analysis

### 2. Compliance Reports

- Perfect attendance tracking
- Tardiness and absences analysis
- Leave utilization report
- Overtime compliance check

### 3. Audit Reports

- All manual adjustments
- Change request history
- User activity log
- Data source analysis (biometric vs manual)

## Mobile Interface

```
┌─────────────────────┐
│ TIMEKEEPER MOBILE   │
├─────────────────────┤
│ Jan 15, 2024        │
│                     │
│ PENDING TASKS       │
│ ┌─────────────────┐ │
│ │ Timelogs: 25    │ │
│ │ Adjustments: 3  │ │
│ │ Timesheets: 12  │ │
│ └─────────────────┘ │
│                     │
│ QUICK ACTIONS       │
│ [Process Timelogs]  │
│ [Review Adjustments]│
│ [Submit Timesheets] │
│                     │
│ RECENT ACTIVITY     │
│ • G-001 adjusted    │
│ • G-023 DTR ready   │
│ • 15 events synced  │
└─────────────────────┘
```

## Security and Compliance

### Access Controls

- View-only access to clock events
- Edit access to timelogs (with audit)
- No access to cost/rate data
- Read access to schedules

### Audit Requirements

- Every timelog change logged
- Adjustment request full trail
- User actions timestamped
- Original values preserved

### Data Integrity

- Clock events immutable
- Timelogs versioned
- DTR regeneration tracked
- Timesheet snapshots maintained

## Implementation Priorities

### Phase 1: Core Processing

1. Clock event synchronization
2. Basic timelog creation
3. DTR generation
4. Simple timesheet creation

### Phase 2: Adjustment Workflow

1. Adjustment request system
2. Three-tier approval flow
3. Audit trail implementation
4. Change history tracking

### Phase 3: Leave Integration

1. Leave balance tracking
2. Leave application to timelogs
3. Attendance analytics
4. Leave reports

### Phase 4: Advanced Features

1. Automated anomaly detection
2. Predictive missing entries
3. Bulk processing tools
4. Advanced analytics

## Success Metrics

### Processing Efficiency

- Clock event to timelog: < 1 minute
- Timelog to DTR: < 30 seconds
- DTR to timesheet: < 2 minutes
- End-to-end processing: < 1 hour

### Data Quality

- Clock event capture rate: > 98%
- Timelog accuracy: > 99%
- Adjustment approval rate: > 95%
- First-pass timesheet approval: > 90%

### User Satisfaction

- Interface ease of use: > 4/5
- Processing time reduction: > 50%
- Error rate reduction: > 60%
- Manual intervention reduction: > 70%

## Conclusion

This Timekeeper Workflow System provides:

1. **Complete Data Pipeline** - From clock events to approved timesheets
2. **Robust Adjustment Process** - Three-tier approval with full audit trail
3. **Dual Time Tracking** - Actual hours for payroll, normalized for billing
4. **Leave Integration** - Seamless handling of absences and leaves
5. **Full Compliance** - Complete audit trail and approval workflows

The system maintains data integrity while focusing purely on hours rendered,
leaving cost calculations to the Payroll Officer as specified in the
requirements.
