# Operations (OPS) Workflow System

## Work Scheduling, Reliever Management & Manual Timelog Creation

## Executive Summary

Based on the **Updated Role Narratives - Payroll System (Revised)**, this
document provides a comprehensive workflow and UI design for the Operations
Officer role, focusing on three critical functions:

1. **Work Schedule Management** - Creating and managing guard schedules for pay
   periods
2. **Reliever Assignment System** - Handling temporary replacements when guards
   are unavailable
3. **Manual Timelog Creation** - Creating time records when no biometric clock
   events exist

## Operations Officer Role Overview

As defined in the Updated Role Narratives, the Operations Officer:

- Manages work schedules across all detachments
- Handles manual clock event data entry through controlled Excel uploads (backup
  system)
- Creates reliever schedules that override regular work schedules
- Ensures complete time data capture while maintaining schedule integrity
- Initiates change requests for time adjustments

## Core Workflow Components

### 1. Work Schedule Management

#### A. Schedule Types

**Regular Work Schedule**

- Permanent assignment of guards to specific shifts/locations
- Created for entire pay periods
- Serves as the baseline schedule
- Can be recurring or custom per period

**Reliever Schedule**

- Temporary override assignments
- Takes precedence over regular schedule
- Created for specific dates when regular guard unavailable
- Tracks both replaced guard and reliever guard

#### B. Schedule Creation Workflow

```
SCHEDULE CREATION FLOW
═══════════════════════════════════════

Select Pay Period
    ↓
Choose Schedule Type
├─ New Schedule → Create from scratch
├─ Copy Previous → Duplicate and modify
└─ Template → Use saved template
    ↓
Define Coverage Requirements
    ↓
Assign Guards to Shifts
    ↓
Validate Coverage
    ↓
Submit for Approval
    ↓
HR Manager Reviews
    ↓
Schedule Active
```

### 2. Reliever Assignment System

#### A. Reliever Trigger Events

- Guard absence (sick leave, vacation, emergency)
- Guard termination or suspension
- Special assignment requiring temporary replacement
- Training or meeting attendance

#### B. Reliever Assignment Process

```
RELIEVER ASSIGNMENT FLOW
═══════════════════════════════════════

Absence Notification Received
    ↓
Identify Coverage Gap
    ↓
Check Available Guards
├─ Same Location Pool
├─ Nearby Location Pool
└─ Standby/Float Pool
    ↓
Select Reliever
    ↓
Verify Qualifications
├─ Required Certifications
├─ Shift Compatibility
└─ No Schedule Conflicts
    ↓
Create Reliever Assignment
    ↓
Notify Affected Parties
├─ Reliever Guard
├─ Site Supervisor
└─ Payroll System
    ↓
Update Schedules
```

### 3. Manual Timelog Creation

#### A. When Manual Timelogs Are Required

As per the Updated Role Narratives:

- Biometric device failure
- Guard unable to scan (injury, device issue)
- Power outage at site
- Network connectivity issues preventing sync
- New guard not yet enrolled in biometric system
- Emergency deployment without biometric access

#### B. Manual Timelog Creation Process

```
MANUAL TIMELOG FLOW
═══════════════════════════════════════

Identify Missing Clock Events
    ↓
Verify Guard Was Present
├─ Check Schedule
├─ Supervisor Confirmation
└─ Supporting Documentation
    ↓
Create Manual Timelog Entry
    ↓
Enter Time Details
├─ Clock In Time
├─ Clock Out Time
├─ Break Times
└─ Overtime (if applicable)
    ↓
Document Reason
    ↓
Attach Evidence
    ↓
Submit for Verification
    ↓
Timekeeper Reviews
    ↓
Create Clock Events
```

## User Interface Design

