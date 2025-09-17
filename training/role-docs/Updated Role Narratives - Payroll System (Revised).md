# **Updated Role Narratives - Payroll System (Revised)**

_Last Updated: \[Sep 2\]_

## **Executive Summary of Key Changes**

This document incorporates critical updates to the payroll system workflow,
introducing clearer role delineations, enhanced approval processes, and new data
entry methods. The primary changes include:

- **Guard interaction documented**: Biometric clock events via Android

  > mobile sync

- **Dual Approval System**: HR Manager approves all timesheets; then as

  > Payroll Manager provides final payroll approval (same person, two hats)

- **Change Request Management System**: Three-tier approval (Requester →

  > Verifier → Approver) for all data modifications

- Introduction of the **Verifier** role for review processes

- Revised responsibilities for Payroll Officer (focused on contracted

  > hours)

- Enhanced Controller role with financial review responsibilities

- **HR Manager/Payroll Manager** - Same person performing dual approval

  > roles

- Biometric system as primary clock event source with Excel backup

- Dual timesheet tracking (actual vs. normalized)

- Comprehensive audit trail requirements

**IMPORTANT NOTE**: The HR Manager and Payroll Manager roles are performed by
the **same person** wearing two different hats. These are presented as separate
roles to emphasize the distinct approval responsibilities at different stages of
the payroll process - timesheet approval (HR Manager hat) and final payroll
approval (Payroll Manager hat). This same person also serves as the final
approver for all change requests in the system.

## **1. Guard Narrative (System Subject) - NEW** {#guard-narrative-system-subject---new}

### **Overview & System Interaction** {#overview-system-interaction}

Guards are the primary subjects of the payroll system, providing time and
attendance data through biometric devices. While not direct system users, guards
interact with the system through biometric registration and daily clock events
that form the foundation of all payroll processing.

### **Key Activities**

#### **A. Biometric Registration** {#a.-biometric-registration}

- **Initial Enrollment**:
  - Register fingerprint templates at the biometric device

  - Provide multiple fingerprint samples for accuracy

  - Templates stored in biometric device memory

  - Linked to Guard ID in the system

- **Template Management**:
  - Re-registration if fingerprints are unclear

  - Update templates if needed due to injury or wear

  - Backup finger registration for contingency

#### **B. Daily Clock Events** {#b.-daily-clock-events}

- **Clock-In Process**:
  - Place finger on biometric scanner at start of shift

  - Device validates fingerprint against stored template

  - Creates time-stamped clock-in event

  - Receives confirmation (beep/light) from device

- **Clock-Out Process**:
  - Same process at end of shift

  - Creates corresponding clock-out event

  - Completes the time pair for the day

#### **C. Break and Overtime Recording** {#c.-break-and-overtime-recording}

- Clock out/in for meal breaks if required

- Record overtime start/end with biometric scan

- Multiple clock events per day as needed

### **Technical Flow**

#### **Biometric to System Data Flow**

1.  **At the Biometric Device**:
    - Guard scans fingerprint

    - Device validates and creates clock event

    - Event includes: Guard ID, timestamp, event type (IN/OUT), device
      > ID (is associated with the detachment on the backend)

2.  **Transfer to Mobile Device**:
    - Biometric device is connected to the Android mobile phone

    - Clock events transferred to mobile app

    - Mobile app stores events locally

3.  **System Synchronization**:
    - **If Connected to Internet**:
      - Real-time transmission of clock events

      - Immediate creation in system database

      - Instant availability for processing

    - **If Offline**:
      - Events stored on mobile device

      - Batch upload when connection restored

      - System processes accumulated events

4.  **Data Processing**:
    - System receives clock events

    - Validates and stores in database

    - Available for Timekeeper processing

    - Becomes part of DTR and timesheet generation

### **Guard Responsibilities**

#### **Required Actions**

- Register fingerprints during onboarding

- Clock in at start of each shift

- Clock out at end of each shift

- Record breaks as per company policy

- Report biometric device issues to supervisor

#### **Best Practices**

- Arrive early enough to clock in before shift start

- Ensure clean, dry fingers for accurate scanning

- Wait for confirmation before leaving device

- Report to Operations if unable to clock in/out

- Keep backup documentation if device fails

### **Exception Handling**

#### **When Biometric Fails**

- Report to immediate supervisor

- Manual entry through Operations Officer

- Excel upload process as backup

- Maintain manual logbook as evidence

#### **Forgotten Clock Events**

- Report missing punch immediately

- Provide written explanation

- Operations Officer creates manual entry

- Subject to approval process

### **System Feedback to Guards**

#### **Available Information**

- Confirmation of successful clock events (device beep/light)

- Payslip showing recorded hours

- Access to timesheet summary (if provided)

- Notification of timesheet discrepancies

#### **What Guards Cannot Do**

- Cannot modify clock events directly

- Cannot access system interfaces

- Cannot approve or change timesheets

- Cannot view other guards\' data

### **Integration with Other Roles**

- **With Operations Officer**:
  - Report device failures

  - Provide manual time records when needed

  - Receive schedule assignments

- **With Timekeeper**:
  - Clock events processed into timesheets

  - Discrepancies communicated through supervisor

- **With HR Officer**:
  - Initial biometric enrollment

  - Re-registration when needed

  - Updates to personal information

### **Mobile App Architecture**

#### **Android Application Functions**

- **Device Communication**: Bluetooth/USB connection to biometric device

- **Local Storage**: SQLite database for offline events

- **Sync Engine**:
  - Queue management for pending events

  - Retry logic for failed transmissions

  - Conflict resolution for duplicate events

- **Network Detection**: Auto-sync when internet available

- **Data Compression**: Optimize transmission bandwidth

- **Security**: Encrypted data transmission

#### **Data Synchronization Protocol**

1.  Continuous monitoring of biometric device

2.  Immediate capture of new clock events

3.  Check network availability

4.  If online: Push to server immediately

5.  If offline: Store in local queue

6.  Periodic sync attempts (every 5 minutes)

7.  Batch upload when connection restored

8.  Server acknowledgment and cleanup

### **Biometric Device Specifications**

#### **Hardware Requirements**

- Fingerprint scanner with minimum 500 DPI

- Internal memory for template storage

- Real-time clock for accurate timestamps

- Battery backup for power outages

- LED/Audio feedback system

#### **Data Captured**

- Guard ID (linked to fingerprint)

- Timestamp (date and time to the second)

- Event type (IN/OUT/BREAK) (need to setup rule/s for these)

- Device ID (for location tracking)

- Quality score (fingerprint match confidence)

### **Quality Assurance**

#### **For Guards**

- Proper fingerprint registration ensures accurate clocking

- Consistent use of same finger improves recognition

- Report issues promptly to avoid payroll problems

#### **System Validation**

- Duplicate prevention (minimum time between events)

- Logical sequence validation (IN must precede OUT)

- Time boundary checks (within reasonable hours)

- Device location verification

## **2. Operations Officer Narrative (User-Facing) - ENHANCED** {#operations-officer-narrative-user-facing---enhanced}

### **Overview & Collaboration** {#overview-collaboration}

The Operations Officer manages work schedules across all detachments and handles
manual clock event data entry through controlled Excel uploads when biometric
systems fail or guards cannot clock in/out properly. This role ensures complete
time data capture while maintaining schedule integrity.

### **Key Responsibilities**

#### **A. Work Schedule Management** {#a.-work-schedule-management}

- **Create Work Schedules**: Build comprehensive guard schedules for

  > each pay period

- **Manage Reliever Schedules**: Handle schedule overrides that

  > overwrite regular work schedule assignments

- **Schedule Optimization**: Ensure all posts are properly covered

- **Schedule Monitoring**: Track schedule adherence and coverage levels

#### **B. Manual Clock Event Data Entry (BACKUP SYSTEM)** {#b.-manual-clock-event-data-entry-backup-system}

- **Excel-Based Time Entry** (when biometric fails):
  - Maintain controlled Excel files for each detachment

  - Enter manual time-in and time-out data for guards who couldn\'t use

    > biometric

  - Upload Excel files to system for processing

  - Ensure data accuracy before submission

