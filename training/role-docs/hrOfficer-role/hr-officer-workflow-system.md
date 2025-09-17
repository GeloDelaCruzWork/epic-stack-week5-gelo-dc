# HR Officer Workflow System

## Master Data Management, Employee Lifecycle & Leave Administration

## Executive Summary

Based on the **Updated Role Narratives - Payroll System (Revised)**, this
document provides a comprehensive workflow and UI design for the HR Officer
role. The HR Officer serves as the guardian of all human resource master data,
managing employee information, organizational structures, leave balances, and
supporting documentation while maintaining clear separation from payroll
processing functions.

## HR Officer Role Overview

As defined in the Updated Role Narratives, the HR Officer:

- Maintains all HR-related master data including guard and employee information
- Manages detachment lists and organizational structures
- Processes leave applications and maintains leave balances
- Handles employee documentation and compliance
- Manages biometric enrollment for new guards
- **Does NOT directly handle payroll computations** - provides data for payroll
  processing
- Initiates change requests for employee data updates

## Core Responsibilities

### 1. Master Data Management

#### A. Employee/Guard Information

- Complete profiles with personal information
- Employment history and status tracking
- License and certification management
- Emergency contacts and dependents
- Bank account details for payroll
- Government ID numbers (SSS, TIN, PhilHealth, Pag-IBIG)

#### B. Organizational Structure

- Locations and detachments hierarchy
- Departments and divisions
- Positions and job grades
- Reporting structures
- Cost centers

#### C. Reference Data

- Document types and requirements
- Leave types and policies
- Benefit categories
- Training programs
- Compliance requirements

### 2. Employee Lifecycle Management

```
EMPLOYEE LIFECYCLE FLOW
═══════════════════════════════════════

Recruitment → Onboarding → Active Employment → Separation
     ↓            ↓              ↓                ↓
 Screening    Enrollment    Maintenance      Clearance
              Biometric     Promotions       Final Pay
              Training      Transfers        Archives
```

### 3. Leave Management

- Leave balance initialization and tracking
- Leave application processing
- Leave approval workflow coordination
- Leave balance adjustments
- Year-end leave balance processing

## Database Schema Design

### HR Master Data Tables

