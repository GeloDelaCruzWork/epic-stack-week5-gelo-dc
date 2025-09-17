import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

export interface DTRCreateData {
	timesheetId: string
	date: string
	regularHours: number
	overtimeHours: number
	nightDifferential: number
}

interface DTRAddDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	timesheetId: string
	onSave: (data: DTRCreateData) => Promise<void>
}

export function DTRAddDialog({
	open,
	onOpenChange,
	timesheetId,
	onSave,
}: DTRAddDialogProps) {
	const [formData, setFormData] = useState<Omit<DTRCreateData, 'regularHours'>>(
		{
			timesheetId,
			date: new Date().toISOString().split('T')[0],
			overtimeHours: 0,
			nightDifferential: 0,
		},
	)
	const [isSaving, setIsSaving] = useState(false)

	const [regularHoursFrom, setRegularHoursFrom] = useState('08:00')
	const [regularHoursTo, setRegularHoursTo] = useState('16:00')
	const [overtimeMinutes, setOvertimeMinutes] = useState(0)
	const [nightDifferentialMinutes, setNightDifferentialMinutes] = useState(0)

	useEffect(() => {
		if (timesheetId) {
			setFormData((prev) => ({
				...prev,
				timesheetId: timesheetId,
			}))
		}
	}, [timesheetId])

	const handleMinutesChange = (
		setter: React.Dispatch<React.SetStateAction<number>>,
		field: keyof DTRCreateData,
		hours: number,
		value: string,
	) => {
		const minutes = parseInt(value, 10) || 0
		setter(minutes)
		handleInputChange(field, hours + minutes / 60)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSaving(true)

		const [fromHours, fromMinutes] = regularHoursFrom
			.split(':')
			.map(Number) || [0, 0]
		const [toHours, toMinutes] = regularHoursTo.split(':').map(Number) || [0, 0]

		const fromDate = new Date()
		fromDate.setHours(fromHours, fromMinutes, 0, 0)

		const toDate = new Date()
		toDate.setHours(toHours, toMinutes, 0, 0)

		if (toDate < fromDate) {
			toDate.setDate(toDate.getDate() + 1)
		}

		const diffInMs = toDate.getTime() - fromDate.getTime()
		const regularHours = diffInMs / (1000 * 60 * 60)

		try {
			await onSave({ ...formData, regularHours })
			onOpenChange(false)
			setFormData({
				timesheetId,
				date: new Date().toISOString().split('T')[0] ?? '',
				overtimeHours: 0,
				nightDifferential: 0,
			})
			setRegularHoursFrom('08:00')
			setRegularHoursTo('16:00')
			setOvertimeMinutes(0)
			setNightDifferentialMinutes(0)
		} catch (error) {
			console.error('Failed to create DTR:', error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleInputChange = (
		field: keyof DTRCreateData,
		value: string | number,
	) => {
		const parsedValue = typeof value === 'string' ? parseFloat(value) : value
		setFormData((prev) => ({
			...prev,
			[field]:
				field === 'regularHours' ||
				field === 'overtimeHours' ||
				field === 'nightDifferential'
					? parsedValue || 0
					: value,
		}))
	}

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/50 backdrop-blur-sm" />
				<Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg">
					<Dialog.Title className="text-lg font-semibold">
						Add Daily Time Record
					</Dialog.Title>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="date">Date</Label>
							<Input
								id="date"
								type="date"
								value={formData.date}
								onChange={(e) => handleInputChange('date', e.target.value)}
								required
							/>
						</div>
						<div className="grid grid-cols-3 items-center gap-4">
							<Label htmlFor="regularHoursFrom" className="text-right">
								Regular Hours
							</Label>
							<div className="col-span-2 flex items-center gap-2">
								<Input
									id="regularHoursFrom"
									type="time"
									value={regularHoursFrom}
									onChange={(e) => setRegularHoursFrom(e.target.value)}
									required
								/>
								<span>to</span>
								<Input
									id="regularHoursTo"
									type="time"
									value={regularHoursTo}
									onChange={(e) => setRegularHoursTo(e.target.value)}
									required
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="overtimeHours">Overtime Hours</Label>
							<Input
								id="overtimeHours"
								type="number"
								step="0.01"
								min="0"
								max="24"
								value={formData.overtimeHours}
								onChange={(e) =>
									handleInputChange('overtimeHours', e.target.value)
								}
								required
							/>
							<Input
								id="overtimeMinutes"
								type="number"
								min="0"
								max="59"
								value={overtimeMinutes}
								onChange={(e) =>
									handleMinutesChange(
										setOvertimeMinutes,
										'overtimeHours',
										formData.overtimeHours,
										e.target.value,
									)
								}
								placeholder="Minutes"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="nightDifferential">
								Night Differential Hours
							</Label>
							<Input
								id="nightDifferential"
								type="number"
								step="0.01"
								min="0"
								max="24"
								value={formData.nightDifferential}
								onChange={(e) =>
									handleInputChange('nightDifferential', e.target.value)
								}
								required
							/>
							<Input
								id="nightDifferentialMinutes"
								type="number"
								min="0"
								max="59"
								value={nightDifferentialMinutes}
								onChange={(e) =>
									handleMinutesChange(
										setNightDifferentialMinutes,
										'nightDifferential',
										formData.nightDifferential,
										e.target.value,
									)
								}
								placeholder="Minutes"
							/>
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
										Creating...
									</>
								) : (
									'Create DTR'
								)}
							</Button>
						</div>
					</form>
					<Dialog.Close asChild>
						<button
							className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
							aria-label="Close"
						>
							<Icon name="cross-1" className="h-4 w-4" />
						</button>
					</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
