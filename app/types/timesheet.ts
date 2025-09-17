/**
 * TypeScript Type Definitions for Timesheet Management System
 */

import type { GridApi, RowNode, RowDoubleClickedEvent } from 'ag-grid-community'

// Database Models
export interface Timesheet {
	id: string
	employeeName: string
	payPeriod: string
	detachment: string
	shift: 'Day Shift' | 'Night Shift' | 'Mid Shift'
	regularHours: number
	overtimeHours: number
	nightDifferential: number
	createdAt: Date
	updatedAt: Date
	dtrs?: DTR[]
}

export interface DTR {
	id: string
	date: Date
	regularHours: number
	overtimeHours: number
	nightDifferential: number
	createdAt: Date
	updatedAt: Date
	timesheetId: string
	timesheet?: Timesheet
	timelogs?: TimeLog[]
}

export interface TimeLog {
	id: string
	mode: 'in' | 'out'
	timestamp: Date
	createdAt: Date
	updatedAt: Date
	dtrId: string
	dtr?: DTR
	clockEvents?: ClockEvent[]
}

export interface ClockEvent {
	id: string
	clockTime: Date
	createdAt: Date
	updatedAt: Date
	timelogId: string
	timelog?: TimeLog
}

// API Response Types
export interface TimesheetLoaderData {
	timesheets: Timesheet[]
}

export interface DTRApiResponse {
	dtrs: DTR[]
}

export interface TimeLogApiResponse {
	timelogs: TimeLog[]
}

export interface ClockEventApiResponse {
	clockEvents: ClockEvent[]
}

export interface UpdateTimesheetResponse {
	timesheet: Timesheet
}

export interface UpdateDTRResponse {
	dtr: DTR
	timesheet: Timesheet
}

export interface UpdateTimeLogResponse {
	timelog: TimeLog
	dtr: DTR
	timesheet: Timesheet
}

export interface UpdateClockEventResponse {
	clockEvent: ClockEvent
	timelog: TimeLog
	dtr: DTR
	timesheet: Timesheet
}

// Dialog Component Props
export interface TimesheetEditDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	timesheet: Timesheet | null
	onSave: (data: Timesheet) => Promise<void>
}

export interface DTREditDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	dtr: DTRData | null
	onSave: (data: DTRData) => Promise<void>
}

export interface TimeLogEditDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	timelog: TimeLogData | null
	onSave: (data: TimeLogData) => Promise<void>
}

export interface ClockEventEditDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	clockEvent: ClockEventData | null
	onSave: (data: ClockEventData) => Promise<void>
}

// Form Data Types
export interface DTRData {
	id: string
	date: string
	regularHours: number
	overtimeHours: number
	nightDifferential: number
}

export interface TimeLogData {
	id: string
	mode: 'in' | 'out'
	timestamp: string
}

export interface ClockEventData {
	id: string
	clockTime: string
}

// Grid Event Types
export interface TimesheetRowDoubleClickedEvent extends RowDoubleClickedEvent {
	data: Timesheet
	node: RowNode
}

export interface DTRRowDoubleClickedEvent extends RowDoubleClickedEvent {
	data: DTR
	node: RowNode
}

export interface TimeLogRowDoubleClickedEvent extends RowDoubleClickedEvent {
	data: TimeLog
	node: RowNode
}

export interface ClockEventRowDoubleClickedEvent extends RowDoubleClickedEvent {
	data: ClockEvent
	node: RowNode
}

// Grid Configuration Types
export interface DetailCellRendererParams {
	detailGridOptions: {
		columnDefs: any[]
		defaultColDef: any
		headerHeight: number
		rowHeight: number
		domLayout?: string
		masterDetail?: boolean
		detailCellRenderer?: string
		detailCellRendererParams?: any
		detailRowHeight?: number
		isRowMaster?: (dataItem: any) => boolean
		onRowDoubleClicked?: (event: RowDoubleClickedEvent) => void
		onRowGroupOpened?: (event: any) => void
	}
	getDetailRowData: (params: any) => Promise<void>
}

// Calculation Types
export interface HoursCalculation {
	regularHours: number
	overtimeHours: number
	nightDifferential: number
}

export interface ValidationResult {
	isValid: boolean
	errors: ValidationError[]
}

export interface ValidationError {
	field: string
	message: string
	severity: 'error' | 'warning'
}

// State Management Types
export interface TimesheetPageState {
	rowData: Timesheet[]
	editDialogOpen: boolean
	selectedTimesheet: Timesheet | null
	dtrEditDialogOpen: boolean
	selectedDTR: DTR | null
	timelogEditDialogOpen: boolean
	selectedTimeLog: TimeLog | null
	clockEventEditDialogOpen: boolean
	selectedClockEvent: ClockEvent | null
	expandedNodeId: string | null
}

// Utility Types
export type ShiftType = 'Day Shift' | 'Night Shift' | 'Mid Shift'

export interface DateRange {
	start: Date
	end: Date
}

export interface PayPeriod {
	period: string
	startDate: Date
	endDate: Date
	workingDays: number
}

// Error Types
export class TimesheetError extends Error {
	constructor(
		message: string,
		public code: string,
		public details?: any,
	) {
		super(message)
		this.name = 'TimesheetError'
	}
}

export class ValidationError extends Error {
	constructor(
		message: string,
		public field: string,
		public value: any,
	) {
		super(message)
		this.name = 'ValidationError'
	}
}

// Enum Types
export enum TimesheetStatus {
	DRAFT = 'DRAFT',
	SUBMITTED = 'SUBMITTED',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
	PAID = 'PAID',
}

export enum ApprovalAction {
	APPROVE = 'APPROVE',
	REJECT = 'REJECT',
	REQUEST_REVISION = 'REQUEST_REVISION',
}

// Export all types
export type { GridApi, RowNode }
