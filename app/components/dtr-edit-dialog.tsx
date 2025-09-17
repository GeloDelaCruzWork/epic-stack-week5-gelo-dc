import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

export interface DTRData {
	id: string
	date: string
	regularHours: number
	overtimeHours: number
	nightDifferential: number
}

interface DTREditDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	dtr: DTRData | null
	onSave: (data: DTRData) => Promise<void>
}

export function DTREditDialog({
	open,
	onOpenChange,
	dtr,
	onSave,
}: DTREditDialogProps) {
	const [formData, setFormData] = useState<DTRData | null>(null)
	const [isSaving, setIsSaving] = useState(false)

	const [regularMinutes, setRegularMinutes] = useState(0)
	const [overtimeMinutes, setOvertimeMinutes] = useState(0)
	const [nightDifferentialMinutes, setNightDifferentialMinutes] = useState(0)

	useEffect(() => {
		if (dtr) {
			setFormData({ ...dtr })
			const rh = Math.floor(dtr.regularHours)
			const rm = Math.floor((dtr.regularHours - rh) * 60)
			setRegularMinutes(rm)

			const oh = Math.floor(dtr.overtimeHours)
			const om = Math.floor((dtr.overtimeHours - oh) * 60)
			setOvertimeMinutes(om)

			const ndh = Math.floor(dtr.nightDifferential)
			const ndm = Math.floor((dtr.nightDifferential - ndh) * 60)
			setNightDifferentialMinutes(ndm)
		}
	}, [dtr])

	const handleMinutesChange = (
		setter: React.Dispatch<React.SetStateAction<number>>,
		field: keyof DTRData,
		value: string,
	) => {
		if (!formData) return
		const minutes = parseInt(value, 10) || 0
		setter(minutes)
		const hours = Math.floor(formData[field] as number)
		handleInputChange(field, hours + minutes / 60)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData) return

		setIsSaving(true)
		try {
			await onSave(formData)
			onOpenChange(false)
		} catch (error) {
			console.error('Failed to save DTR:', error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleInputChange = (field: keyof DTRData, value: string | number) => {
		if (!formData) return
		const parsedValue = typeof value === 'string' ? parseFloat(value) : value
		setFormData({
			...formData,
			[field]:
				field === 'regularHours' ||
				field === 'overtimeHours' ||
				field === 'nightDifferential'
					? parsedValue || 0
					: value,
		})
	}

	const formatDate = (dateString: string) => {
		if (!dateString) return ''
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		})
	}

	if (!formData) return null

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/50 backdrop-blur-sm" />
				<Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg">
					<div className="mb-4 flex items-center justify-between">
						<div>
							<Dialog.Title className="text-lg font-semibold">
								Edit Daily Time Record
							</Dialog.Title>
						</div>
						<Dialog.Close asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<Icon name="cross-1" className="h-4 w-4" />
								<span className="sr-only">Close</span>
							</Button>
						</Dialog.Close>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-1 gap-4">
							<div className="space-y-2">
								<Label htmlFor="date">Date</Label>
								<Input
									id="date"
									type="date"
									value={
										formData.date
											? new Date(formData.date).toISOString().split('T')[0]
											: ''
									}
									onChange={(e) => handleInputChange('date', e.target.value)}
									required
									className="w-full"
								/>
								<p className="text-muted-foreground text-xs">
									The date for this time record
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="regularHours">Regular Hours</Label>
								<Input
									id="regularHours"
									type="number"
									step="0.01"
									min="0"
									max="24"
									value={formData.regularHours}
									onChange={(e) =>
										handleInputChange('regularHours', e.target.value)
									}
									required
								/>
								<Input
									id="regularMinutes"
									type="number"
									min="0"
									max="59"
									value={regularMinutes}
									onChange={(e) =>
										handleMinutesChange(
											setRegularMinutes,
											'regularHours',
											e.target.value,
										)
									}
									placeholder="Minutes"
								/>
								<p className="text-muted-foreground text-xs">
									Standard working hours for this day
								</p>
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
											e.target.value,
										)
									}
									placeholder="Minutes"
								/>
								<p className="text-muted-foreground text-xs">
									Hours worked beyond regular schedule
								</p>
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
											e.target.value,
										)
									}
									placeholder="Minutes"
								/>
								<p className="text-muted-foreground text-xs">
									Hours worked during night shift (10 PM - 6 AM)
								</p>
							</div>
						</div>

						<div className="bg-muted/50 space-y-1 rounded-lg p-3">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Total Hours:</span>
								<span className="font-semibold">
									{(
										formData.regularHours +
										formData.overtimeHours +
										formData.nightDifferential
									).toFixed(2)}{' '}
									hrs
								</span>
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