- **Exception Handling**: Document reasons for manual entry

- **Data Validation**: Verify completeness of manual clock events before

  > upload

- **Detachment-Specific Management**: Separate Excel file for each
  > detachment/sub-area

#### **C. Change Request Initiation** {#c.-change-request-initiation}

- **Request Time Adjustments**:
  - Submit clock-in/out corrections when errors identified

  - Provide supporting documentation (guard statements, logs)

  - Track status of submitted requests

- **Serve as Verifier**:
  - May verify time adjustment requests from Timekeeper

  - Review schedule modification requests

  - Forward verified requests to HR/Payroll Manager

#### **D. Schedule Types** {#d.-schedule-types}

- **Work Schedule**: Regular guard assignments to shifts and positions

- **Reliever Schedule**: Temporary overrides to work schedule when

  > guards are unavailable

- Both schedules work together, with reliever schedule taking precedence
  > when applicable

### **UI Flows & Screens** {#ui-flows-screens}

#### **Manual Clock Event Excel Upload Interface**

1.  **When to Use**:
    - Biometric device failure

    - Guard unable to scan (injury, device issue)

    - Power outage at site

    - Network connectivity issues preventing sync

2.  **Detachment Selection**: Choose specific detachment for data entry

3.  **Download Template**: Get pre-formatted Excel template

4.  **Data Entry Fields**:
    - Guard ID/Name

    - Date

    - Actual Time-In

    - Actual Time-Out

    - Reason for Manual Entry

    - Supporting Documentation Reference

5.  **Upload Process**:
    - Validate Excel format

    - Preview data before submission

    - System processes as biometric equivalent

    - Confirmation of successful upload

#### **Work Schedule Dashboard**

- Visual calendar with both regular and reliever schedules

- Coverage analysis showing scheduled vs. actual coverage

- Quick access to Excel upload for manual entries

- Biometric sync status indicator per detachment

### **Integration with Biometric System**

- Monitor biometric device status per location

- Receive alerts when devices are offline

- Coordinate with IT for device maintenance

- Ensure guards have alternative clock-in methods

### **Audit Requirements**

- All manually entered clock events tracked with user ID and timestamp

- Reason codes required for all manual entries

- Excel upload history maintained for each detachment

- Changes to schedules logged with before/after values

- Documentation of biometric failure incidents

## **2. Finance Officer Narrative (User-Facing)** {#finance-officer-narrative-user-facing}

### **Overview & Collaboration** {#overview-collaboration-1}

The Finance Officer manages all contract rates based on detachment, sub-areas,
shift positions of guards. Works closely with the Payroll Officer who applies
these rates to contracted hours.

### **Key Responsibilities**

#### **A. Contract Rate Management** {#a.-contract-rate-management}

- **Define Rate Structures**:
  - Set rates per detachment and sub-area

  - Configure shift-specific rates (Day/Night/etc.)

  - Establish position-based rates

  - Set up rate tiers and categories

- **Rate Application Rules**: Define how rates apply to different

  > scenarios

- **Maintain Rate History**: Track all changes with effective dates

#### **B. Rate Change Requests** {#b.-rate-change-requests}

- **Initiate Rate Changes**:
  - Submit contract rate change requests

  - Provide justification and supporting documentation

  - Include contract references and effective dates

- **Track Request Status**: Monitor approval progress

- **Implement Approved Changes**: Update rates after approval

#### **C. Rate Components** {#c.-rate-components}

- Base hourly/daily rates for contracted hours

- Overtime multipliers

- Night differential rates

- Holiday premium rates

- Special assignment rates

### **UI Flows & Screens** {#ui-flows-screens-1}

#### **Rate Configuration Matrix**

- Grid showing rates by: Detachment × Sub-area × Shift × Position

- Effective date management for rate changes

- Bulk rate update capabilities

- Rate comparison tools

### **Approval Workflow**

- All rate changes require approval before activation

- Complete audit trail of rate modifications

- Integration with Payroll Officer for rate application

## **3. HR Officer Narrative (User-Facing)** {#hr-officer-narrative-user-facing}

### **Overview & Collaboration** {#overview-collaboration-2}

The HR Officer maintains all HR-related master data including guard information,
detachment lists, and employee details. Does not directly handle payroll
computations but provides essential data for payroll processing.

### **Key Responsibilities**

#### **A. Master Data Management** {#a.-master-data-management}

- **Guard Information**:
  - Complete guard profiles and personal information

  - Employment history and status

  - License and certification tracking

  - Emergency contacts

- **Detachment Management**: Maintain list of all detachments and

  > sub-areas

- **Employee Documentation**: Store and track all HR-related documents

#### **B. HR-Specific Functions** {#b.-hr-specific-functions}

- Process leave applications and approvals

- Maintain training records

- Track guard assignments history

- Manage terminations and rehires

### **Separation from Payroll Functions**

- HR Officer does NOT handle pay periods (Payroll Officer

  > responsibility)

- Does NOT process payroll calculations

- Focuses purely on HR data maintenance

## **4. Payroll Officer Narrative (User-Facing) - SIGNIFICANTLY REVISED** {#payroll-officer-narrative-user-facing---significantly-revised}

### **Overview & Collaboration** {#overview-collaboration-3}

The Payroll Officer focuses primarily on **contracted hours and base pay
calculations**, working with approved timesheets to process regular payroll.
Handles the setup and management of pay periods and can make decisions about
deduction deferrals when pay falls below floor values.

### **Key Responsibilities**

#### **A. Contracted Hours Processing (PRIMARY FOCUS)** {#a.-contracted-hours-processing-primary-focus}

- **Calculate Base Pay**:
  - Apply contract rates to total timesheet hours

  - Process regular hours at contracted rates

  - Calculate basic pay components

  - Ensure accurate TURP (Total Unit Rate Pay) calculations

#### **B. Pay Period Management** {#b.-pay-period-management}

- **Configure Pay Periods**: Set up pay period dates and parameters

- **Manage Pay Cycles**: Coordinate cutoff dates and payment schedules

- **Period Closures**: Finalize pay periods after processing

#### **C. Rate Application and Floor Management** {#c.-rate-application-and-floor-management}

- **Apply Contracted Rates**: Use Finance Officer\'s rates for base

  > calculations

- **Set Up Non-Contracted Rates**: Configure special rate scenarios (if

  > any)

- **Establish Floor Values**:
  - Define minimum payment thresholds

  - Flag payments below floor

  - Make decisions on low-pay scenarios

#### **D. Deduction Management (Limited)** {#d.-deduction-management-limited}

- **When Pay Falls Below Floor**:
  - Can waive scheduled loan payments

  - Can defer scheduled deductions

  - Can postpone government contributions

  - Options:
    - Auto-assign to next pay period (default)

    - Create additional payment schedule

    - Document waiver reasons

#### **E. Change Request Activities** {#e.-change-request-activities}

- **Initiate Payroll Adjustments**:
  - Submit deduction change requests

  - Request allowance modifications

  - Initiate government contribution corrections

- **Serve as Verifier**:
  - Verify contract rate change requests from Finance Officer

  - Review special rate applications

- **Track Request Status**: Monitor approval of submitted changes

#### **F. Payslip Generation** {#f.-payslip-generation}

- Generate individual payslips after all approvals

- Ensure all components are properly reflected

- Distribute payslips through appropriate channels

### **What Payroll Officer Does NOT Handle**

- Primary responsibility for non-contracted hours (Verifier/Controller

  > domain)

- Final approval of paysheets (Payroll Manager responsibility - same

  > person as HR Manager)

- Timesheet approvals (HR Manager responsibility - before payroll

  > processing begins)

- Direct interaction with the HR/Payroll Manager occurs at two points
  > (receiving approved timesheets and final payroll approval)

### **UI Flows & Screens** {#ui-flows-screens-2}

#### **Contracted Hours Processing Screen**

1.  **Hours Summary Tab**:
    - Total contracted hours from approved timesheet

    - Regular hours breakdown

    - Applicable contract rate display

2.  **Base Pay Calculation Tab**:
    - Automatic calculation of basic pay

    - Rate application details

    - TURP computation display