```sql
-- Enhanced Guard/Employee Table
model Employee {
  id                String   @id @default(cuid())
  employeeId        String   @unique
  employeeType      EmployeeType @default(GUARD)

  -- Personal Information
  firstName         String
  lastName          String
  middleName        String?
  suffix            String?
  nickname          String?
  dateOfBirth       DateTime
  placeOfBirth      String?
  gender            Gender
  civilStatus       CivilStatus
  nationality       String @default("Filipino")
  religion          String?
  bloodType         String?

  -- Contact Information
  mobileNumber      String
  alternateNumber   String?
  email            String?  @unique
  presentAddress    String
  permanentAddress  String
  provincialAddress String?

  -- Government IDs
  sssNumber         String?  @unique
  tinNumber         String?  @unique
  philHealthNumber  String?  @unique
  pagIbigNumber     String?  @unique

  -- Employment Information
  hireDate          DateTime
  regularizationDate DateTime?
  employmentStatus  EmploymentStatus @default(ACTIVE)
  positionId        String
  departmentId      String?
  immediateHead     String?

  -- Banking Information
  bankName          String?
  bankAccountNumber String?
  bankAccountName   String?

  -- Biometric Information
  biometricId       String?  @unique
  biometricEnrolled Boolean @default(false)
  enrollmentDate    DateTime?

  -- Documentation
  photoUrl          String?
  signatureUrl      String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  position          Position @relation(fields: [positionId], references: [id])
  department        Department? @relation(fields: [departmentId], references: [id])
  emergencyContacts EmergencyContact[]
  dependents        Dependent[]
  educations        Education[]
  employmentHistory EmploymentHistory[]
  licenses          License[]
  trainings         Training[]
  documents         EmployeeDocument[]
  leaveBalances     LeaveBalance[]
  leaveApplications LeaveApplication[]

  @@index([employeeId])
  @@index([employmentStatus])
  @@index([employeeType])
}

-- Emergency Contacts
model EmergencyContact {
  id              String   @id @default(cuid())
  employeeId      String
  name            String
  relationship    String
  contactNumber   String
  alternateNumber String?
  address         String
  isPrimary       Boolean @default(false)

  employee        Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
}

-- Dependents
model Dependent {
  id              String   @id @default(cuid())
  employeeId      String
  name            String
  relationship    DependentType
  dateOfBirth     DateTime
  occupation      String?
  isStudent       Boolean @default(false)
  school          String?

  employee        Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
}

-- Educational Background
model Education {
  id              String   @id @default(cuid())
  employeeId      String
  level           EducationLevel
  schoolName      String
  course          String?
  yearGraduated   Int?
  honors          String?

  employee        Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
}

-- Employment History
model EmploymentHistory {
  id              String   @id @default(cuid())
  employeeId      String
  companyName     String
  position        String
  startDate       DateTime
  endDate         DateTime?
  reasonForLeaving String?
  responsibilities String?

  employee        Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
}

-- Licenses and Certifications
model License {
  id              String   @id @default(cuid())
  employeeId      String
  licenseType     String
  licenseNumber   String
  issuingBody     String
  issueDate       DateTime
  expiryDate      DateTime?
  status          LicenseStatus @default(ACTIVE)
  documentUrl     String?

  employee        Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@index([expiryDate])
}

-- Training Records
model Training {
  id              String   @id @default(cuid())
  employeeId      String
  trainingName    String
  provider        String
  startDate       DateTime
  endDate         DateTime
  certificateNumber String?
  status          TrainingStatus
  documentUrl     String?

  employee        Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
}

-- Employee Documents
model EmployeeDocument {
  id              String   @id @default(cuid())
  employeeId      String
  documentType    DocumentType
  documentName    String
  documentUrl     String
  uploadedBy      String
  uploadedAt      DateTime @default(now())
  expiryDate      DateTime?
  isActive        Boolean @default(true)

  employee        Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@index([documentType])
}

-- Organizational Structure
model Department {
  id              String   @id @default(cuid())
  code            String   @unique
  name            String
  parentId        String?
  headEmployeeId  String?
  costCenter      String?
  isActive        Boolean @default(true)

  parent          Department? @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children        Department[] @relation("DepartmentHierarchy")
  employees       Employee[]
  positions       Position[]
}

model Position {
  id              String   @id @default(cuid())
  code            String   @unique
  title           String
  jobGrade        String?
  departmentId    String?
  minSalary       Decimal? @db.Decimal(10, 2)
  maxSalary       Decimal? @db.Decimal(10, 2)
  responsibilities String?
  requirements    String?
  isActive        Boolean @default(true)

  department      Department? @relation(fields: [departmentId], references: [id])
  employees       Employee[]
}

-- Enhanced Leave Management
model LeaveType {
  id              String   @id @default(cuid())
  code            String   @unique
  name            String
  isPaid          Boolean @default(true)
  maxDaysPerYear  Decimal  @db.Decimal(5, 2)
  carryOverLimit  Decimal? @db.Decimal(5, 2)
  requiresApproval Boolean @default(true)
  requiresMedical Boolean @default(false)
  minDays         Decimal? @db.Decimal(5, 2)
  maxDays         Decimal? @db.Decimal(5, 2)
  advanceNotice   Int?     -- Days of advance notice required

  leaveBalances   LeaveBalance[]
  leaveApplications LeaveApplication[]
}

model LeaveBalance {
  id              String   @id @default(cuid())
  employeeId      String
  leaveTypeId     String
  year            Int

  -- Balance tracking
  beginning       Decimal  @db.Decimal(5, 2) @default(0)
  entitled        Decimal  @db.Decimal(5, 2)
  earned          Decimal  @db.Decimal(5, 2) @default(0)
  used            Decimal  @db.Decimal(5, 2) @default(0)
  adjusted        Decimal  @db.Decimal(5, 2) @default(0)
  forfeited       Decimal  @db.Decimal(5, 2) @default(0)
  remaining       Decimal  @db.Decimal(5, 2)

  lastUpdated     DateTime @updatedAt

  employee        Employee @relation(fields: [employeeId], references: [id])
  leaveType       LeaveType @relation(fields: [leaveTypeId], references: [id])
  adjustments     LeaveAdjustment[]

  @@unique([employeeId, leaveTypeId, year])
  @@index([year])
}

model LeaveApplication {
  id              String   @id @default(cuid())
  applicationNumber String  @unique @default(cuid())
  employeeId      String
  leaveTypeId     String

  -- Leave details
  startDate       DateTime
  endDate         DateTime
  days            Decimal  @db.Decimal(5, 2)
  reason          String
  contactDuring   String?

  -- Approval workflow
  status          LeaveApplicationStatus @default(PENDING)
  appliedDate     DateTime @default(now())
  supervisorId    String?
  supervisorRemarks String?
  supervisorDate  DateTime?
  hrRemarks       String?
  hrApprovedBy    String?
  hrApprovedDate  DateTime?

  -- Documentation
  attachments     String?  -- JSON array of document URLs

  employee        Employee @relation(fields: [employeeId], references: [id])
  leaveType       LeaveType @relation(fields: [leaveTypeId], references: [id])

  @@index([employeeId])
  @@index([status])
  @@index([startDate, endDate])
}

model LeaveAdjustment {
  id              String   @id @default(cuid())
  leaveBalanceId  String
  adjustmentType  AdjustmentType
  amount          Decimal  @db.Decimal(5, 2)
  reason          String
  effectiveDate   DateTime
  approvedBy      String?
  createdAt       DateTime @default(now())

  leaveBalance    LeaveBalance @relation(fields: [leaveBalanceId], references: [id])

  @@index([leaveBalanceId])
}

-- Enums
enum EmployeeType {
  GUARD
  SUPERVISOR
  ADMIN
  OPERATIONS
  HR
  FINANCE
  MANAGEMENT
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum CivilStatus {
  SINGLE
  MARRIED
  WIDOWED
  SEPARATED
  DIVORCED
}

enum EmploymentStatus {
  ACTIVE
  INACTIVE
  TERMINATED
  RESIGNED
  RETIRED
  SUSPENDED
  ON_LEAVE
  AWOL
}

enum DependentType {
  SPOUSE
  CHILD
  PARENT
  SIBLING
  OTHER
}

enum EducationLevel {
  ELEMENTARY
  HIGH_SCHOOL
  VOCATIONAL
  COLLEGE
  POST_GRADUATE
  DOCTORATE
}

enum LicenseStatus {
  ACTIVE
  EXPIRED
  SUSPENDED
  REVOKED
}

enum TrainingStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  FAILED
}

enum DocumentType {
  RESUME
  NBI_CLEARANCE
  POLICE_CLEARANCE
  MEDICAL_CERTIFICATE
  BIRTH_CERTIFICATE
  MARRIAGE_CERTIFICATE
  TIN_ID
  SSS_ID
  PHILHEALTH_ID
  PAGIBIG_ID
  DRIVERS_LICENSE
  PASSPORT
  OTHER
}

enum LeaveApplicationStatus {
  DRAFT
  PENDING
  SUPERVISOR_APPROVED
  HR_APPROVED
  REJECTED
  CANCELLED
  AVAILED
}

enum AdjustmentType {
  CREDIT
  DEBIT
  CARRY_OVER
  FORFEITURE
  CORRECTION
}
```

