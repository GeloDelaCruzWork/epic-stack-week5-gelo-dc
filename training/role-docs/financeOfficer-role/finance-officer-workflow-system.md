# Finance Officer Workflow System

## Contract Rate Management, Billing & Financial Oversight

## Executive Summary

Based on the **Updated Role Narratives - Payroll System (Revised)**, this
document provides a comprehensive workflow and UI design for the Finance Officer
role. The Finance Officer manages all contract rates based on detachment,
sub-areas, shift positions, and oversees the financial aspects of guard
deployment while working closely with the Payroll Officer who applies these
rates to contracted hours.

## Finance Officer Role Overview

As defined in the Updated Role Narratives, the Finance Officer:

- Manages all contract rates based on detachment, sub-areas, shift, and
  positions
- Defines rate structures and application rules
- Maintains rate history with effective dates
- Initiates rate change requests through the approval system
- Manages client billing rates (separate from payroll rates)
- Oversees contract profitability and margins
- **Works closely with Payroll Officer** who applies rates to contracted hours
- Does NOT directly process payroll but provides the rate foundation

## Core Responsibilities

### 1. Contract Rate Management

#### A. Rate Structure Components

- **Base Rates**: Hourly/daily rates for contracted hours
- **Position Multipliers**: Different rates for guards vs supervisors
- **Shift Differentials**: Day shift vs night shift rates
- **Location Premiums**: Additional rates for specific locations
- **Overtime Multipliers**: 1.25x, 1.5x, 2x rates
- **Holiday Rates**: Regular holiday, special holiday rates
- **Special Assignment Rates**: Hazard pay, special skills premium

#### B. Rate Application Matrix

```
Rate Calculation = Base Rate × Position Multiplier × Shift Differential × Location Premium
```

### 2. Client Contract Management

#### A. Contract Types

- Fixed-term contracts with set rates
- Variable contracts with escalation clauses
- Cost-plus contracts with margin percentages
- Per-deployment contracts

#### B. Billing Rate Management

- Client billing rates (different from guard payroll rates)
- Margin calculation and tracking
- Contract profitability analysis
- Invoice generation support

### 3. Financial Oversight

- Cost analysis per deployment
- Margin tracking per contract
- Budget vs actual monitoring
- Financial reporting for management

## Database Schema Design

### Finance Management Tables