### 1. OPS Dashboard - Main Screen

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OPERATIONS MANAGEMENT SYSTEM                           [User] [Logout] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Current Pay Period: Jan 1-15, 2024              [Change Period ▼]      │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    OPERATIONS OVERVIEW                            │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐   │  │
│  │  │ Scheduled   │  │  Coverage   │  │  Relievers  │  │ Missing │   │  │
│  │  │    523      │  │    98.5%    │  │     12      │  │   5     │   │  │
│  │  │   Guards    │  │   Current   │  │   Active    │  │ Timelogs│   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  QUICK ACTIONS                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ [📅 Manage Schedules] [👥 Assign Relievers] [⏰ Create Timelogs  │  │
│  │ [📊 Coverage Report]  [⚠️ View Alerts]     [📤 Excel Upload]     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ALERTS & NOTIFICATIONS                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ 3 positions require relievers for tomorrow                    │  │
│  │ 🔴 Biometric device offline at Location A - Manual entry needed  │  │
│  │ ⏰ 5 guards missing clock events for today                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Work Schedule Management Interface

```
┌───────────────────────────────────────────────────────────────────────────┐
│  WORK SCHEDULE MANAGEMENT                              [Back to Dashboard]│
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Pay Period: [Jan 1-15, 2024 ▼]    View: [Week ▼]    [Create Schedule]    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Location Filter: [All ▼]  Shift: [All ▼]  Status: [Scheduled ▼]     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  SCHEDULE GRID                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │         │ Jan 1 │ Jan 2 │ Jan 3 │ Jan 4 │ Jan 5 │ Jan 6 │ Jan 7  │     │
│  │─────────┼───────┼───────┼───────┼───────┼───────┼───────┼────────│     │
│  │Location A                                                        │     │
│  │ Day     │ G-001 │ G-001 │ G-001 │ G-001 │ G-001 │ G-002 │ G-002  │     │
│  │         │ G-003 │ G-003 │ G-003 │ G-003 │ G-003 │ G-004 │ G-004  │     │
│  │ Night   │ G-005 │ G-005 │ G-005 │ G-005 │ G-005 │ G-006 │ G-006  │     │
│  │         │ G-007 │ G-007 │ R-008*│ G-007 │ G-007 │ G-008 │ G-008  │     │
│  │─────────┼───────┼───────┼───────┼───────┼───────┼───────┼────────│     │
│  │Location B                                                        │     │
│  │ Day     │ G-009 │ G-009 │ G-009 │ G-009 │ G-009 │ G-010 │ G-010  │     │
│  │ Night   │ G-011 │ G-011 │ G-011 │ G-011 │ G-011 │ G-012 │ G-012  │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  Legend: [R-XXX* = Reliever Assignment]  [🔴 = Absent]  [✓ = Present]    │
│                                                                           │
│  ACTIONS: [Copy Schedule] [Print] [Export] [Submit for Approval]          │
└───────────────────────────────────────────────────────────────────────────┘
```

### 3. Reliever Assignment Interface

```
┌──────────────────────────────────────────────────────────────────────────┐
│  RELIEVER ASSIGNMENT                                   [Back to Schedule]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  COVERAGE GAP DETAILS                                                    │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │ Original Guard: Juan Dela Cruz (G-007)                            │   │
│  │ Location: Location A - Main Gate                                  │   │
│  │ Shift: Night (18:00 - 06:00)                                      │   │
│  │ Date: January 3, 2024                                             │   │
│  │ Reason: Sick Leave                                                │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  AVAILABLE RELIEVERS                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ Select │ Guard ID │ Name          │ Current Location │ Status    │    │
│  │────────┼──────────┼───────────────┼─────────────────┼────────────│    │
│  │   ○    │ G-008    │ Pedro Santos  │ Location A      │ Off-duty   │    │
│  │   ●    │ G-015    │ Maria Reyes   │ Float Pool      │ Available  │    │
│  │   ○    │ G-022    │ Jose Garcia   │ Location B      │ Day Off    │    │
│  │   ○    │ G-031    │ Ana Lopez     │ Standby         │ Available  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  SELECTED RELIEVER DETAILS                                               │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ Guard: Maria Reyes (G-015)                                       │    │
│  │ Qualifications: ✓ Night Shift Certified  ✓ Location A Trained   │    │
│  │ Last Assignment: Dec 30, 2023 - Location C                       │    │
│  │ Total Hours This Period: 96/192                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Additional Notes: [_____________________________________________]       │
│                                                                          │
│  [Cancel]  [Save as Draft]  [Assign Reliever]                            │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4. Manual Timelog Creation Interface

```
┌────────────────────────────────────────────────────────────────────────────┐
│  MANUAL TIMELOG CREATION                               [Back to Dashboard] │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ⚠️ Manual timelogs should only be created when biometric data unavailable │
│                                                                            │
│  GUARD SELECTION                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │ Guard ID: [G-___________]  OR  Name: [Search_______________] 🔍   │     │
│  │                                                                   │     │
│  │ Selected: Juan Dela Cruz (G-001)                                  │     │
│  │ Position: Guard | Location: A | Scheduled: Day Shift              │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                            │
│  TIME ENTRY DETAILS                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │ Date: [Jan 3, 2024 ▼]                                             │     │
│  │                                                                   │     │
│  │ Work Times:                                                       │     │
│  │   Clock In:  [06:00] AM    Clock Out: [06:00] PM                  │     │
│  │                                                                   │     │
│  │ Break Times (Optional):                                           │     │
│  │   Break Start: [12:00] PM   Break End: [01:00] PM                 │     │
│  │                                                                   │     │
│  │ Overtime (Optional):                                              │     │
│  │   □ Has Overtime                                                  │     │
│  │   OT Start: [--:--] --     OT End: [--:--] --                     │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                            │
│  REASON FOR MANUAL ENTRY                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │ Reason: [Biometric Device Failure ▼]                              │     │
│  │         • Biometric Device Failure                                │     │
│  │         • Power Outage                                            │     │
│  │         • Network Connectivity Issue                              │     │
│  │         • Fingerprint Not Recognized                              │     │
│  │         • New Guard - Not Enrolled                                │     │
│  │         • Emergency Deployment                                    │     │
│  │         • Other                                                   │     │
│  │                                                                   │     │
│  │ Details: [________________________________________________________│     │
│  │          _________________________________________________________│     │
│  │          _______________________________________________________] │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                            │
│  SUPPORTING DOCUMENTATION                                                  │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │ □ Supervisor Confirmation                                         │     │
│  │ □ Manual Logbook Entry                                            │     │
│  │ □ Incident Report                                                 │     │
│  │ □ Other: [_________________]                                      │     │
│  │                                                                   │     │
│  │ Upload Files: [Choose Files] No files selected                    │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                            │
│  [Cancel]  [Save as Draft]  [Submit for Verification]                      │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5. Batch Manual Timelog Entry

```
┌───────────────────────────────────────────────────────────────────────────┐
│  BATCH MANUAL TIMELOG ENTRY                            [Single Entry Mode]│
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Location: [Location A ▼]  Detachment: [Main Gate ▼]  Date: [Jan 3 ▼]     │
│  Reason: [Biometric Device Failure ▼]                                     │
│                                                                           │
│  BATCH ENTRY GRID                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ Guard ID │ Name         │ In    │ Out   │ Break │ OT    │ Status │     │
│  │──────────┼──────────────┼───────┼───────┼───────┼───────┼────────│     │
│  │ G-001    │ J. Dela Cruz │ 06:00 │ 18:00 │ 12-13 │ --    │ ✓      │     │
│  │ G-003    │ M. Santos    │ 06:15 │ 18:00 │ 12-13 │ --    │ ✓      │     │
│  │ G-005    │ P. Reyes     │ 18:00 │ 06:00 │ 00-01 │ --    │ ✓      │     │
│  │ G-007    │ A. Garcia    │ 18:00 │ --:-- │ --    │ --    │ ⚠️     │     │
│  │ [Add Row]                                                        │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  Common Documentation: [_____________________________________________]    │
│  Supervisor: [________________]  Contact: [_________________________]     │
│                                                                           │
│  [Validate All]  [Save Draft]  [Submit Batch]                             │
└───────────────────────────────────────────────────────────────────────────┘
```

### 6. Schedule Coverage Analysis

```
┌──────────────────────────────────────────────────────────────────────────┐
│  COVERAGE ANALYSIS                                     [Back to Schedule]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Period: Jan 1-15, 2024                     Filter: [All Locations ▼]    │
│                                                                          │
│  COVERAGE SUMMARY                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │ Location    │ Required │ Scheduled │ Actual │ Coverage % │ Status │   │
│  │─────────────┼──────────┼───────────┼────────┼────────────┼────────│   │
│  │ Location A  │    8     │     8     │   7    │   87.5%    │   ⚠️   │   │
│  │ Location B  │    4     │     4     │   4    │   100%     │   ✓    │   │
│  │ Location C  │    6     │     6     │   6    │   100%     │   ✓    │   │
│  │ Location D  │    2     │     2     │   1    │   50%      │   🔴   │   │
│  │─────────────┼──────────┼───────────┼────────┼────────────┼────────│   │
│  │ TOTAL       │   20     │    20     │  18    │   90%      │   ⚠️   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  CRITICAL GAPS                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ Date/Time         │ Location    │ Position │ Action Required     │    │
│  │───────────────────┼─────────────┼──────────┼─────────────────────│    │
│  │ Jan 3, 18:00     │ Location A  │ Guard    │ [Assign Reliever]    │    │
│  │ Jan 5, 06:00     │ Location D  │ Guard    │ [Assign Reliever]    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  [Export Report]  [Email Alerts]  [Auto-Assign Relievers]                │
└──────────────────────────────────────────────────────────────────────────┘
```

## Integration with Existing Systems

### 1. Integration with Timekeeper Role

As per the Updated Role Narratives, the Operations Officer's manual entries flow
to the Timekeeper:

```
Operations Manual Entry → Timekeeper Processing → HR Manager Approval
```

The Timekeeper:

- Receives manual clock events from Operations
- Validates against schedules
- Creates time pairs
- Generates DTR and timesheets

### 2. Integration with HR Manager

The HR Manager (wearing first hat):

- Approves work schedules created by Operations
- Reviews reliever assignments for policy compliance
- Approves timesheets containing manual entries

### 3. Integration with Payroll Processing

Manual timelogs and reliever assignments impact:

- Contract rate application (different rates for relievers)
- Overtime calculations
- Location-based differentials

## Business Rules

### Schedule Management Rules

1. **Schedule Creation**
   - Must cover entire pay period
   - All required positions must be filled
   - Cannot have gaps in critical positions
   - Must be approved before pay period starts

2. **Schedule Modifications**
   - Changes after approval require change request
   - Must maintain minimum coverage levels
   - Cannot exceed maximum hours per guard

### Reliever Assignment Rules

1. **Eligibility**
   - Guard must be qualified for position
   - Cannot exceed maximum weekly hours
   - Must not conflict with existing assignments
   - Priority to same-location guards

2. **Approval Requirements**
   - Automatic approval for pre-approved relievers
   - Manager approval for cross-location assignments
   - HR approval for overtime implications

### Manual Timelog Rules

1. **Creation Restrictions**
   - Only when biometric unavailable
   - Must have valid reason code
   - Requires supporting documentation
   - Cannot create for future dates

2. **Validation Requirements**
   - Times must align with scheduled shift (±30 minutes)
   - Cannot exceed 24 hours in a day
   - Break times must be within shift hours
   - Overtime requires authorization reference

3. **Approval Workflow**
   - Operations creates → Timekeeper verifies → HR Manager approves
   - Rejected entries must be corrected within 24 hours
   - Approved entries generate clock events

## Reporting Capabilities

### 1. Schedule Reports

- Daily deployment roster
- Weekly coverage summary
- Guard utilization report
- Overtime projection

### 2. Reliever Reports

- Reliever usage frequency
- Cost impact analysis
- Coverage gap trends
- Guard availability matrix

### 3. Manual Entry Reports

- Manual entry frequency by location
- Biometric failure tracking
- Reason code analysis
- Approval turnaround time

## Mobile Interface (Responsive Design)

### Mobile Schedule View

```
┌─────────────────────┐
│ OPS MOBILE          │
├─────────────────────┤
│ Jan 3, 2024         │
│                     │
│ Coverage: 95%       │
│ Gaps: 2             │
│                     │
│ LOCATION A          │
│ ┌─────────────────┐ │
│ │ Day: 4/4 ✓      │ │
│ │ Night: 3/4 ⚠️   │ │
│ │ [View][Assign]  │ │
│ └─────────────────┘ │
│                     │
│ LOCATION B          │
│ ┌─────────────────┐ │
│ │ Day: 2/2 ✓      │ │
│ │ Night: 2/2 ✓    │ │
│ │ [View]          │ │
│ └─────────────────┘ │
│                     │
│ [+ Manual Timelog]  │
│ [View Alerts (3)]   │
└─────────────────────┘
```

## Security and Audit Controls

### 1. Access Controls

- Role-based permissions for schedule creation
- Approval hierarchy enforcement
- Read-only access for non-authorized users

### 2. Audit Trail

All actions logged with:

- User ID and timestamp
- Before/after values for changes
- Reason codes for manual entries
- Approval chain documentation

### 3. Data Validation

- Prevent duplicate assignments
- Validate qualification requirements
- Check schedule conflicts
- Ensure coverage minimums

## Implementation Priorities

### Phase 1: Core Scheduling

1. Work schedule creation interface
2. Basic assignment functionality
3. Coverage validation
4. Schedule approval workflow

### Phase 2: Reliever Management

1. Reliever assignment interface
2. Availability tracking
3. Qualification verification
4. Notification system

### Phase 3: Manual Timelog

1. Single entry interface
2. Batch entry capability
3. Document upload
4. Integration with Timekeeper

### Phase 4: Analytics & Optimization

1. Coverage analytics
2. Auto-assignment suggestions
3. Predictive gap analysis
4. Cost optimization tools

## Success Metrics

### Operational Metrics

- Schedule creation time: < 30 minutes per period
- Reliever assignment time: < 5 minutes per assignment
- Manual timelog accuracy: > 98%
- Coverage achievement: > 95%

### Quality Metrics

- First-pass approval rate: > 90%
- Manual entry error rate: < 2%
- Schedule conflict incidents: < 1%
- Guard overtime compliance: 100%

### User Satisfaction

- UI ease of use score: > 4/5
- Process efficiency rating: > 4/5
- Error reduction: > 50%
- Time savings: > 40%

## Conclusion

This comprehensive OPS workflow system addresses all identified gaps:

1. **Structured Work Scheduling** - Complete schedule management with approval
   workflow
2. **Intelligent Reliever Assignment** - Automated suggestions with
   qualification matching
3. **Controlled Manual Timelog Creation** - Validated entry with proper
   documentation
4. **Full Integration** - Seamless flow to Timekeeper and payroll processing
5. **Audit Compliance** - Complete trail of all schedule and time modifications

The system ensures operational efficiency while maintaining data integrity and
compliance with the payroll system requirements outlined in the Updated Role
Narratives.