## User Interface Design

### 1. HR Dashboard - Main Screen

```
┌────────────────────────────────────────────────────────────────────────┐
│  HR MANAGEMENT SYSTEM                                  [User] [Logout]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    HR OVERVIEW METRICS                           │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│  │
│  │  │   Employees │  │    Guards   │  │   On Leave  │  │ Expiring ││  │
│  │  │     142     │  │     523     │  │      15     │  │    8     ││  │
│  │  │   Active    │  │   Active    │  │    Today    │  │ Licenses ││  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  QUICK ACTIONS                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ [+ New Employee] [+ New Guard] [📋 Leave Applications]           │  │
│  │ [🔍 Employee Search] [📊 Reports] [⚙️ Master Data]              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────┬────────────────────────────┐  │
│  │ PENDING TASKS                      │ ALERTS & NOTIFICATIONS      │  │
│  │                                     │                             │  │
│  │ • 5 Leave applications pending     │ ⚠️ 8 licenses expiring      │  │
│  │ • 3 New employee onboarding        │ 🔴 2 guards AWOL            │  │
│  │ • 12 Document renewals due         │ ℹ️ 5 probation ending       │  │
│  │ • 2 Biometric enrollments pending  │ 📅 Year-end leave processing│  │
│  │                                     │                             │  │
│  │ [View All Tasks]                    │ [View All Alerts]           │  │
│  └─────────────────────────────────────┴────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Employee/Guard Master Data Management

```
┌────────────────────────────────────────────────────────────────────────┐
│  EMPLOYEE MASTER DATA                                  [+ New Employee] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Search: [_______________] Type: [All ▼] Status: [Active ▼] [Search]   │
│                                                                          │
│  EMPLOYEE LIST                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ □ │ ID    │ Name          │ Type    │ Position    │ Status │Actions│  │
│  │───┼───────┼───────────────┼─────────┼─────────────┼────────┼───────│  │
│  │ □ │ G-001 │ Dela Cruz, J. │ Guard   │ Guard       │ Active │ [···] │  │
│  │ □ │ G-002 │ Santos, M.    │ Guard   │ Supervisor  │ Active │ [···] │  │
│  │ □ │ E-003 │ Reyes, A.     │ Admin   │ HR Officer  │ Active │ [···] │  │
│  │ □ │ G-004 │ Garcia, P.    │ Guard   │ Guard       │ On Leave│ [···]│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  Showing 1-20 of 665 employees            [Previous] [1] [2] [3] [Next] │
│                                                                          │
│  BULK ACTIONS: [Export] [Update Status] [Generate Reports]              │
└────────────────────────────────────────────────────────────────────────┘
```

### 3. Employee Profile Management

```
┌────────────────────────────────────────────────────────────────────────┐
│  EMPLOYEE PROFILE                                      [Edit] [Print]   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Personal] [Employment] [Documents] [Leave] [Training] [History]       │
│                                                                          │
│  PERSONAL INFORMATION                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ┌─────────┐  Employee ID: G-001                                  │  │
│  │ │ [Photo] │  Name: Juan Miguel Dela Cruz                         │  │
│  │ │         │  Nickname: Juan                                      │  │
│  │ └─────────┘  Date of Birth: January 15, 1990 (34 years old)     │  │
│  │              Gender: Male | Civil Status: Married                │  │
│  │              Nationality: Filipino | Blood Type: O+              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  CONTACT INFORMATION                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Mobile: +63 917 123 4567        Email: juan.delacruz@email.com  │  │
│  │ Present Address: 123 Main St, Quezon City, Metro Manila         │  │
│  │ Permanent Address: 456 Provincial Rd, Batangas City, Batangas   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  GOVERNMENT IDs                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ SSS: 34-1234567-8              TIN: 123-456-789-000            │  │
│  │ PhilHealth: 12-345678901-2     Pag-IBIG: 1234-5678-9012        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  EMERGENCY CONTACTS                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Primary: Maria Dela Cruz (Spouse) - +63 917 987 6543            │  │
│  │ Secondary: Pedro Dela Cruz (Father) - +63 918 234 5678          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  DEPENDENTS                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ • Dela Cruz, Maria (Spouse) - Born: 1992                        │  │
│  │ • Dela Cruz, Juan Jr. (Child) - Born: 2015, Student            │  │
│  │ • Dela Cruz, Ana (Child) - Born: 2018, Student                 │  │
│  │                                                [Add Dependent]   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 4. New Employee Onboarding