```sql
-- Contract Master Table
model Contract {
  id                String   @id @default(cuid())
  contractNumber    String   @unique
  clientId          String
  contractName      String

  -- Contract Details
  startDate         DateTime
  endDate           DateTime?
  contractType      ContractType
  status            ContractStatus @default(ACTIVE)

  -- Financial Terms
  totalValue        Decimal  @db.Decimal(12, 2)
  billingFrequency  BillingFrequency
  paymentTerms      Int      // Days
  currency          String   @default("PHP")

  -- Margin Settings
  targetMargin      Decimal  @db.Decimal(5, 2)
  minimumMargin     Decimal  @db.Decimal(5, 2)

  -- Escalation Clause
  hasEscalation     Boolean  @default(false)
  escalationRate    Decimal? @db.Decimal(5, 2)
  escalationFrequency String? // Annual, Semi-annual

  -- Documentation
  contractDocument  String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  client            Client @relation(fields: [clientId], references: [id])
  contractRates     ContractRate[]
  deployments       Deployment[]
  invoices          Invoice[]

  @@index([status])
  @@index([clientId])
}

-- Client Master
model Client {
  id                String   @id @default(cuid())
  clientCode        String   @unique
  clientName        String

  -- Contact Information
  address           String
  contactPerson     String
  contactNumber     String
  email            String

  -- Business Information
  tinNumber         String?
  businessType      String?

  -- Credit Terms
  creditLimit       Decimal  @db.Decimal(12, 2)
  paymentTerms      Int      @default(30)

  status            ClientStatus @default(ACTIVE)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  contracts         Contract[]
  invoices          Invoice[]

  @@index([clientCode])
}

-- Enhanced Contract Rate Table
model ContractRate {
  id                String   @id @default(cuid())
  contractId        String?

  -- Rate Dimensions
  locationId        String
  detachmentId      String?
  subAreaId         String?
  shiftId           String
  positionId        String

  -- Payroll Rates (Cost to Company)
  baseRate          Decimal  @db.Decimal(10, 2)
  overtimeRate      Decimal  @db.Decimal(10, 2)
  nightDifferential Decimal  @db.Decimal(10, 2)
  holidayRate       Decimal  @db.Decimal(10, 2)
  specialHolidayRate Decimal @db.Decimal(10, 2)

  -- Billing Rates (Charged to Client)
  billingBaseRate   Decimal  @db.Decimal(10, 2)
  billingOTRate     Decimal  @db.Decimal(10, 2)
  billingNDRate     Decimal  @db.Decimal(10, 2)
  billingHolidayRate Decimal @db.Decimal(10, 2)

  -- Margin Calculation
  targetMargin      Decimal  @db.Decimal(5, 2)
  actualMargin      Decimal? @db.Decimal(5, 2)

  -- Effectivity
  effectiveDate     DateTime
  endDate           DateTime?

  -- Approval Status
  status            RateStatus @default(DRAFT)
  approvedBy        String?
  approvedDate      DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  contract          Contract? @relation(fields: [contractId], references: [id])
  location          Location @relation(fields: [locationId], references: [id])
  detachment        Detachment? @relation(fields: [detachmentId], references: [id])
  shift             Shift @relation(fields: [shiftId], references: [id])
  position          Position @relation(fields: [positionId], references: [id])
  rateHistory       RateHistory[]

  @@unique([contractId, locationId, detachmentId, subAreaId, shiftId, positionId, effectiveDate])
  @@index([effectiveDate])
  @@index([status])
}

-- Rate History Tracking
model RateHistory {
  id                String   @id @default(cuid())
  contractRateId    String

  -- What changed
  fieldName         String
  oldValue          String
  newValue          String

  -- Change Management
  changeReason      String
  changedBy         String
  changedDate       DateTime @default(now())

  -- Approval
  approvalStatus    ApprovalStatus
  approvedBy        String?
  approvedDate      DateTime?

  contractRate      ContractRate @relation(fields: [contractRateId], references: [id])

  @@index([contractRateId])
  @@index([changedDate])
}

-- Deployment Management
model Deployment {
  id                String   @id @default(cuid())
  contractId        String
  locationId        String

  -- Deployment Details
  requiredGuards    Int
  requiredSupervisors Int
  startDate         DateTime
  endDate           DateTime?

  -- Cost Tracking
  estimatedCost     Decimal  @db.Decimal(12, 2)
  actualCost        Decimal? @db.Decimal(12, 2)
  billedAmount      Decimal? @db.Decimal(12, 2)

  status            DeploymentStatus @default(ACTIVE)

  contract          Contract @relation(fields: [contractId], references: [id])
  location          Location @relation(fields: [locationId], references: [id])

  @@index([contractId])
  @@index([status])
}

-- Billing and Invoicing
model Invoice {
  id                String   @id @default(cuid())
  invoiceNumber     String   @unique
  contractId        String
  clientId          String

  -- Invoice Period
  periodStart       DateTime
  periodEnd         DateTime

  -- Financial Details
  subtotal          Decimal  @db.Decimal(12, 2)
  taxAmount         Decimal  @db.Decimal(12, 2)
  totalAmount       Decimal  @db.Decimal(12, 2)

  -- Payment Tracking
  status            InvoiceStatus @default(DRAFT)
  dueDate           DateTime
  paidAmount        Decimal? @db.Decimal(12, 2)
  paidDate          DateTime?

  createdAt         DateTime @default(now())
  sentDate          DateTime?

  contract          Contract @relation(fields: [contractId], references: [id])
  client            Client @relation(fields: [clientId], references: [id])
  invoiceLines      InvoiceLine[]

  @@index([status])
  @@index([clientId])
}

model InvoiceLine {
  id                String   @id @default(cuid())
  invoiceId         String

  description       String
  quantity          Decimal  @db.Decimal(10, 2)
  unitPrice         Decimal  @db.Decimal(10, 2)
  amount            Decimal  @db.Decimal(12, 2)

  invoice           Invoice @relation(fields: [invoiceId], references: [id])

  @@index([invoiceId])
}

-- Rate Templates
model RateTemplate {
  id                String   @id @default(cuid())
  templateName      String   @unique
  description       String?

  -- Standard Rates
  guardDayRate      Decimal  @db.Decimal(10, 2)
  guardNightRate    Decimal  @db.Decimal(10, 2)
  supervisorDayRate Decimal  @db.Decimal(10, 2)
  supervisorNightRate Decimal @db.Decimal(10, 2)

  -- Standard Multipliers
  overtimeMultiplier Decimal @db.Decimal(3, 2) @default(1.25)
  holidayMultiplier  Decimal @db.Decimal(3, 2) @default(2.00)

  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())

  @@index([templateName])
}

-- Budget Management
model Budget {
  id                String   @id @default(cuid())
  budgetYear        Int
  budgetMonth       Int
  departmentId      String?
  locationId        String?

  -- Budget Amounts
  personnelCost     Decimal  @db.Decimal(12, 2)
  operatingCost     Decimal  @db.Decimal(12, 2)
  totalBudget       Decimal  @db.Decimal(12, 2)

  -- Actuals
  actualPersonnel   Decimal? @db.Decimal(12, 2)
  actualOperating   Decimal? @db.Decimal(12, 2)
  actualTotal       Decimal? @db.Decimal(12, 2)

  -- Variance
  variance          Decimal? @db.Decimal(12, 2)
  variancePercent   Decimal? @db.Decimal(5, 2)

  status            BudgetStatus @default(DRAFT)

  @@unique([budgetYear, budgetMonth, departmentId, locationId])
  @@index([budgetYear, budgetMonth])
}

-- Enums
enum ContractType {
  FIXED_TERM
  OPEN_ENDED
  PROJECT_BASED
  RETAINER
}

enum ContractStatus {
  DRAFT
  ACTIVE
  SUSPENDED
  EXPIRED
  TERMINATED
}

enum ClientStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  BLACKLISTED
}

enum BillingFrequency {
  MONTHLY
  SEMI_MONTHLY
  WEEKLY
  QUARTERLY
  ONE_TIME
}

enum RateStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
  EXPIRED
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

enum DeploymentStatus {
  PLANNED
  ACTIVE
  COMPLETED
  CANCELLED
}

enum InvoiceStatus {
  DRAFT
  SENT
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}

enum BudgetStatus {
  DRAFT
  APPROVED
  REVISED
  CLOSED
}
```