3.  **Floor Value Management Tab**:
    - Current pay vs. floor value

    - Deduction deferral options

    - Waiver documentation

#### **Deduction Deferral Interface**

- List of scheduled deductions

- Select items to defer/waive

- Choose deferral option:
  - Next pay period (automatic)

  - Custom schedule

  - Permanent waiver (with justification)

- Generate deferral report

### **Workflow Integration**

- Receives approved timesheets from HR Manager

- Processes contracted hours and base pay

- Submits to Verifier for non-contracted hours review

- Work flows through Controller to Payroll Manager (same person as HR

  > Manager) for final approval

- Coordinates with Admin for payslip generation after approval

- Note: Works with same person (HR/Payroll Manager) at two different
  > process stages

## **5. Verifier Narrative (NEW ROLE)** {#verifier-narrative-new-role}

### **Overview & Collaboration** {#overview-collaboration-4}

The Verifier serves as the critical review layer between the Payroll Officer and
Controller, focusing specifically on **non-contracted hours and deductions**.
This role ensures accuracy of all pay components beyond base salary.

### **Key Responsibilities**

#### **A. Non-Contracted Hours Review** {#a.-non-contracted-hours-review}

- **Verify All Deductions**:
  - Scheduled loan payments

  - Scheduled deductions

  - Government contributions (SSS, HDMF, PhilHealth)

  - Special deductions and adjustments

- **Review Calculations**: Ensure mathematical accuracy

- **Check Compliance**: Verify legal requirements are met

#### **B. Review Process** {#b.-review-process}

- Receive paysheets from Payroll Officer

- Review all non-contracted components

- Apply \"Reviewed\" status stamp

- Flag discrepancies for correction

- Forward to Controller for approval

#### **C. Change Request Verification** {#c.-change-request-verification}

- **Verify Payroll Adjustments**:
  - Review deduction change requests

  - Verify allowance adjustment requests

  - Check government contribution corrections

- **Validate Documentation**: Ensure supporting documents are complete

- **Forward to Approver**: Send verified requests to HR/Payroll Manager

- **Return if Incomplete**: Send back to requester with specific
  > requirements

#### **D. Quality Assurance** {#d.-quality-assurance}

- Cross-check deductions against schedules

- Verify government contribution rates

- Ensure proper application of deferrals/waivers

- Document review findings

- Maintain verification standards across all reviews

### **UI Flows & Screens** {#ui-flows-screens-3}

#### **Verification Dashboard**

- **Queue Management**:
  - Pending review items from Payroll Officer

  - In-progress reviews

  - Completed reviews awaiting Controller

- **Review Status Indicators**:
  - Clean (no issues found)

  - Flagged (issues requiring attention)

  - Returned (sent back to Payroll Officer)

#### **Detailed Review Screen**

1.  **Non-Contracted Components Tab**:
    - Loan payment schedules and applications

    - All deductions with calculations

    - Government contributions breakdown

2.  **Verification Tools**:
    - Calculator for manual verification

    - Reference tables for rates

    - Historical comparison data

3.  **Review Actions**:
    - Mark as Reviewed

    - Flag for Correction

    - Add Review Notes

    - Forward to Controller

#### **Audit Trail Interface**

- Document all review actions

- Track changes and corrections

- Maintain review history

- Generate review reports

### **Workflow Position**

- **Receives from**: Payroll Officer (after contracted hours processing)

- **Sends to**: Controller (for financial review)

- **Returns to**: Payroll Officer (if corrections needed)

- **Part of**: Multi-stage review leading to Payroll Manager approval
  > (same person as HR Manager)

## **6. Controller Narrative (User-Facing) - REVISED** {#controller-narrative-user-facing---revised}

### **Overview & Collaboration** {#overview-collaboration-5}

The Controller provides **financial review and validation** after the
Verifier\'s review, focusing on budget compliance and financial accuracy before
sending to the Payroll Manager for final approval.

### **Key Responsibilities**

#### **A. Financial Review Authority** {#a.-financial-review-authority}

- **Review Verified Paysheets**: Examine paysheets after Verifier review

- **Validate Total Payroll**: Ensure budget compliance

- **Check Fund Availability**: Confirm sufficient funds for disbursement

- **Financial Analysis**: Provide cost analysis and projections

#### **B. Financial Oversight** {#b.-financial-oversight}

- Review total payroll costs against budget

- Verify fund availability

- Analyze cost trends and variances

- Flag financial concerns for Payroll Manager

#### **C. Change Request Verification** {#c.-change-request-verification-1}

- **Verify High-Impact Changes**:
  - Government contribution corrections

  - Special rate applications

  - Large value adjustments

- **Financial Impact Assessment**: Calculate cost implications of

  > changes

- **Forward to HR/Payroll Manager**: Send financially validated requests
  > for approval

#### **D. Quality Control** {#d.-quality-control}

- Review of Verifier\'s work from financial perspective

- Spot-check high-value items

- Verify compliance with financial policies

- Prepare financial summary for Payroll Manager

### **UI Flows & Screens** {#ui-flows-screens-4}

#### **Financial Review Dashboard**

- **Multi-Level View**:
  - Summary of payroll totals

  - Department/detachment breakdowns

  - Budget vs. actual comparison

  - Financial approval queue

#### **Financial Review Screen**

1.  **Verifier\'s Review Summary**: See all flags and notes

2.  **Financial Impact Analysis**: Total costs and variances

3.  **Budget Compliance Check**: Available funds vs. required

4.  **Review Actions**:
    - Approve and Forward to Payroll Manager

    - Return to Verifier

    - Request Corrections

    - Add Financial Notes

### **Approval Workflow**

- **Receives from**: Verifier (reviewed paysheets)

- **Can return to**: Verifier or Payroll Officer

- **Forwards to**: Payroll Manager for final approval (same person as HR
  > Manager who approved timesheets)

## **7. Payroll Manager Narrative (SAME PERSON AS HR MANAGER)** {#payroll-manager-narrative-same-person-as-hr-manager}

### **Overview & Collaboration** {#overview-collaboration-6}

The Payroll Manager serves as the **final approval authority** for all payroll
disbursements, providing executive oversight after all processing, review, and
financial validation stages are complete. **This role is performed by the same
person who serves as HR Manager**, but represents a different approval
responsibility at a different stage of the process. While wearing the HR Manager
hat, this person approves timesheets; while wearing the Payroll Manager hat,
they provide final payroll approval.

### **Why Two Hats?**

- **Separation of Concerns**: Timesheet accuracy (HR Manager) vs.

  > payroll totals (Payroll Manager)

- **Different Focus**: Detail-level review (timesheets) vs.

  > executive-level approval (payroll)

- **Audit Trail**: Clear distinction between operational and financial

  > approvals

- **Timing**: Timesheet approval happens early; payroll approval happens
  > after all processing

### **Key Responsibilities (as Payroll Manager)**

#### **A. Final Payroll Approval** {#a.-final-payroll-approval}

- **Authorize Payroll Release**: Final sign-off for payment disbursement

- **Leverage Earlier Review**: Use knowledge from timesheet approval to

  > expedite final review

- **Executive Review**: High-level oversight of entire payroll process

- **Override Authority**: Make executive decisions on exceptional cases

- **Policy Compliance**: Ensure adherence to organizational payroll
  > policies

#### **B. Strategic Oversight** {#b.-strategic-oversight}

- **Review Summary Reports**: Examine consolidated payroll data

- **Compare to Timesheet Stage**: Verify consistency from timesheets to

  > final payroll

- **Approve Exceptions**: Authorize special payments or adjustments

- **Set Approval Policies**: Define thresholds and approval requirements

- **Quality Assurance**: Ensure overall payroll accuracy and
  > completeness

#### **C. Escalation Management** {#c.-escalation-management}

- **Handle Disputes**: Resolve escalated payroll issues with full

  > context

- **Approve Emergency Payments**: Authorize off-cycle payments when

  > needed

- **Policy Exceptions**: Approve deviations from standard procedures

  > with documentation

- **Final Rejection Authority**: Can reject entire payroll batches if

  > necessary