```
┌────────────────────────────────────────────────────────────────────────┐
│  NEW EMPLOYEE ONBOARDING                               [Save] [Cancel]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Progress: [████████░░░░░░░░░░] 40% - Personal Information             │
│                                                                          │
│  [1.Personal] [2.Employment] [3.Government] [4.Banking] [5.Documents]   │
│                                                                          │
│  STEP 1: PERSONAL INFORMATION                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Employee Type: [Guard ▼]           Employee ID: [Auto-generate]  │  │
│  │                                                                   │  │
│  │ First Name: [_______________]      Last Name: [_______________]  │  │
│  │ Middle Name: [_______________]     Suffix: [____]               │  │
│  │ Nickname: [_______________]                                      │  │
│  │                                                                   │  │
│  │ Date of Birth: [MM/DD/YYYY]        Place of Birth: [__________] │  │
│  │ Gender: ( ) Male ( ) Female        Civil Status: [Single ▼]     │  │
│  │ Nationality: [Filipino_____]       Religion: [_______________]   │  │
│  │ Blood Type: [O+ ▼]                                              │  │
│  │                                                                   │  │
│  │ Mobile Number: [+63 ___________]   Alt Number: [+63 __________] │  │
│  │ Email Address: [_____________________@_____________]            │  │
│  │                                                                   │  │
│  │ Present Address:                                                 │  │
│  │ [____________________________________________________________]   │  │
│  │ □ Same as Permanent Address                                      │  │
│  │                                                                   │  │
│  │ Permanent Address:                                               │  │
│  │ [____________________________________________________________]   │  │
│  │                                                                   │  │
│  │ Upload Photo: [Choose File] No file selected                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Previous] [Save Draft] [Next: Employment Details →]                   │
└────────────────────────────────────────────────────────────────────────┘
```