## User Interface Design

### 1. Finance Dashboard - Main Screen

```
┌────────────────────────────────────────────────────────────────────────┐
│  FINANCE MANAGEMENT SYSTEM                             [User] [Logout]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    FINANCIAL OVERVIEW                            │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│  │
│  │  │ Active      │  │ Monthly     │  │   Margin    │  │ Overdue ││  │
│  │  │ Contracts   │  │  Revenue    │  │   Average   │  │ Invoices││  │
│  │  │     23      │  │ ₱8,245,000  │  │   18.5%     │  │    3    ││  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  QUICK ACTIONS                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ [💰 Rate Management] [📄 Contracts] [🧾 Billing]                 │  │
│  │ [📊 Cost Analysis]   [📈 Reports]   [⚙️ Templates]              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────┬────────────────────────────┐  │
│  │ RATE CHANGES PENDING APPROVAL      │ CONTRACT ALERTS             │  │
│  │                                     │                             │  │
│  │ • Location A night shift (+5%)     │ ⚠️ 3 contracts expiring     │  │
│  │ • Location B supervisor rate       │ 🔴 2 below minimum margin   │  │
│  │ • Holiday rate adjustment          │ ℹ️ 5 rate reviews due       │  │
│  │                                     │                             │  │
│  │ [View All Pending]                  │ [View All Alerts]           │  │
│  └─────────────────────────────────────┴────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Contract Rate Management Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│  CONTRACT RATE MANAGEMENT                              [+ New Rate Set] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Contract: [All Contracts ▼]  Location: [All ▼]  Effective: [Jan 2024 ▼]│
│                                                                          │
│  RATE CONFIGURATION MATRIX                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │         Location A - Main Gate                    [Expand All ▼]  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Position    │ Shift │ Base Rate │ OT Rate │ ND Rate │ Margin │Act│  │
│  │─────────────┼───────┼───────────┼─────────┼─────────┼────────┼───│  │
│  │ Guard       │ Day   │ ₱75.00/hr │ ₱93.75  │   -     │ 18.5%  │[✏]│  │
│  │ Guard       │ Night │ ₱85.00/hr │ ₱106.25 │ ₱10.00  │ 19.2%  │[✏]│  │
│  │ Supervisor  │ Day   │ ₱100/hr   │ ₱125.00 │   -     │ 20.0%  │[✏]│  │
│  │ Supervisor  │ Night │ ₱110/hr   │ ₱137.50 │ ₱12.00  │ 20.5%  │[✏]│  │
│  │                                                                   │  │
│  │         Location B - Building 1                                   │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Guard       │ Day   │ ₱72.00/hr │ ₱90.00  │   -     │ 17.8%  │[✏]│  │
│  │ Guard       │ Night │ ₱82.00/hr │ ₱102.50 │ ₱10.00  │ 18.5%  │[✏]│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  BULK ACTIONS: [Copy Rates] [Apply Template] [Export] [Submit Changes]  │
└────────────────────────────────────────────────────────────────────────┘
```

