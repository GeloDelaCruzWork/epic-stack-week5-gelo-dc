import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

export interface TimeLogData {
	id: string
	mode: 'in' | 'out'
	timestamp: string
}

interface TimeLogEditDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	timelog: TimeLogData | null
	onSave: (data: TimeLogData) => Promise<void>
}

export function TimeLogEditDialog({
	open,
	onOpenChange,
	timelog,
	onSave,
}: TimeLogEditDialogProps) {
	const [formData, setFormData] = useState<TimeLogData | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [date, setDate] = useState('')
	const [time, setTime] = useState('')

	useEffect(() => {
		if (timelog) {
			setFormData({ ...timelog })
			// Parse the timestamp into date and time
			const timestamp = new Date(timelog.timestamp)
			// Format date as YYYY-MM-DD for input[type="date"]
			const year = timestamp.getFullYear()
			const month = String(timestamp.getMonth() + 1).padStart(2, '0')
			const day = String(timestamp.getDate()).padStart(2, '0')
			setDate(`${year}-${month}-${day}`)

			// Format time as HH:MM for input[type="time"]
			const hours = String(timestamp.getHours()).padStart(2, '0')
			const minutes = String(timestamp.getMinutes()).padStart(2, '0')
			setTime(`${hours}:${minutes}`)
		}
	}, [timelog])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData) return

		setIsSaving(true)
		try {
			// Combine date and time into a single timestamp
			const timestamp = new Date(`${date}T${time}:00`).toISOString()
			const updatedData = {
				...formData,
				timestamp,
			}
			await onSave(updatedData)
			onOpenChange(false)
		} catch (error) {
			console.error('Failed to save timelog:', error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleModeChange = (mode: 'in' | 'out') => {
		if (!formData) return
		setFormData({
			...formData,
			mode,
		})
	}

	const formatDisplayDateTime = () => {
		if (!formData?.timestamp) return ''
		const timestamp = new Date(formData.timestamp)
		return timestamp.toLocaleString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: true,
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
								Edit Time Log Entry
							</Dialog.Title>
							<p className="text-muted-foreground mt-1 text-sm">
								Current: {formatDisplayDateTime()}
							</p>
						</div>
						<Dialog.Close asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<Icon name="cross-1" className="h-4 w-4" />
								<span className="sr-only">Close</span>
							</Button>
						</Dialog.Close>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Log Type</Label>
								<div className="grid grid-cols-2 gap-2">
									<Button
										type="button"
										variant={formData.mode === 'in' ? 'default' : 'outline'}
										onClick={() => handleModeChange('in')}
										className={
											formData.mode === 'in'
												? 'bg-green-600 hover:bg-green-700'
												: ''
										}
									>
										<Icon name="arrow-right" className="mr-2 h-4 w-4" />
										TIME IN
									</Button>
									<Button
										type="button"
										variant={formData.mode === 'out' ? 'default' : 'outline'}
										onClick={() => handleModeChange('out')}
										className={
											formData.mode === 'out'
												? 'bg-red-600 hover:bg-red-700'
												: ''
										}
									>
										<Icon name="arrow-left" className="mr-2 h-4 w-4" />
										TIME OUT
									</Button>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="date">Date</Label>
								<Input
									id="date"
									type="date"
									value={date}
									onChange={(e) => setDate(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="time">Time</Label>
								<Input
									id="time"
									type="time"
									step="1"
									value={time}
									onChange={(e) => setTime(e.target.value)}
									required
								/>
								<p className="text-muted-foreground text-xs">
									24-hour format (HH:MM)
								</p>
							</div>
						</div>

						<div className="bg-muted/50 rounded-lg p-3">
							<div className="flex items-center gap-2 text-sm">
								<Icon
									name={formData.mode === 'in' ? 'arrow-right' : 'arrow-left'}
									className={`h-4 w-4 ${formData.mode === 'in' ? 'text-green-500' : 'text-red-500'}`}
								/>
								<span className="text-muted-foreground">
									This is a{' '}
									<span className="font-semibold">
										{formData.mode === 'in' ? 'TIME IN' : 'TIME OUT'}
									</span>{' '}
									entry
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