### 5. Biometric Enrollment Interface

```
┌────────────────────────────────────────────────────────────────────────┐
│  BIOMETRIC ENROLLMENT                                  [Back to Profile]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Employee: Juan Dela Cruz (G-001)                                      │
│  Location: Location A - Main Gate                                       │
│                                                                          │
│  ENROLLMENT STATUS                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Current Status: Not Enrolled                                      │  │
│  │ Device: [Select Device ▼]                                         │  │
│  │         • Device A - Location A Main Gate                         │  │
│  │         • Device B - Location A Side Gate                         │  │
│  │         • Device C - Location B Main Gate                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ENROLLMENT PROCESS                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Step 1: Connect to Device                          [Connect]     │  │
│  │ Status: ⚫ Not Connected                                          │  │
│  │                                                                   │  │
│  │ Step 2: Capture Fingerprints                                     │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │ │  L Thumb │ │ L Index  │ │ L Middle │ │  L Ring  │            │  │
│  │ │    ⚫    │ │    ⚫    │ │    ⚫    │ │    ⚫    │            │  │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │ │  R Thumb │ │ R Index  │ │ R Middle │ │  R Ring  │            │  │
│  │ │    ⚫    │ │    ⚫    │ │    ⚫    │ │    ⚫    │            │  │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │  │
│  │                                                                   │  │
│  │ [Start Enrollment]                                                │  │
│  │                                                                   │  │
│  │ Step 3: Test Verification                                         │  │
│  │ [Test Fingerprint]                                                │  │
│  │                                                                   │  │
│  │ Step 4: Save and Sync                                            │  │
│  │ Biometric ID: [_______________]                                   │  │
│  │ [Save to All Devices]                                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 6. Leave Management Interface

```
┌────────────────────────────────────────────────────────────────────────┐
│  LEAVE MANAGEMENT                                      [+ New Application]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Applications] [Balances] [Calendar] [Reports] [Settings]              │
│                                                                          │
│  PENDING LEAVE APPLICATIONS                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ App # │ Employee     │ Type     │ Dates        │ Days │ Status    │  │
│  │───────┼──────────────┼──────────┼──────────────┼──────┼───────────│  │
│  │ L-001 │ J. Dela Cruz │ Vacation │ Jan 20-22    │  3   │ Pending   │  │
│  │ L-002 │ M. Santos    │ Sick     │ Jan 15       │  1   │ For HR    │  │
│  │ L-003 │ P. Reyes     │ Emergency│ Jan 18-19    │  2   │ Pending   │  │
│  │                                                                   │  │
│  │ [View All Applications]                                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  LEAVE BALANCE OVERVIEW (Current Year: 2024)                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Leave Type      │ Total Guards │ Avg Balance │ Total Used │ Alert │  │
│  │─────────────────┼──────────────┼─────────────┼────────────┼───────│  │
│  │ Vacation Leave  │     523      │    10.5     │   1,045    │   -   │  │
│  │ Sick Leave      │     523      │    12.8     │     523    │   -   │  │
│  │ Emergency Leave │     523      │     2.5     │     156    │   -   │  │
│  │ Maternity       │      45      │    60.0     │      15    │   3   │  │
│  │ Paternity       │     478      │     7.0     │      23    │   -   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  QUICK ACTIONS                                                          │
│  [Bulk Balance Update] [Year-End Processing] [Generate Reports]         │
└────────────────────────────────────────────────────────────────────────┘
```

### 7. Leave Application Processing

```
┌────────────────────────────────────────────────────────────────────────┐
│  LEAVE APPLICATION DETAILS                             Application #L-001│
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  EMPLOYEE INFORMATION                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Name: Juan Dela Cruz (G-001)        Position: Guard              │  │
│  │ Department: Security                 Supervisor: M. Santos        │  │
│  │ Date Hired: Jan 1, 2020             Leave Balance: VL-12, SL-14  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  LEAVE DETAILS                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Leave Type: Vacation Leave                                        │  │
│  │ Start Date: January 20, 2024        End Date: January 22, 2024   │  │
│  │ Number of Days: 3                   Return Date: January 23, 2024│  │
│  │                                                                   │  │
│  │ Reason:                                                           │  │
│  │ [Family vacation to province for reunion                      ]   │  │
│  │                                                                   │  │
│  │ Contact During Leave: +63 917 123 4567                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  APPROVAL WORKFLOW                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Status          │ Approver      │ Date/Time      │ Remarks       │  │
│  │─────────────────┼───────────────┼────────────────┼───────────────│  │
│  │ Applied         │ J. Dela Cruz  │ Jan 10, 9:00AM │ -             │  │
│  │ Supervisor Appr │ M. Santos     │ Jan 10, 2:00PM │ Approved      │  │
│  │ HR Review       │ Pending       │ -              │ -             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  HR ACTIONS                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ HR Remarks: [_________________________________________________]  │  │
│  │                                                                   │  │
│  │ [Approve] [Reject] [Return for Revision] [Put on Hold]          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 8. Document Management