### 3. Rate Change Request Form

```
┌────────────────────────────────────────────────────────────────────────┐
│  RATE CHANGE REQUEST                                           [Cancel] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  REQUEST DETAILS                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Request Type: [Rate Adjustment ▼]                                │  │
│  │ Effective Date: [January 1, 2024]                                │  │
│  │ End Date (Optional): [___________]                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  RATE SELECTION                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Contract: [Contract ABC-2024 ▼]                                  │  │
│  │ Location: [Location A ▼]                                         │  │
│  │ Detachment: [Main Gate ▼]                                        │  │
│  │ Position: [Guard ▼]                                              │  │
│  │ Shift: [Night Shift ▼]                                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  RATE ADJUSTMENTS                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Current → Proposed                             │  │
│  │                                                                   │  │
│  │ Base Rate:         ₱85.00 → [₱90.00] (+5.88%)                   │  │
│  │ Overtime Rate:     ₱106.25 → [₱112.50] (+5.88%)                 │  │
│  │ Night Differential: ₱10.00 → [₱12.00] (+20.00%)                 │  │
│  │ Holiday Rate:      ₱170.00 → [₱180.00] (+5.88%)                 │  │
│  │                                                                   │  │
│  │ Billing Rate:      ₱105.00 → [₱115.00] (+9.52%)                 │  │
│  │ Target Margin:     18.5% → [20.0%]                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  JUSTIFICATION                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Reason: [Annual rate adjustment per contract ▼]                  │  │
│  │ • Annual rate adjustment                                         │  │
│  │ • Minimum wage increase                                          │  │
│  │ • Client negotiation                                             │  │
│  │ • Market rate adjustment                                         │  │
│  │ • Special skill requirement                                      │  │
│  │                                                                   │  │
│  │ Additional Notes:                                                │  │
│  │ [Annual 5% increase as per contract clause 4.2. Client has      │  │
│  │  approved the billing rate adjustment effective Jan 1, 2024.]   │  │
│  │                                                                   │  │
│  │ Supporting Documents: [Upload Contract Amendment]                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  IMPACT ANALYSIS                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Affected Guards: 45                                              │  │
│  │ Monthly Cost Impact: +₱78,500                                    │  │
│  │ Monthly Revenue Impact: +₱125,000                                │  │
│  │ Margin Impact: +1.5%                                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Save Draft] [Submit for Verification]                                 │
└────────────────────────────────────────────────────────────────────────┘
```

### 4. Contract Management Interface