- **Cross-Reference**: Compare final amounts to approved timesheet hours

### **UI Flows & Screens** {#ui-flows-screens-5}

#### **Executive Approval Dashboard**

- **High-Level Summary**:
  - Total payroll amount for approval

  - Number of employees affected

  - Comparison to previous periods

  - Key metrics and KPIs

- **Approval Queue**: Prioritized list of payrolls awaiting final

  > approval

- **Exception Highlights**: Flagged items requiring attention

#### **Final Approval Interface**

1.  **Executive Summary View**:
    - Total payroll cost

    - Department breakdowns

    - Variance analysis

    - Controller\'s financial notes

2.  **Drill-Down Capabilities**:
    - View specific departments

    - Examine high-value payments

    - Review exception cases

3.  **Approval Actions**:
    - Approve for Disbursement

    - Reject with Reasons

    - Conditional Approval with Notes

    - Request Additional Review

#### **Audit and Compliance View**

- **Approval History**: Track all previous approvals

- **Policy Compliance Check**: Verify adherence to policies

- **Audit Trail**: Complete visibility of the approval chain

- **Sign-off Documentation**: Digital signature and timestamp

### **Workflow Integration**

- **Receives from**: Controller (financially reviewed paysheets)

- **Identity Note**: This is the same person who approved timesheets

  > earlier as HR Manager

- **Can return to**: Any previous stage for corrections

- **Final output**: Authorized payroll for disbursement

- **Triggers**: Payment processing and payslip generation

### **Decision Authority**

- Can approve entire payroll batches

- Can reject individual payments within a batch

- Can authorize partial payments

- Can approve emergency off-cycle payments

- Sets final approval before any funds are released

- Has complete visibility since they also approved the timesheets

- Can quickly identify issues having seen data at both stages

- Provides consistency in approval standards

### **Benefits of Dual Hat Approach**

- Single point of accountability for both HR and payroll aspects

- Deep understanding of issues from timesheet through to payment

- Faster resolution of discrepancies (same person saw both stages)

- Cost-effective for organizations

- Maintains control through two distinct approval points

- Reduces communication gaps between HR and Payroll functions

- Ensures consistent application of policies

### **Notification System**

- Receives alerts when payroll is ready for final approval

- Sends notifications upon approval/rejection

- Escalation alerts for time-sensitive approvals

- Summary reports post-approval

## **8. Timekeeper Narrative (User-Facing) - ENHANCED** {#timekeeper-narrative-user-facing---enhanced}

### **Overview & Collaboration** {#overview-collaboration-7}

The Timekeeper processes clock events from multiple sources (primarily biometric
via mobile sync, secondarily Excel uploads from Operations) and manages both
**actual** and **normalized** time records for accurate payroll and billing
purposes.

### **Key Responsibilities**

#### **A. Clock Event Processing** {#a.-clock-event-processing}

- **Process Multiple Sources**:
  - **Primary**: Biometric clock events synced via Android mobile

    > devices

  - **Secondary**: Excel uploads from Operations (for

    > exceptions/failures)

  - Mobile app clock events (if applicable)

- **Data Validation**: Ensure all clock events are valid regardless of

  > source

- **Create Time Pairs**: Match IN/OUT events

- **Source Tracking**: Maintain record of clock event origin (biometric
  > vs. manual)

#### **B. Change Request Activities** {#b.-change-request-activities}

- **Initiate Time Adjustments**:
  - Submit clock-in/out correction requests when anomalies detected

  - Request missing punch additions

  - Provide detailed justification for changes

- **Serve as Verifier**:
  - Verify time adjustment requests from Operations Officer

  - Review schedule modification impacts on time records

  - Validate supporting documentation

- **Track Request Status**: Monitor approval of time-related changes

#### **C. Dual Timesheet Management** {#c.-dual-timesheet-management}

- **Actual Time Records**:
  - Raw time-in and time-out as recorded

  - Used for payroll calculations

  - Includes absences, tardiness, undertime

- **Normalized Time Records**:
  - Adjusted time for billing purposes

  - Client-presentable hours

  - May differ from actual for billing compliance

#### **D. Time Categorization** {#d.-time-categorization}

- Regular hours

- Overtime hours

- Night differential

- Holiday hours

- Leave hours

### **UI Flows & Screens** {#ui-flows-screens-6}

#### **Clock Event Management Dashboard**

- **Real-time Sync Monitor**:
  - Status of biometric devices per location

  - Pending sync queue from mobile devices

  - Successfully synced events counter

- **Source Overview**:
  - Percentage from biometric vs. manual entry

  - Alerts for locations with high manual entry rates

  - Device health indicators

#### **Dual Timesheet View**

1.  **Actual Time Tab**:
    - Raw clock events (biometric and manual)

    - Source indicator for each event

    - Actual hours worked

    - Tardiness/undertime/absences

    - For payroll processing

2.  **Normalized Time Tab**:
    - Billing-compliant hours

    - Client-facing time records

    - Adjustments documentation

3.  **Variance Analysis**:
    - Differences between actual and normalized

    - Justification for adjustments

    - Impact on payroll vs. billing

#### **Clock Event Processing Screen**

- View all incoming clock events in real-time

- Filter by source (biometric/manual/mobile)

- Validate and process events

- Flag anomalies for correction

- Generate DTR from processed events

### **Integration Points**

- Receives biometric data via system sync from mobile devices

- Receives Excel uploads from Operations Officer (backup method)

- Submits completed timesheets to HR Manager for approval

- After HR Manager approval, timesheets go to Payroll Officer

- Provides actual time for payroll processing

- Provides normalized time for billing to Finance

- All timesheets must pass HR Manager approval gate

## **9. HR Manager Narrative (User-Facing) - ENHANCED** {#hr-manager-narrative-user-facing---enhanced}

### **Overview & Collaboration** {#overview-collaboration-8}

The HR Manager serves as the **primary approval authority for timesheets**,
ensuring time record accuracy before payroll processing begins. **This same
person also serves as the Payroll Manager** for final payroll approval, wearing
two different hats at different stages of the process. This dual role provides
quality control at both the beginning (timesheet) and end (payroll) of the
process.

### **Dual Hat Responsibilities**

**As HR Manager (First Hat - Timesheet Stage):**

- Reviews and approves all timesheets before payroll processing

- Ensures time record accuracy and compliance

- Provides detailed feedback on timesheet issues

- Gates the entry of data into payroll system

**As Payroll Manager (Second Hat - Final Stage):**

- Provides final approval of complete payroll

- Reviews total payroll amounts and summaries

- Authorizes fund disbursement

- Makes executive decisions on payroll release

### **Key Responsibilities (as HR Manager)**

#### **A. Timesheet Approval Authority (PRIMARY FUNCTION)** {#a.-timesheet-approval-authority-primary-function}

- **Review All Timesheets**: Examine time records before payroll

  > processing

- **Approve/Reject Timesheet Entries**: Make decisions on timesheet

  > validity

- **Provide Detailed Rejection Feedback**: Specify exact corrections

  > needed

- **Monitor Resubmissions**: Track and approve corrected timesheets

- **Batch Approvals**: Process multiple timesheets efficiently

#### **B. Timesheet Quality Control** {#b.-timesheet-quality-control}

- **Verify Against Schedules**: Ensure time matches assigned schedules

- **Check Anomalies**: Investigate unusual patterns or hours

- **Validate Overtime**: Confirm overtime authorization

- **Review Leave Applications**: Cross-check time records with approved

  > leaves

- **Audit Clock Events**: Drill down to source data when needed

#### **C. Master Data Approvals** {#c.-master-data-approvals}

- Approve dimension table changes

- Authorize rate modifications

- Approve structural changes

- Review and approve new positions, locations, shifts

#### **D. Paysheet Oversight (Secondary)** {#d.-paysheet-oversight-secondary}

- Review completed paysheets when escalated

- Has authority to flag issues at any stage

- Can request audits of specific payments

