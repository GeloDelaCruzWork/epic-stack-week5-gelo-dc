import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

export interface TimeLogCreateData {
	dtrId: string
	mode: 'in' | 'out'
	timestamp: string
}

interface TimeLogAddDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	dtrId: string
	onSave: (data: TimeLogCreateData) => Promise<void>
}

export function TimeLogAddDialog({
	open,
	onOpenChange,
	dtrId,
	onSave,
}: TimeLogAddDialogProps) {
	const now = new Date()
	const [formData, setFormData] = useState<TimeLogCreateData>({
		dtrId,
		mode: 'in',
		timestamp: now.toISOString(),
	})
	const [date, setDate] = useState(now.toISOString().split('T')[0])
	const [time, setTime] = useState(now.toTimeString().slice(0, 5))
	const [isSaving, setIsSaving] = useState(false)

	// Update formData when dtrId changes
	useEffect(() => {
		if (dtrId) {
			setFormData((prev) => ({
				...prev,
				dtrId: dtrId,
			}))
			console.log('TimeLogAddDialog: Updated dtrId to:', dtrId)
		}
	}, [dtrId])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		setIsSaving(true)
		try {
			// Combine date and time into ISO timestamp
			const timestamp = new Date(`${date}T${time}:00`).toISOString()
			await onSave({
				...formData,
				timestamp,
			})
			onOpenChange(false)
			// Reset form for next use
			const newNow = new Date()
			setFormData({
				dtrId,
				mode: 'in',
				timestamp: newNow.toISOString(),
			})
			setDate(newNow.toISOString().split('T')[0])
			setTime(newNow.toTimeString().slice(0, 5))
		} catch (error) {
			console.error('Failed to create TimeLog:', error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleModeChange = (value: string) => {
		setFormData({
			...formData,
			mode: value as 'in' | 'out',
		})
	}

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/50 backdrop-blur-sm" />
				<Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg">
					<Dialog.Title className="text-lg font-semibold">
						Add Time Log
					</Dialog.Title>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label>Mode</Label>
							<div className="flex gap-4">
								<label className="flex cursor-pointer items-center gap-2">
									<input
										type="radio"
										name="mode"
										value="in"
										checked={formData.mode === 'in'}
										onChange={(e) => handleModeChange(e.target.value)}
										className="h-4 w-4"
									/>
									<span>Time In</span>
								</label>
								<label className="flex cursor-pointer items-center gap-2">
									<input
										type="radio"
										name="mode"
										value="out"
										checked={formData.mode === 'out'}
										onChange={(e) => handleModeChange(e.target.value)}
										className="h-4 w-4"
									/>
									<span>Time Out</span>
								</label>
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
								value={time}
								onChange={(e) => setTime(e.target.value)}
								required
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
									'Create TimeLog'
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