```
┌────────────────────────────────────────────────────────────────────────┐
│  CONTRACT MANAGEMENT                                   [+ New Contract] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Search: [_______________] Status: [Active ▼] Client: [All ▼] [Search] │
│                                                                          │
│  CONTRACT LIST                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Contract # │ Client        │ Value      │ Margin │ Status │Actions│  │
│  │────────────┼───────────────┼────────────┼────────┼────────┼───────│  │
│  │ ABC-2024   │ ABC Corp      │ ₱5M/month  │ 18.5%  │ Active │ [···] │  │
│  │ XYZ-2023   │ XYZ Ltd       │ ₱3M/month  │ 22.0%  │ Active │ [···] │  │
│  │ DEF-2024   │ DEF Inc       │ ₱2M/month  │ 15.2%  │ Review │ [···] │  │
│  │ GHI-2023   │ GHI Company   │ ₱4M/month  │ 19.8%  │ Expiring│ [···]│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  Showing 1-10 of 23 contracts         [Previous] [1] [2] [3] [Next]     │
│                                                                          │
│  BULK ACTIONS: [Export] [Generate Reports] [Renew Selected]             │
└────────────────────────────────────────────────────────────────────────┘
```

### 5. Contract Details & Profitability

```
┌────────────────────────────────────────────────────────────────────────┐
│  CONTRACT DETAILS                                      [Edit] [Renew]   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Overview] [Rates] [Deployments] [Billing] [Profitability] [Documents]│
│                                                                          │
│  CONTRACT INFORMATION                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Contract #: ABC-2024              Client: ABC Corporation        │  │
│  │ Start Date: Jan 1, 2024           End Date: Dec 31, 2024        │  │
│  │ Contract Value: ₱60,000,000/year  Status: Active                │  │
│  │ Billing: Monthly                  Terms: Net 30                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  DEPLOYMENT SUMMARY                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Location        │ Guards │ Supervisors │ Total Hours │ Cost      │  │
│  │─────────────────┼────────┼─────────────┼─────────────┼───────────│  │
│  │ Location A      │   45   │      3      │   8,640     │ ₱648,000  │  │
│  │ Location B      │   30   │      2      │   5,760     │ ₱432,000  │  │
│  │ Location C      │   25   │      2      │   4,800     │ ₱360,000  │  │
│  │ TOTAL           │  100   │      7      │  19,200     │₱1,440,000 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  PROFITABILITY ANALYSIS (Current Month)                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Revenue:           ₱5,000,000     [████████████████░░] 100%     │  │
│  │ Direct Costs:      ₱3,850,000     [███████████████░░░]  77%     │  │
│  │ - Personnel:       ₱3,500,000     [██████████████░░░░]  70%     │  │
│  │ - Operations:      ₱  350,000     [██░░░░░░░░░░░░░░░░]   7%     │  │
│  │ Gross Margin:      ₱1,150,000     [█████░░░░░░░░░░░░░]  23%     │  │
│  │ Overhead:          ₱  250,000     [█░░░░░░░░░░░░░░░░░]   5%     │  │
│  │ Net Margin:        ₱  900,000     [████░░░░░░░░░░░░░░]  18%     │  │
│  │                                                                   │  │
│  │ Target Margin: 20%               Actual: 18%        Status: ⚠️   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 6. Billing Rate vs Payroll Rate Comparison

```
┌────────────────────────────────────────────────────────────────────────┐
│  RATE COMPARISON ANALYSIS                              [Export] [Print] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Contract: ABC-2024                    Location: Location A             │
│                                                                          │
│  RATE COMPARISON MATRIX                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Component         │ Payroll Rate │ Billing Rate │ Margin   │ %    │  │
│  │───────────────────┼──────────────┼──────────────┼──────────┼──────│  │
│  │ Guard - Day Shift                                                 │  │
│  │ Base Rate         │    ₱75/hr    │   ₱92/hr    │  ₱17/hr  │ 22.7%│  │
│  │ Overtime          │    ₱94/hr    │   ₱115/hr   │  ₱21/hr  │ 22.3%│  │
│  │ Holiday           │    ₱150/hr   │   ₱184/hr   │  ₱34/hr  │ 22.7%│  │
│  │                                                                   │  │
│  │ Guard - Night Shift                                               │  │
│  │ Base Rate         │    ₱85/hr    │   ₱105/hr   │  ₱20/hr  │ 23.5%│  │
│  │ Night Diff        │    ₱10/hr    │   ₱12/hr    │  ₱2/hr   │ 20.0%│  │
│  │ Overtime          │    ₱106/hr   │   ₱131/hr   │  ₱25/hr  │ 23.6%│  │
│  │                                                                   │  │
│  │ Supervisor - Day                                                  │  │
│  │ Base Rate         │    ₱100/hr   │   ₱125/hr   │  ₱25/hr  │ 25.0%│  │
│  │ Overtime          │    ₱125/hr   │   ₱156/hr   │  ₱31/hr  │ 24.8%│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  MARGIN ANALYSIS                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Average Margin: 23.2%                                            │  │
│  │ Target Margin: 20.0%                                             │  │
│  │ Status: ✓ Above Target                                           │  │
│  │                                                                   │  │
│  │ Recommendations:                                                 │  │
│  │ • Night differential margin below target (20% vs 22%)            │  │
│  │ • Consider rate adjustment for night differential                │  │
│  │ • Overall contract margin healthy                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 7. Invoice Generation Interface