```
┌────────────────────────────────────────────────────────────────────────┐
│  EMPLOYEE DOCUMENT MANAGEMENT                          [Upload Document]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Employee: Juan Dela Cruz (G-001)                                      │
│                                                                          │
│  DOCUMENT CHECKLIST                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Required Documents                                  Status        │  │
│  │────────────────────────────────────────────────────────────────── │  │
│  │ ✓ Resume/CV                                        Uploaded       │  │
│  │ ✓ NBI Clearance                                   Valid til 2025 │  │
│  │ ⚠️ Police Clearance                                Expires Jan 30 │  │
│  │ ✓ Medical Certificate                             Valid til 2024 │  │
│  │ ✓ Birth Certificate (PSA)                         Uploaded       │  │
│  │ ✓ SSS E-1 Form                                    Uploaded       │  │
│  │ ✓ PhilHealth MDR                                  Uploaded       │  │
│  │ ✓ Pag-IBIG MDF                                    Uploaded       │  │
│  │ ✓ TIN ID/Form 2316                                Uploaded       │  │
│  │ 🔴 Security License                                Missing        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  UPLOADED DOCUMENTS                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Type            │ File Name      │ Upload Date │ Expiry │ Actions │  │
│  │─────────────────┼────────────────┼─────────────┼────────┼─────────│  │
│  │ NBI Clearance   │ NBI_2024.pdf   │ Jan 5, 2024 │ Jan 2025│ [View] │  │
│  │ Medical Cert    │ Medical.pdf    │ Jan 3, 2024 │ Jul 2024│ [View] │  │
│  │ Police Clear    │ Police.pdf     │ Jan 31, 2023│ Jan 2024│ [Renew]│  │
│  │ Resume          │ Resume_JDC.pdf │ Jan 1, 2024 │ -      │ [View] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Bulk Upload] [Download All] [Send Reminder] [Generate Report]         │
└────────────────────────────────────────────────────────────────────────┘
```

