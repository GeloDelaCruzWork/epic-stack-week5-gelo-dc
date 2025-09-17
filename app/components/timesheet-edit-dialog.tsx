import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '#app/lib/utils'
import { Button } from '#app/components/ui/button'
import { Calendar } from '#app/components/ui/calendar'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '#app/components/ui/popover'
import { Input } from '#app/components/ui/input'
import { Label } from '#app/components/ui/label'
import { Icon } from '#app/components/ui/icon'

export interface TimesheetData {
	id: string
	employeeName: string
	payPeriod: string
	detachment: string
	shift: string
	regularHours: number
	overtimeHours: number
	nightDifferential: number
}

interface TimesheetEditDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	timesheet: TimesheetData | null
	onSave: (data: TimesheetData) => Promise<void>
}

export function TimesheetEditDialog({
	open,
	onOpenChange,
	timesheet,
	onSave,
}: TimesheetEditDialogProps) {
	const [formData, setFormData] = useState<TimesheetData | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [date, setDate] = useState<Date | undefined>(new Date())
	const [isCalendarOpen, setIsCalendarOpen] = useState(false)

	useEffect(() => {
		if (timesheet) {
			setFormData({ ...timesheet })
		}
	}, [timesheet])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData) return

		setIsSaving(true)
		try {
			await onSave(formData)
			onOpenChange(false)
		} catch (error) {
			console.error('Failed to save timesheet:', error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleInputChange = (
		field: keyof TimesheetData,
		value: string | number | Date,
	) => {
		if (!formData) return
		setFormData({
			...formData,
			[field]:
				field === 'regularHours' ||
				field === 'overtimeHours' ||
				field === 'nightDifferential'
					? parseFloat(value as string) || 0
					: value,
		})
	}

	if (!formData) return null

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/50 backdrop-blur-sm" />
				<Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg">
					<div className="mb-4 flex items-center justify-between">
						<Dialog.Title className="text-lg font-semibold">
							Edit Timesheet Record
						</Dialog.Title>
						<Dialog.Close asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<Icon name="cross-1" className="h-4 w-4" />
								<span className="sr-only">Close</span>
							</Button>
						</Dialog.Close>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="payPeriod">Pay Period</Label>
								<Input
									id="payPeriod"
									value={formData.payPeriod}
									onChange={(e) =>
										handleInputChange('payPeriod', e.target.value)
									}
									placeholder="e.g., 2023-01-01 to 2023-01-15"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="employeeName">Employee Name</Label>
								<Input
									id="employeeName"
									value={formData.employeeName}
									onChange={(e) =>
										handleInputChange('employeeName', e.target.value)
									}
									placeholder="Last Name, First Name"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="detachment">Detachment</Label>
								<Input
									id="detachment"
									value={formData.detachment}
									onChange={(e) =>
										handleInputChange('detachment', e.target.value)
									}
									placeholder="e.g., Diliman"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="shift">Shift</Label>
								<select
									id="shift"
									value={formData.shift}
									onChange={(e) => handleInputChange('shift', e.target.value)}
									className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
									required
								>
									<option value="Day Shift">Day Shift</option>
									<option value="Night Shift">Night Shift</option>
									<option value="Mid Shift">Mid Shift</option>
								</select>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="regularHours">Regular Hours</Label>
								<Input
									id="regularHours"
									type="number"
									step="0.1"
									min="0"
									value={formData.regularHours}
									onChange={(e) =>
										handleInputChange('regularHours', e.target.value)
									}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="overtimeHours">Overtime Hours</Label>
								<Input
									id="overtimeHours"
									type="number"
									step="0.1"
									min="0"
									value={formData.overtimeHours}
									onChange={(e) =>
										handleInputChange('overtimeHours', e.target.value)
									}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="nightDifferential">Night Differential</Label>
								<Input
									id="nightDifferential"
									type="number"
									step="0.1"
									min="0"
									value={formData.nightDifferential}
									onChange={(e) =>
										handleInputChange('nightDifferential', e.target.value)
									}
									required
								/>
							</div>
						</div>

						<div className="flex justify-end gap-3 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSaving}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving ? (
									<>
										<Icon name="update" className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									'Save Changes'
								)}
							</Button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