```
┌────────────────────────────────────────────────────────────────────────┐
│  INVOICE GENERATION                                    [Back to Billing]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  INVOICE DETAILS                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Invoice #: [Auto-generate]         Date: [January 31, 2024]      │  │
│  │ Client: ABC Corporation             Contract: ABC-2024           │  │
│  │ Period: January 1-31, 2024          Due Date: February 29, 2024  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  INVOICE LINES                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Description                    │ Hours │ Rate    │ Amount        │  │
│  │────────────────────────────────┼───────┼─────────┼───────────────│  │
│  │ Security Services - Location A                                   │  │
│  │   Guards (Day Shift)           │ 5,760 │ ₱92/hr  │ ₱529,920      │  │
│  │   Guards (Night Shift)         │ 5,760 │ ₱105/hr │ ₱604,800      │  │
│  │   Supervisors (Day)            │   384 │ ₱125/hr │ ₱48,000       │  │
│  │   Overtime Hours               │   720 │ ₱131/hr │ ₱94,320       │  │
│  │                                                                   │  │
│  │ Security Services - Location B                                   │  │
│  │   Guards (Day Shift)           │ 3,840 │ ₱90/hr  │ ₱345,600      │  │
│  │   Guards (Night Shift)         │ 3,840 │ ₱102/hr │ ₱391,680      │  │
│  │   [Add Line]                                                     │  │
│  │                                                                   │  │
│  │                                        Subtotal: ₱4,514,320      │  │
│  │                                        VAT (12%): ₱541,718       │  │
│  │                                        TOTAL: ₱5,056,038         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ATTACHMENTS                                                            │
│  ☑ Deployment Report  ☑ Attendance Summary  ☐ Incident Reports         │
│                                                                          │
│  [Save Draft] [Preview] [Send to Client] [Print]                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 8. Budget vs Actual Analysis

```
┌────────────────────────────────────────────────────────────────────────┐
│  BUDGET VS ACTUAL ANALYSIS                             [Export] [Print] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Period: [January 2024 ▼]  View: [All Locations ▼]  [Refresh]         │
│                                                                          │
│  BUDGET PERFORMANCE OVERVIEW                                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Category        │ Budget      │ Actual      │ Variance │ %       │  │
│  │─────────────────┼─────────────┼─────────────┼──────────┼─────────│  │
│  │ REVENUE                                                           │  │
│  │ Contract Rev    │ ₱15,000,000 │ ₱15,245,000 │ +245,000 │ +1.6%   │  │
│  │ Other Income    │ ₱   500,000 │ ₱   485,000 │  -15,000 │ -3.0%   │  │
│  │ Total Revenue   │ ₱15,500,000 │ ₱15,730,000 │ +230,000 │ +1.5%   │  │
│  │                                                                   │  │
│  │ COSTS                                                             │  │
│  │ Personnel       │ ₱11,500,000 │ ₱11,825,000 │ -325,000 │ -2.8%   │  │
│  │ Operations      │ ₱ 1,200,000 │ ₱ 1,156,000 │  +44,000 │ +3.7%   │  │
│  │ Admin           │ ₱   800,000 │ ₱   785,000 │  +15,000 │ +1.9%   │  │
│  │ Total Costs     │ ₱13,500,000 │ ₱13,766,000 │ -266,000 │ -2.0%   │  │
│  │                                                                   │  │
│  │ MARGIN                                                            │  │
│  │ Gross Margin    │ ₱ 2,000,000 │ ₱ 1,964,000 │  -36,000 │ -1.8%   │  │
│  │ Margin %        │    12.9%    │    12.5%    │   -0.4%  │         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  VARIANCE ANALYSIS BY LOCATION                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Location    │ Budget Cost │ Actual Cost │ Variance │ Status      │  │
│  │─────────────┼─────────────┼─────────────┼──────────┼─────────────│  │
│  │ Location A  │ ₱4,500,000  │ ₱4,625,000  │ -125,000 │ Over ⚠️     │  │
│  │ Location B  │ ₱3,800,000  │ ₱3,750,000  │  +50,000 │ Under ✓     │  │
│  │ Location C  │ ₱3,200,000  │ ₱3,450,000  │ -250,000 │ Over 🔴     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Drill Down] [Forecast] [Adjust Budget] [Generate Report]              │
└────────────────────────────────────────────────────────────────────────┘
```

### 9. Rate Template Management

```
┌────────────────────────────────────────────────────────────────────────┐
│  RATE TEMPLATE MANAGEMENT                              [+ New Template] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  AVAILABLE TEMPLATES                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Template Name   │ Description              │ Last Used │ Actions  │  │
│  │─────────────────┼──────────────────────────┼───────────┼──────────│  │
│  │ Standard 2024   │ Default rates for 2024   │ Jan 15    │ [Apply]  │  │
│  │ Premium Client  │ 25% margin minimum       │ Jan 10    │ [Apply]  │  │
│  │ Government      │ DOLE compliant rates     │ Jan 5     │ [Apply]  │  │
│  │ Provincial      │ Provincial minimum rates │ Dec 28    │ [Apply]  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  TEMPLATE: Standard 2024                                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Position/Shift     │ Base Rate │ OT Multi │ Holiday │ ND Rate   │  │
│  │────────────────────┼───────────┼──────────┼─────────┼───────────│  │
│  │ Guard - Day        │ ₱75/hr    │ 1.25x    │ 2.0x    │ -         │  │
│  │ Guard - Night      │ ₱85/hr    │ 1.25x    │ 2.0x    │ ₱10/hr    │  │
│  │ Supervisor - Day   │ ₱100/hr   │ 1.25x    │ 2.0x    │ -         │  │
│  │ Supervisor - Night │ ₱110/hr   │ 1.25x    │ 2.0x    │ ₱12/hr    │  │
│  │                                                                   │  │
│  │ Standard Margins:                                                 │  │
│  │ • Minimum: 15%                                                    │  │
│  │ • Target: 20%                                                     │  │
│  │ • Premium: 25%                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Edit Template] [Clone] [Delete] [Set as Default]                      │
└────────────────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. With Payroll Officer

