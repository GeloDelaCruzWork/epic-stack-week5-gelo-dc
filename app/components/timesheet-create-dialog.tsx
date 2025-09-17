import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

export type TimesheetCreateData = {
	employeeName: string
	payPeriod: string
	detachment: string
	shift: string
}

interface TimesheetCreateDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSave: (data: TimesheetCreateData) => Promise<void>
}

export function TimesheetCreateDialog({
	open,
	onOpenChange,
	onSave,
}: TimesheetCreateDialogProps) {
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const [formData, setFormData] = useState<TimesheetCreateData>({
		employeeName: '',
		payPeriod: '',
		detachment: '',
		shift: 'Day Shift',
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setSaving(true)

		try {
			await onSave(formData)
			onOpenChange(false)
			// Reset form
			setFormData({
				employeeName: '',
				payPeriod: '',
				detachment: '',
				shift: 'Day Shift',
			})
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to create timesheet',
			)
		} finally {
			setSaving(false)
		}
	}

	const updateField = (field: keyof TimesheetCreateData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/50" />
				<Dialog.Content className="border-border bg-background fixed top-[50%] left-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg sm:rounded-lg">
					<Dialog.Title className="text-lg font-semibold">
						Create New Timesheet
					</Dialog.Title>
					<Dialog.Description className="text-muted-foreground text-sm">
						Create a new timesheet record. All hour fields will start at zero.
					</Dialog.Description>

					<form onSubmit={handleSubmit}>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="employeeName">
									Employee Name <span className="text-destructive">*</span>
								</Label>
								<Input
									id="employeeName"
									value={formData.employeeName}
									onChange={(e) => updateField('employeeName', e.target.value)}
									placeholder="Last Name, First Name"
									required
									disabled={saving}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="payPeriod">
									Pay Period <span className="text-destructive">*</span>
								</Label>
								<Input
									id="payPeriod"
									value={formData.payPeriod}
									onChange={(e) => updateField('payPeriod', e.target.value)}
									placeholder="e.g., January 1 to 15"
									required
									disabled={saving}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="detachment">
									Detachment <span className="text-destructive">*</span>
								</Label>
								<Input
									id="detachment"
									value={formData.detachment}
									onChange={(e) => updateField('detachment', e.target.value)}
									placeholder="e.g., Diliman"
									required
									disabled={saving}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="shift">
									Shift <span className="text-destructive">*</span>
								</Label>
								<select
									id="shift"
									className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
									value={formData.shift}
									onChange={(e) => updateField('shift', e.target.value)}
									required
									disabled={saving}
								>
									<option value="Day Shift">Day Shift</option>
									<option value="Night Shift">Night Shift</option>
									<option value="Graveyard Shift">Graveyard Shift</option>
								</select>
							</div>

							{error && <div className="text-destructive text-sm">{error}</div>}
						</div>

						<div className="mt-6 flex justify-end gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={saving}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={saving}>
								{saving ? (
									<>
										<Icon name="update" className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									<>
										<Icon name="plus" className="mr-2 h-4 w-4" />
										Create Timesheet
									</>
								)}
							</Button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