### 9. Organizational Structure Management

```
┌────────────────────────────────────────────────────────────────────────┐
│  ORGANIZATIONAL STRUCTURE                              [Edit Structure] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DEPARTMENT HIERARCHY                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Company                                                           │  │
│  │ ├── Executive Office (5 employees)                                │  │
│  │ ├── Operations Department (48 employees)                          │  │
│  │ │   ├── Field Operations (35)                                     │  │
│  │ │   └── Operations Support (13)                                   │  │
│  │ ├── Security Department (523 employees)                           │  │
│  │ │   ├── Location A (156)                                         │  │
│  │ │   │   ├── Main Gate (45)                                       │  │
│  │ │   │   ├── Building 1 (38)                                      │  │
│  │ │   │   └── Building 2 (73)                                      │  │
│  │ │   ├── Location B (189)                                         │  │
│  │ │   └── Location C (178)                                         │  │
│  │ ├── Human Resources (8 employees)                                │  │
│  │ ├── Finance Department (12 employees)                            │  │
│  │ └── Admin Department (15 employees)                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  POSITION MANAGEMENT                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Code │ Title              │ Grade │ Department │ Count │ Actions │  │
│  │──────┼────────────────────┼───────┼────────────┼───────┼─────────│  │
│  │ GRD  │ Security Guard     │ SG-1  │ Security   │  485  │ [Edit]  │  │
│  │ SUP  │ Security Supervisor│ SG-2  │ Security   │   38  │ [Edit]  │  │
│  │ TK   │ Timekeeper         │ AD-1  │ Operations │    5  │ [Edit]  │  │
│  │ HR   │ HR Officer         │ AD-2  │ HR         │    3  │ [Edit]  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Add Department] [Add Position] [Export Structure] [Print Org Chart]   │
└────────────────────────────────────────────────────────────────────────┘
```

### 10. HR Reports Dashboard