The Finance Officer provides rates that the Payroll Officer applies:

- Contract rates for base pay calculation
- Overtime multipliers
- Night differential rates
- Holiday premiums
- Special assignment rates

```
Finance Officer → Rate Definition → Payroll Officer → Rate Application
```

### 2. With Timekeeper

- Receives billable hours (normalized time)
- Uses for client billing calculations
- Compares actual vs billable hours

### 3. With Operations

- Deployment requirements for costing
- Location/shift coverage for rate application
- Schedule data for billing validation

### 4. With HR Manager

- Approves rate change requests
- Reviews financial impact of HR decisions
- Validates budget compliance

## Business Rules

### Rate Management Rules

1. **Rate Change Approval**
   - All rate changes require three-tier approval
   - Effective dates must be future-dated
   - Cannot reduce rates below minimum wage
   - Client approval needed for billing rate changes

2. **Margin Protection**
   - Minimum margin threshold: 15%
   - Warning triggered below 18%
   - Automatic escalation below 15%
   - Override requires executive approval

3. **Rate Application Hierarchy**
   ```
   Contract Rate > Location Rate > Standard Rate > Minimum Wage
   ```

### Contract Management Rules

1. **Contract Creation**
   - Requires complete rate matrix
   - Minimum margin validation
   - Credit check for new clients
   - Legal review for high-value contracts