- Does NOT provide final payroll approval (Payroll Manager\'s role)

### **UI Flows & Screens** {#ui-flows-screens-7}

#### **Integrated Approval Dashboard (Primary Screen)**

1.  **Unified Approval Hub**:
    - **Three Main Tabs**:
      - \"Timesheets\" - For timesheet approvals (HR Manager hat)

      - \"Change Requests\" - For all modification approvals

      - \"Final Payroll\" - For payroll approval (Payroll Manager hat)

    - **Summary Widget**: Total pending items across all categories

    - **Priority Alerts**: High-priority items requiring immediate

      > attention

    - **SLA Tracking**: Color-coded based on time remaining

2.  **Change Request Queue**:
    - **Grouped by Type**:
      - Time Adjustments (clock in/out modifications)

      - Rate Changes (contract rates, special rates)

      - Payroll Corrections (deductions, allowances)

      - Master Data Updates (guard info, positions)

    - **Quick View**: Essential details without opening full request

    - **Bulk Actions**: Approve/reject similar requests together

    - **Filter Options**: By requester, date, impact, department

3.  **Timesheet Approval Interface**:
    - List of all pending timesheets by pay period

    - Filters by: Department \| Detachment \| Status \| Date Range

    - Quick approval for clean records

    - Bulk selection for batch processing

    - One-click approval for error-free timesheets

4.  **Individual Review Screens**:
    - **For Timesheets**: Complete time details with drill-down

      > capability

    - **For Change Requests**: Before/after comparison with verifier

      > notes

    - **For Payroll**: Summary view with financial impact analysis

    - Common actions: Approve \| Reject \| Request Info \| Add Notes

5.  **Rejection Workflow**:
    - Select specific issues

    - Choose from rejection reason templates

    - Add detailed correction instructions

    - Set resubmission deadline

    - Auto-notify relevant parties

    - Track rejection history

### **E. Unified Dashboard - First Page View** {#e.-unified-dashboard---first-page-view}

**The HR/Payroll Manager\'s dashboard serves as the central hub for all approval
activities:**

#### **Dashboard Landing Page Components**

1.  **Pending Approvals Summary Widget**:
    - Total pending items across all categories

    - Breakdown by type:
      - Timesheets awaiting approval: \[count\]

      - Change requests pending: \[count\]

      - Final payroll approvals needed: \[count\]

    - Color-coded urgency indicators

2.  **Quick Action Buttons**:
    - \"Review Timesheets\" → Timesheet approval interface

    - \"Review Changes\" → Change request queue

    - \"Approve Payroll\" → Final payroll approval

    - \"View All Pending\" → Consolidated list

3.  **SLA Status Panel**:
    - Items approaching deadline (yellow)

    - Overdue items (red)

    - On-track items (green)

    - Average processing time metrics

4.  **Recent Activity Feed**:
    - Last 10 actions taken

    - Items returned for correction

    - Recently approved/rejected items

5.  **Priority Alerts Section**:
    - High-value changes requiring attention

    - Escalated items

    - System-flagged anomalies

This dashboard ensures the HR/Payroll Manager can efficiently manage all
approval responsibilities from a single entry point, with the ability to drill
down into specific approval types as needed.

#### **Approval Analytics**

- **Approval Metrics**:
  - Average approval time

  - Rejection rates by department

  - Common rejection reasons

  - Resubmission success rates

- **Trend Analysis**: Historical patterns in timesheet quality

- **Performance Tracking**: Timekeeper accuracy scores

### **Workflow Position**

- **Receives from**: Timekeeper (completed timesheets)

- **Approves and sends to**: Payroll Officer (for contracted hours

  > processing)

- **Can return to**: Timekeeper (for corrections)

- **Critical Gate**: No payroll processing without timesheet approval

- **Later Stage**: Same person reviews again as Payroll Manager after
  > Controller

### **Notification System**

- Real-time alerts for new timesheets requiring approval

- Escalation for timesheets pending \>24 hours

- Batch notification summaries

- Rejection notifications with detailed feedback

- Resubmission alerts with priority flagging

- Later receives final payroll approval notifications (as Payroll
  > Manager)

### **Business Rules for Timesheet Approval**

1.  All timesheets must be approved before payroll processing

2.  Approval must occur within 24 hours of submission

3.  Batch approvals allowed for clean timesheets only

4.  Individual review required for:
    - Excessive overtime (\>X hours)

    - Multiple corrections

    - Unusual patterns

    - High-value impact timesheets

5.  Rejected timesheets must include specific correction requirements

## **10. Admin Narrative (User-Facing)** {#admin-narrative-user-facing}

### **Overview & Collaboration** {#overview-collaboration-9}

The Admin maintains system integrity through user management and technical
configuration, with special focus on **audit trail management** and **role
assignments**.

### **Key Responsibilities**

#### **A. User Role Management** {#a.-user-role-management}

- Assign users to appropriate roles

- Manage role permissions

- Monitor role usage

- Maintain segregation of duties

#### **B. Audit Trail Management (ENHANCED)** {#b.-audit-trail-management-enhanced}

- **Track All Manual Changes**:
  - Who made the change

  - When it was made

  - What was changed (before/after values)

  - Why it was changed (justification)

- **Generate Audit Reports**: Comprehensive change logs

- **Maintain Compliance Records**: For regulatory requirements

#### **C. System Configuration** {#c.-system-configuration}

- Excel template management for Operations

- Integration settings

- Backup and recovery

- System parameters

### **UI Flows & Screens** {#ui-flows-screens-8}

#### **Audit Trail Dashboard (NEW)**

- Real-time change monitoring

- Filter by user, role, or action type

- Detailed change history

- Export capabilities for compliance

#### **Excel Template Management**

- Create/modify templates for each detachment

- Version control for templates

- Distribution to Operations Officers

- Template validation rules

## **11. Change Request Management System (NEW)** {#change-request-management-system-new}

### **Overview**

All changes to existing data in the system must follow a three-tier approval
structure: **Requester → Verifier → Approver**. This ensures proper control,
audit trail, and accountability for all modifications. The HR/Payroll Manager
(same person) serves as the final approver for all change requests.

### **Three-Tier Change Approval Structure**

#### **1. Requester (Initiator)** {#requester-initiator}

- Any role can request changes within their domain

- Must provide justification for the change

- Must attach supporting documentation if available

- Cannot approve their own requests

- Receives notification of approval/rejection

#### **2. Verifier (Reviewer)** {#verifier-reviewer}

- Reviews the change request for accuracy

- Validates supporting documentation

- Checks business rules and policies

- Can request additional information

- Forwards to approver or returns to requester

- Role varies based on change type

#### **3. Approver (Final Authority)** {#approver-final-authority}

- **HR/Payroll Manager** approves all change requests

- Reviews verifier\'s assessment

- Makes final decision

- Can approve, reject, or request modifications

- All approvals create permanent audit trail

### **Types of Change Requests**

#### **A. Time & Attendance Changes** {#a.-time-attendance-changes}

1.  \*\*Clock-In Time Adjustment

    > \*\*
    - Requester: Operations Officer or Timekeeper

    - Verifier: Timekeeper or Operations Officer (whoever didn\'t

      > request)

    - Approver: HR/Payroll Manager

    - Required: Reason code, original time, new time, documentation

2.  \*\*Clock-Out Time Adjustment

    > \*\*
    - Same workflow as Clock-In adjustment

    - Must maintain logical time pairs

3.  \*\*Missing Punch Addition

    > \*\*
    - Requester: Operations Officer

    - Verifier: Timekeeper

    - Approver: HR/Payroll Manager

    - Required: Guard statement or supervisor confirmation

4.  \*\*Complete Day Adjustment

    > \*\*
    - For adding/removing entire work days

    - Requires enhanced documentation

#### **B. Rate & Compensation Changes** {#b.-rate-compensation-changes}

1.  \*\*Contract Rate Change

    > \*\*
    - Requester: Finance Officer

    - Verifier: Payroll Officer

    - Approver: HR/Payroll Manager

    - Required: New rate, effective date, contract reference

2.  \*\*Special Rate Application

    > \*\*
    - For one-time rate adjustments

    - Requester: Finance Officer or Payroll Officer

    - Verifier: Controller

    - Approver: HR/Payroll Manager

3.  \*\*Overtime Rate Modification

    > \*\*
    - Requester: Finance Officer

    - Verifier: Payroll Officer

    - Approver: HR/Payroll Manager

#### **C. Payroll Adjustments** {#c.-payroll-adjustments}

1.  \*\*Deduction Changes

    > \*\*
    - Add/modify/remove deductions

    - Requester: Payroll Officer

    - Verifier: Verifier role

    - Approver: HR/Payroll Manager

2.  \*\*Allowance Adjustments

    > \*\*
    - Requester: Payroll Officer

    - Verifier: Verifier role

    - Approver: HR/Payroll Manager

3.  \*\*Government Contribution Corrections

    > \*\*
    - Requester: Payroll Officer

    - Verifier: Controller

    - Approver: HR/Payroll Manager

#### **D. Master Data Changes** {#d.-master-data-changes}

1.  \*\*Guard Information Updates

    > \*\*
    - Requester: HR Officer

    - Verifier: Operations Officer

    - Approver: HR/Payroll Manager

2.  \*\*Position/Location/Shift Changes

    > \*\*
    - Requester: HR Officer

    - Verifier: Operations Officer

    - Approver: HR/Payroll Manager

3.  \*\*Schedule Modifications

    > \*\*
    - After initial approval

    - Requester: Operations Officer

    - Verifier: Timekeeper

    - Approver: HR/Payroll Manager

### **Change Request Dashboard**

#### **For All Users - \"My Requests\" Tab**

- List of submitted change requests

- Status indicators (Pending/In Review/Approved/Rejected)

- Submission date and expected resolution

- Option to withdraw pending requests

- View feedback on rejected requests

#### **For Verifiers - \"To Verify\" Tab**

- Queue of requests awaiting verification

- Sorted by priority and age

- Quick view of request details

- Batch verification for similar requests

- Forward to approver or return to requester

#### **For HR/Payroll Manager - \"Approval Queue\" Tab**

- **Consolidated view of all pending approvals:**
  - Change requests (all types)

  - Timesheet approvals (HR Manager hat)

  - Payroll approvals (Payroll Manager hat)

- **Grouped by request type:**
  - Time Adjustments

  - Rate Changes

  - Payroll Corrections

  - Master Data Updates

- **Priority indicators:**
  - High: Affects current payroll

  - Medium: Affects next payroll

  - Low: Historical corrections

- **Bulk approval options** for similar requests

- **Quick filters:**
  - By requester

  - By date range

  - By impact value

  - By department/location

### **Change Request Workflow**

CHANGE REQUEST FLOW

═══════════════════════════════════════

Requester Initiates Change

↓

System Validates Request Completeness

↓

Verifier Reviews (Role depends on change type)

↓

Decision Point:

├─ VERIFIED → Forward to HR/Payroll Manager

└─ ISSUES → Return to Requester with Notes

↓

Requester Corrects & Resubmits

↓

HR/Payroll Manager Reviews

↓

Decision Point:

├─ APPROVED → Change Applied & Audit Trail Created

├─ REJECTED → Notification to Requester with Reason

└─ NEEDS INFO → Return to Verifier or Requester

### **Business Rules for Change Requests**

1.  **No Self-Approval**: Requesters cannot verify or approve own

    > requests

2.  **Time Limits**:
    - Changes affecting current payroll: 4-hour SLA

    - Changes affecting future payroll: 24-hour SLA

    - Historical corrections: 48-hour SLA

3.  **Documentation Requirements**:
    - All changes must have reason codes

    - Supporting documents required for time adjustments

    - Contract references required for rate changes

4.  **Retroactive Limits**:
    - Time changes: Maximum 2 pay periods back

    - Rate changes: Maximum 3 months back

    - Older changes require additional executive approval

5.  **Audit Trail**:
    - All changes logged with who, what, when, why

    - Original and new values preserved

    - Approval chain documented

    - Cannot be deleted, only reversed with new change request

### **Change Request Interface Specifications**

#### **Request Form Fields**

- Request Type (dropdown)

- Affected Entity (Guard/Rate/Schedule/etc.)

- Current Value

- Requested New Value

- Effective Date

- Reason Code (dropdown)

- Detailed Justification (text)

- Supporting Documents (attachments)

- Impact Analysis (auto-calculated)

- Urgency Level

#### **Verification Screen**

- Side-by-side comparison (current vs. requested)

- Policy compliance checklist

- Historical data for context

- Similar recent changes for reference

- Verification notes field

- Forward/Return/Request Info buttons

#### **Approval Screen**

- Executive summary of change

- Financial impact (if applicable)

- Verifier\'s notes and recommendation

- Approval history for similar changes

- Quick approve/reject buttons

- Batch processing for multiple requests

### **Notifications for Change Requests**

- **Immediate Alerts**:
  - To verifier when request submitted

  - To approver when verified

  - To requester when approved/rejected

- **Escalation**:
  - If not verified within SLA

  - If not approved within SLA

  - Automatic escalation to backup approver

- **Daily Digest**:
  - Summary of pending requests

  - Aging analysis

  - SLA compliance report

### **Integration with Existing Workflows**

- Change requests can trigger from:
  - Timesheet review process

  - Payroll processing exceptions

  - Audit findings

  - Guard complaints/queries

- Approved changes automatically flow to:
  - Timesheet recalculation

  - Payroll reprocessing

  - Report regeneration

  - Historical data updates

## **12. Critical System Requirements** {#critical-system-requirements}

### **Comprehensive Audit Trail**

**Every manual change must be tracked:**

- User identification

- Timestamp

- Original value

- New value

- Justification/reason

- Approval chain

**Change Request Audit Trail:**

- Requester identity and timestamp

- Verifier identity and verification notes

- Approver identity and decision

- Complete history of request lifecycle

- Supporting documentation links

- Impact analysis results

- Cannot be deleted, only reversed with new request

### **Dual Approval System (Same Person, Two Hats)**

**CRITICAL CLARIFICATION: HR Manager and Payroll Manager are the SAME PERSON
performing two different approval functions at different stages of the
process.**

**Two-tier approval structure:**

**For Timesheets (HR Manager Hat):**

1.  **Timekeeper**: Prepares and submits timesheets

2.  **HR/Payroll Manager**: Reviews and approves timesheets (First
    > Approval)

**For Payroll (Payroll Manager Hat):**

1.  **Payroll Officer**: Initial processing (contracted hours)

2.  **Verifier**: Review (non-contracted hours)

3.  **Controller**: Financial review and validation

4.  **HR/Payroll Manager**: Final payroll approval (Second Approval)

### **Approval Gates Visualization**

APPROVAL GATE 1: TIMESHEET APPROVAL

═══════════════════════════════════════

Timekeeper → HR MANAGER (Approves) → Proceed to Payroll

↓ (Rejects)

Corrections Required

\[Payroll Processing by Payroll Officer, Verifier, Controller\]

APPROVAL GATE 2: PAYROLL APPROVAL

═══════════════════════════════════════

Controller → PAYROLL MANAGER (Same person as HR Manager, Approves) →
Disbursement

↓ (Rejects)

Return to Any Stage

### **Why One Person, Two Approval Points?**

1.  **Different Focus Areas**:
    - **Timesheet Approval**: Detailed review of time records,

      > attendance, schedules

    - **Payroll Approval**: High-level review of totals, budgets,
      > financial impact

2.  **Different Timing**:
    - **Timesheet Approval**: Beginning of process, prevents errors

      > entering system

    - **Payroll Approval**: End of process, final check before funds
      > release

3.  **Different Scope**:
    - **Timesheet Approval**: Individual employee time records

    - **Payroll Approval**: Aggregate payroll totals and distributions

4.  **Audit Compliance**:
    - Two distinct approval points create clear audit trail

    - Shows review at both operational and financial levels

    - Demonstrates appropriate oversight despite being same person

### **Data Entry Controls**

**Primary: Biometric System**

- Guards clock in/out via fingerprint scan

- Data synced to system via Android mobile devices

- Real-time transmission when online

- Batch sync when offline

- Automatic validation and processing

**Backup: Excel Upload System**

- Used only when biometric fails

- Controlled templates per detachment

- Requires reason code for manual entry

- Validation before processing

- Audit trail for all uploads

- Processing equivalent to biometric data

### **Timesheet Duality**

**Two parallel time tracking systems:**

- **Actual**: For payroll (includes all variations)

- **Normalized**: For billing (client-presentable)

### **Floor Value Protection**

**Minimum payment safeguards:**

- System flags below-floor payments

- Payroll Officer can defer deductions

- Documentation required for deferrals

- Automatic rescheduling options

## **13. Process Flow Diagrams** {#process-flow-diagrams}

### **A. Complete Payroll Process Flow** {#a.-complete-payroll-process-flow}

GUARDS (Biometric Clock In/Out)

↓

Mobile Device (Android) Collection & Sync

↓

System Receives Clock Events

↓

Operations Officer (Excel Upload for missing/manual entries)

↓

Timekeeper (Process Clock Events & Create Timesheets)

↓

HR MANAGER (APPROVE TIMESHEETS) ← Critical Approval Gate \#1

↓ \[Same Person, First Hat\]

Payroll Officer (Process Contracted Hours)

↓

Verifier (Review Non-Contracted Components)

↓

Controller (Financial Review & Validation)

↓

PAYROLL MANAGER (FINAL PAYROLL APPROVAL) ← Critical Approval Gate \#2

↓ \[Same Person, Second Hat\]

Payslip Generation & Distribution to Guards

### **B. Timesheet Approval Flow** {#b.-timesheet-approval-flow}

Timekeeper Submits Completed Timesheets

↓

HR Manager Review Queue

(This person will also do final payroll approval later as Payroll Manager)

↓

Individual or Batch Review

↓

Decision Point:

├─ APPROVED → Forward to Payroll Officer

└─ REJECTED → Return to Timekeeper with Feedback

↓

Timekeeper Makes Corrections

↓

Resubmit to HR Manager

### **C. Payroll Approval Flow** {#c.-payroll-approval-flow}

Payroll Officer (Contracted Hours Processed)

↓

Verifier (Non-Contracted Review Complete)

↓

Controller (Financial Review Complete)

↓

Payroll Manager Final Review

(Same person as HR Manager who approved timesheets earlier)

↓

Decision Point:

├─ APPROVED → Release for Disbursement

├─ CONDITIONAL → Approve with Notes/Conditions

└─ REJECTED → Return to Appropriate Stage

(Can return to any previous stage)

### **D. Clock Event Data Flow (Enhanced)** {#d.-clock-event-data-flow-enhanced}

BIOMETRIC DEVICE (Guard fingerprint scan)

↓

MOBILE DEVICE (Android app receives data)

↓

Decision Point:

├─ ONLINE → Real-time sync to System

└─ OFFLINE → Store locally → Batch sync when online

↓

SYSTEM DATABASE (Clock events stored)

↓

PARALLEL PATHS:

├─ Automatic Processing → DTR Generation

└─ Manual Excel Entry (Operations) → Upload → Validation

↓

Timekeeper Processing → Timesheet Creation (Actual + Normalized) →

HR Manager Approval → Payroll Processing

### **E. Deduction Deferral Flow** {#e.-deduction-deferral-flow}

Payment \< Floor Value → Flag Raised →

Payroll Officer Review → Deferral Decision →

Documentation → Reschedule to Next Period OR

Create Custom Schedule → Verifier Review →

Controller Review → Payroll Manager Final Approval

### **F. Biometric Registration Flow** {#f.-biometric-registration-flow}

NEW GUARD ONBOARDING

↓

HR Officer Initiates Registration

↓

Guard Provides Fingerprint Samples at Biometric Device

↓

Templates Stored in Device

↓

Guard ID Linked to Templates

↓

Test Clock In/Out

↓

Verification in System

↓

Registration Complete

### **G. Change Request Flow** {#g.-change-request-flow}

UNIVERSAL CHANGE REQUEST PROCESS

═══════════════════════════════════════

Any Role Initiates Change Request

↓

System Validates Completeness

↓

Routes to Appropriate Verifier

(Based on Change Type)

↓

Verifier Reviews

↓

Decision Point:

├─ VERIFIED → Forward to HR/Payroll Manager

└─ ISSUES → Return to Requester

↓

Requester Fixes & Resubmits

↓

HR/Payroll Manager Reviews

↓

Decision Point:

├─ APPROVED → Change Applied to System

├─ REJECTED → Notification to Requester

└─ NEEDS INFO → Return for Clarification

## **14. Key Integration Points** {#key-integration-points}

### **Between Roles**

1.  **Guards ↔ System**: Biometric clock events via mobile device sync

2.  **Guards ↔ Operations**: Manual time reporting when biometric fails

3.  **Operations ↔ Timekeeper**: Excel upload for clock events; change

    > request verification

4.  **Timekeeper ↔ HR Manager**: Timesheet submission for approval;

    > change requests

5.  **HR Manager ↔ Payroll Officer**: Approved timesheets handoff

6.  **Payroll Officer ↔ Verifier**: Contracted hours to review; change

    > verification

7.  **Verifier ↔ Controller**: Reviewed paysheets for financial

    > validation

8.  **Controller ↔ Payroll Manager**: Financially validated payroll for

    > final approval (same person as HR Manager)

9.  **Finance ↔ Payroll Officer**: Rate application for contracted

    > hours; rate change requests

10. **System ↔ Guards**: Payslip distribution after final approval

11. **All Roles ↔ HR/Payroll Manager**: Change request submissions and
    > approvals

### **Critical Approval Gates (Same Person, Two Stages)**

**Gate 1 - Timesheet Approval (HR Manager Hat):**

- First approval by the HR/Payroll Manager

- Focus on time record accuracy

- No payroll processing without approved timesheets

- Must approve within 24 hours

- Can reject with specific feedback

- Controls data quality entering payroll

**Gate 2 - Payroll Approval (Payroll Manager Hat):**

- Final approval by the same HR/Payroll Manager

- Focus on payroll totals and financial impact

- Final authorization before disbursement

- Reviews entire payroll process

- Can return to any stage

- Ultimate accountability for payroll accuracy

**Note**: Having the same person perform both approvals is acceptable because:

- Different stages of the process

- Different types of review (detail vs. summary)

- Different risk considerations

- Clear audit trail maintained

- Provides comprehensive oversight by someone familiar with both HR and
  > payroll aspects

### **Data Flow Points**

**From Guards:**

- Biometric fingerprint scans → Clock events

- Clock events → Mobile device (Android)

- Mobile device → System database (real-time or batch)

- Manual time records → Operations Officer (when needed)

**To Guards:**

- Work schedules (from Operations)

- Timesheet discrepancy notices (through supervisors)

- Final payslips (after Payroll Manager approval)

### **Data Dependencies**

- Guard biometric data → Clock event generation

- Clock events → Timesheet creation

- Finance rates → Payroll calculations

- Operations schedules → Timekeeper validation

- HR master data → All payroll processes

- Excel uploads → Backup clock event processing

- HR Manager approval (first hat) → Payroll processing can begin

- Payroll Manager approval (second hat, same person) → Funds can be
  > disbursed

## **15. Compliance and Control Features** {#compliance-and-control-features}

### **Segregation of Duties**

- Payroll Officer cannot approve own work

- Verifier cannot process initial payroll

- Controller cannot modify base calculations

- HR/Payroll Manager provides dual-stage approval (same person,

  > different contexts)

- Clear separation between processing, review, and approval

### **Dual Approval System (One Person, Two Stages)**

**Timesheet Level (HR Manager Hat):**

- HR/Payroll Manager must approve all timesheets before payroll

  > processing

- Provides first quality gate

- Focus on time accuracy and attendance

- Prevents errors from entering payroll system

**Payroll Level (Payroll Manager Hat):**

- Same HR/Payroll Manager provides final approval

- Multi-stage review: Verifier → Controller → Payroll Manager

- Each processing level has specific focus area

- Final authorization from someone who understands both HR and payroll

  > aspects

- Complete accountability chain

**Note on Same Person Approval:**

- Industry-accepted practice for smaller organizations

- Different stages and focus areas justify dual approval

- Maintains strong control with clear audit trail

- Cost-effective while maintaining oversight

### **Audit Requirements**

- All changes logged with full detail

- No deletion of records (soft delete only)

- Complete trail from clock event to payment

- Regulatory compliance documentation

- Two separate approval trails (timesheet and payroll)

### **Data Integrity**

- Validation at each step

- Reconciliation points throughout process

- Error detection and correction workflows

- Version control for all changes

- Dual approval prevents unauthorized payments

## **16. Implementation Considerations** {#implementation-considerations}

### **Priority Items**

1.  **Deploy biometric devices and Android sync** - Primary data

    > collection

2.  **Implement Change Request System** - Critical for controlled

    > modifications
    - Configure three-tier approval workflow

    - Set up unified dashboard for HR/Payroll Manager

    - Define verifier roles for each change type

3.  **Establish dual approval gates** - Critical control points
    - Train HR/Payroll Manager on both approval stages

    - Configure system for same person, two approval points

    - Set up distinct interfaces for timesheet vs. payroll approval

4.  **Implement Verifier role** - Essential for review process

5.  **Set up Excel upload system** - Backup for biometric failures

6.  **Configure dual timesheet tracking** - Essential for billing

    > accuracy

7.  **Establish comprehensive audit trail** - Compliance requirement

8.  **Define floor values** - Protect employee payments

### **Training Requirements**

- **Guards**: Proper biometric enrollment and daily clock in/out

  > procedures

- **HR/Payroll Manager**:
  - Dual role training for both timesheet and payroll approval

  - Change request approval dashboard navigation

  - Understanding different focus areas for each approval type

  - System navigation for all three approval interfaces

  - Criteria for timesheet, payroll, and change request reviews

- **All System Users**:
  - How to submit change requests

  - Required documentation for different change types

  - Understanding the requester-verifier-approver workflow

  - Tracking change request status

- Operations: Excel template usage for backup entries only

- Payroll Officer: New focus on contracted hours only; change request

  > procedures

- Verifier: Complete training on review procedures including change

  > verification

- Controller: Financial review responsibilities and change verification

- Finance Officer: Rate change request procedures

- Timekeeper: Time adjustment request procedures

- All users: Understanding that HR/Payroll Manager is one person with
  > multiple approval responsibilities

### **Technology Deployment**

- **Biometric Devices**: Install at all guard posts

- **Android Mobile Apps**: Deploy to designated sync points

- **Network Infrastructure**: Ensure connectivity for real-time sync

- **Backup Procedures**: Excel templates ready at all locations

- **System Integration**: Test biometric to system data flow

### **Change Management**

- Guard orientation on biometric usage

- \*\*Clear communication that HR/Payroll Manager is one person with two

  > approval stages\*\*

- Explain the rationale for dual approval by same person (different

  > focus areas)

- Emphasize biometric as primary, Excel as backup only

- Gradual transition from current process

- Parallel run for validation

- Regular review and adjustment

- Set clear SLAs for both approval stages (24hr timesheet, 48hr payroll)

- Train HR/Payroll Manager on both interfaces and approval criteria

## **17. Success Metrics** {#success-metrics}

### **Process Efficiency**

- Reduction in payroll errors

- Faster processing time

- Fewer rejections and rework

- Meeting approval SLAs (24hr for timesheets, 48hr for payroll)

- Change request turnaround time

- First-pass approval rate for change requests

### **Approval Effectiveness**

- Timesheet approval turnaround time (HR Manager hat)

- Payroll approval cycle time (Payroll Manager hat)

- Change request approval efficiency (all types)

- First-pass approval rates at all stages

- Rejection clarity scores

- Efficiency of single person managing dual approvals plus change
  > requests

### **Compliance**

- Complete audit trail coverage

- No unauthorized changes

- Full regulatory compliance

- Dual approval compliance rate (100% target)

### **User Satisfaction**

- Clear role definitions

- Efficient workflows

- Reduced manual work

- Transparent approval process

### **Financial Control**

- Accurate contracted hours processing

- Proper deduction management

- Budget compliance

- Zero unauthorized disbursements

## **Appendix A: Detailed Field Specifications (will definitely change during detailed design step)**

### **Biometric Clock Event Fields**

- Guard ID (from fingerprint template match)

- Timestamp (date and time to the second)

- Event Type (IN/OUT/BREAK_START/BREAK_END)

- Device ID (biometric device identifier)

- Location Code (derived from device location)

- Match Quality Score (fingerprint confidence level)

- Sync Method (real-time/batch)

- Sync Timestamp (when received by system)

- Mobile Device ID (Android device used for sync)

### **Excel Upload Template Fields (Backup)**

- Detachment Code

- Sub-area Code

- Guard ID

- Guard Name

- Date

- Actual Time-In

- Actual Time-Out

- Break Start

- Break End

- Overtime Start

- Overtime End

- Reason for Manual Entry (required)

- Supporting Documentation

- Remarks

- Uploaded By

- Upload Timestamp

### **Timesheet Fields (Dual)**

**Actual Time:**

- Raw clock-in time

- Raw clock-out time

- Source (Biometric/Manual/Mobile)

- Actual hours worked

- Tardiness minutes

- Undertime minutes

- Absence flag

**Normalized Time:**

- Billing time-in

- Billing time-out

- Billable hours

- Adjustment reason

- Adjustment approval

### **Audit Trail Fields**

- Transaction ID

- User ID

- Role

- Action Type

- Table Name

- Field Name

- Old Value

- New Value

- Reason Code

- Reason Text

- Timestamp

- Session ID

- IP Address

- Data Source (Biometric/Manual)

## **Appendix B: Business Rules**

### **Biometric Clock Event Rules**

1.  Minimum 5 minutes between consecutive clock events

2.  IN event must precede OUT event

3.  Maximum daily clock events: 8 (4 pairs)

4.  Offline sync must complete within 24 hours

5.  Manual entry requires supervisor verification

6.  Fingerprint match threshold: 70% confidence minimum

### **Manual Entry Rules (Excel Upload)**

1.  Only allowed when biometric system unavailable

2.  Must include reason code for manual entry

3.  Requires supporting documentation reference

4.  One Excel file per detachment per period

5.  Must use approved template

6.  Late uploads require approval

7.  Corrections require new upload with justification

8.  All uploads permanently archived

### **Floor Value Rules**

1.  If payment \< floor value, system must flag

2.  Payroll Officer must document decision

3.  Deferred deductions auto-schedule to next period

4.  Maximum deferral: 2 consecutive periods

5.  After 2 deferrals, escalate to HR Manager

### **Approval Rules**

**Dual Approval by HR/Payroll Manager (Same Person):**

**Timesheet Approvals (Wearing HR Manager Hat):**

1.  All timesheets must be approved before payroll processing

2.  HR Manager must review within 24 hours

3.  Batch approvals allowed for clean timesheets

4.  Individual review required for exceptions

5.  Rejections must include specific feedback

6.  Focus: Time accuracy, attendance, schedule compliance

**Payroll Approvals (Wearing Payroll Manager Hat):**

1.  Final approval required before any disbursement

2.  Same person (now as Payroll Manager) must approve within 48 hours

3.  Can return to any previous stage

4.  Emergency approvals require documentation

5.  Partial approvals allowed with justification

6.  Focus: Total amounts, budget compliance, financial impact

**Why Same Person Can Do Both:**

- Different stages of the process (beginning vs. end)

- Different review focus (detail vs. summary)

- Common in organizations where one person oversees both HR and Payroll

- Maintains control while being cost-effective

- Clear audit trail shows two distinct approval actions

**General Approval Rules:**

1.  Verifier must review within 24 hours

2.  Controller must complete financial review within 24 hours

3.  Resubmissions prioritized in queue

4.  All approvals tracked in audit trail

5.  No payment without both approval gates cleared by HR/Payroll Manager

_End of Document_

**Document Control:**

- Version: Added Change Request Management System

- Status: For Project Team Review

- Key Update: Added comprehensive change request workflow (Requester →

  > Verifier → Approver)

- Next Review:

- Distribution: Project Team, Stakeholders