```
┌────────────────────────────────────────────────────────────────────────┐
│  HR REPORTS & ANALYTICS                                [Export] [Print] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Report Period: [January 2024 ▼]     Report Type: [All Reports ▼]      │
│                                                                          │
│  HEADCOUNT ANALYTICS                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ [Headcount Trend Graph - Last 12 Months]                         │  │
│  │                                                                   │  │
│  │ 700 ┤                                                    ╭──────  │  │
│  │ 650 ┤                                              ╭─────╯        │  │
│  │ 600 ┤                                        ╭─────╯              │  │
│  │ 550 ┤──────────────────────────────────╭─────╯                    │  │
│  │     └──┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬           │  │
│  │       J   F   M   A   M   J   J   A   S   O   N   D             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  KEY METRICS                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Turnover Rate: 2.3%          Absenteeism: 1.8%                  │  │
│  │ New Hires: 23                Separations: 15                     │  │
│  │ Avg Tenure: 3.2 years        Training Hours: 456                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  AVAILABLE REPORTS                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ • Employee Master List                              [Generate]   │  │
│  │ • Leave Balance Report                              [Generate]   │  │
│  │ • License Expiry Report                             [Generate]   │  │
│  │ • Birthday List                                     [Generate]   │  │
│  │ • Government Contributions Report                   [Generate]   │  │
│  │ • Training Compliance Report                        [Generate]   │  │
│  │ • Turnover Analysis                                 [Generate]   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. With Biometric System

- Enrollment of new guards
- Template management
- Device configuration
- Sync verification

### 2. With Timekeeper

- Provide employee master data
- Leave information for timesheet processing
- Schedule assignments

### 3. With Payroll Officer

- Employee banking information
- Government ID numbers
- Active employee list
- Leave balance data

### 4. With Operations Officer

- Guard assignments
- Location/detachment structure
- Position information

### 5. With HR/Payroll Manager

- Leave approval workflow
- Employee data change approvals
- Compliance reporting

## Business Rules

### Employee Management Rules

1. **Employee ID Generation**
   - Format: Type prefix + Sequential number
   - Guards: G-XXXX
   - Employees: E-XXXX
   - Cannot be changed once assigned

2. **Status Transitions**
   - Active → Inactive/Suspended/On Leave
   - Inactive → Active (with reactivation approval)
   - Terminated → Cannot be reactivated
   - AWOL → Auto-triggered after 3 days absence

3. **Document Requirements**
   - Mandatory documents must be uploaded before activation
   - Expiring documents trigger alerts 30 days before
   - Expired documents flag employee for review

### Leave Management Rules

1. **Leave Accrual**
   - Monthly accrual for regular employees
   - Prorated for new hires
   - Carry-over limits apply
   - Use-or-lose policy for excess

2. **Leave Application**
   - Advance notice required (configurable by type)
   - Supervisor approval mandatory
   - HR approval for extended leaves
   - Medical certificate for sick leave > 2 days

3. **Balance Management**
   - Negative balance allowed with approval
   - Year-end processing for forfeitures
   - Automatic credit on anniversary date

### Biometric Enrollment Rules

1. **Enrollment Requirements**
   - Minimum 2 fingerprints required
   - Quality threshold must be met
   - Test verification mandatory
   - Sync to all devices in location

2. **Re-enrollment Triggers**
   - Failed verification > 5 times
   - Device replacement
   - Template corruption
   - Security breach

## Reporting Capabilities

### 1. Operational Reports

- Daily attendance roster
- Active employee list
- New hire report
- Separation report

### 2. Compliance Reports

- Document expiry tracking
- License renewal schedule
- Government contribution list
- Training compliance matrix

### 3. Analytics Reports

- Headcount trends
- Turnover analysis
- Leave utilization
- Demographics analysis

### 4. Statutory Reports

- SSS R-3 Report
- PhilHealth RF-1
- Pag-IBIG MCRF
- BIR Alphalist

## Mobile Interface

```
┌─────────────────────┐
│ HR MOBILE           │
├─────────────────────┤
│                     │
│ QUICK STATS         │
│ Active: 665         │
│ On Leave: 15        │
│ New Hires: 3        │
│                     │
│ PENDING TASKS       │
│ • 5 Leave requests  │
│ • 3 Documents       │
│ • 2 Enrollments     │
│                     │
│ [Employee Search]   │
│ [Leave Approval]    │
│ [Documents]         │
│ [Reports]           │
└─────────────────────┘
```

## Security and Compliance

### Access Controls

- Role-based access to employee data
- Sensitive data encryption
- Audit trail for all changes
- Document access logging

### Data Privacy

- PII protection measures
- Consent management
- Data retention policies
- Right to be forgotten

### Compliance Requirements

- Labor law compliance
- Government reporting
- Document retention
- License tracking

## Implementation Priorities

### Phase 1: Core Master Data

1. Employee information management
2. Basic document tracking
3. Government ID management
4. Organization structure

### Phase 2: Leave Management

1. Leave balance initialization
2. Application workflow
3. Approval process
4. Balance tracking

### Phase 3: Biometric Integration

1. Enrollment interface
2. Template management
3. Device synchronization
4. Verification testing

### Phase 4: Advanced Features

1. Employee self-service
2. Advanced analytics
3. Automated compliance
4. Integration APIs

## Success Metrics

### Data Quality

- Employee data completeness: > 98%
- Document compliance rate: > 95%
- Government ID accuracy: 100%
- Leave balance accuracy: 100%

### Process Efficiency

- New hire onboarding: < 1 day
- Leave approval turnaround: < 24 hours
- Document upload time: < 5 minutes
- Report generation: < 30 seconds

### User Satisfaction

- Interface ease of use: > 4/5
- Search efficiency: < 3 seconds
- Mobile accessibility: 100%
- Self-service adoption: > 80%

## Conclusion

This HR Officer Workflow System provides:

1. **Comprehensive Master Data Management** - Complete employee lifecycle
   tracking
2. **Efficient Leave Administration** - Automated balance tracking and approval
   workflow
3. **Document Compliance** - Automated tracking and renewal alerts
4. **Biometric Integration** - Seamless enrollment and management
5. **Clear Separation from Payroll** - HR focuses on data, not computations

The system ensures data integrity and compliance while providing the foundation
for all other payroll and operational systems.