2. **Contract Renewal**
   - 90-day advance notice
   - Automatic rate escalation if configured
   - Performance review required
   - Profitability analysis mandatory

### Billing Rules

1. **Invoice Generation**
   - Monthly cutoff on 25th
   - Automatic calculation from timesheets
   - Requires Operations validation
   - Finance Officer approval for adjustments

2. **Payment Terms**
   - Standard: Net 30
   - Premium clients: Net 45
   - Government: Net 60
   - Late payment penalties apply

## Reporting Capabilities

### 1. Financial Reports

- Contract profitability analysis
- Margin analysis by location/client
- Budget vs actual comparison
- Revenue forecasting

### 2. Rate Reports

- Rate comparison matrix
- Rate change history
- Margin trend analysis
- Competitive rate analysis

### 3. Client Reports

- Client billing summary
- Outstanding receivables
- Contract performance
- Service level compliance

### 4. Management Reports

- Executive dashboard
- Financial KPIs
- Contract pipeline
- Risk assessment

## Mobile Interface

```
┌─────────────────────┐
│ FINANCE MOBILE      │
├─────────────────────┤
│                     │
│ PENDING APPROVALS   │
│ Rate Changes: 3     │
│ Invoices: 5         │
│                     │
│ QUICK METRICS       │
│ Revenue MTD: ₱15M   │
│ Margin: 18.5%       │
│ Outstanding: ₱3M    │
│                     │
│ [Rate Approval]     │
│ [View Contracts]    │
│ [Margin Analysis]   │
│ [Reports]           │
└─────────────────────┘
```

## Security and Compliance

### Access Controls

- Rate viewing: Read-only for most users
- Rate editing: Finance Officer only
- Rate approval: Requires hierarchy
- Financial data: Restricted access

### Audit Requirements

- All rate changes logged
- Approval chain documented
- Historical rates preserved
- Change justification required

### Compliance

- Minimum wage compliance
- DOLE regulations
- Tax compliance
- Contract adherence

## Implementation Priorities

### Phase 1: Core Rate Management

1. Rate structure setup
2. Basic CRUD operations
3. Rate application rules
4. Change request workflow

### Phase 2: Contract Management

1. Contract creation and tracking
2. Client management
3. Deployment costing
4. Profitability analysis

### Phase 3: Billing Integration

1. Invoice generation
2. Billing rate management
3. Payment tracking
4. Receivables management

### Phase 4: Advanced Analytics

1. Margin optimization
2. Predictive analytics
3. What-if scenarios
4. Automated reporting

## Success Metrics

### Financial Performance

- Average margin: > 20%
- Rate accuracy: 100%
- Invoice accuracy: > 99%
- Collection rate: > 95%

### Operational Efficiency

- Rate change turnaround: < 24 hours
- Invoice generation time: < 5 minutes
- Report generation: < 30 seconds
- System uptime: > 99.9%

### User Satisfaction

- Interface ease of use: > 4/5
- Process efficiency: > 80% improvement
- Error reduction: > 90%
- Approval cycle time: < 2 days

## Conclusion

This Finance Officer Workflow System provides:

1. **Comprehensive Rate Management** - Complete control over all rate structures
2. **Contract Profitability Tracking** - Real-time margin analysis
3. **Billing Integration** - Seamless invoice generation
4. **Financial Oversight** - Budget vs actual monitoring
5. **Clear Separation of Duties** - Finance defines rates, Payroll applies them

The system ensures financial control and profitability while maintaining clear
integration with the Payroll Officer for rate application.
