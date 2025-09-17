import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

export interface ClockEventCreateData {
	timelogId: string
	clockTime: string
}

interface ClockEventAddDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	timelogId: string
	onSave: (data: ClockEventCreateData) => Promise<void>
}

export function ClockEventAddDialog({
	open,
	onOpenChange,
	timelogId,
	onSave,
}: ClockEventAddDialogProps) {
	const now = new Date()
	const [date, setDate] = useState(now.toISOString().split('T')[0])
	const [time, setTime] = useState(now.toTimeString().slice(0, 5))
	const [seconds, setSeconds] = useState(
		now.getSeconds().toString().padStart(2, '0'),
	)
	const [isSaving, setIsSaving] = useState(false)

	// Update timelogId when it changes
	useEffect(() => {
		if (timelogId) {
			console.log('ClockEventAddDialog: timelogId set to:', timelogId)
		}
	}, [timelogId])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		setIsSaving(true)
		try {
			// Combine date, time, and seconds into ISO timestamp
			const clockTime = new Date(`${date}T${time}:${seconds}`).toISOString()
			await onSave({
				timelogId,
				clockTime,
			})
			onOpenChange(false)
			// Reset form for next use
			const newNow = new Date()
			setDate(newNow.toISOString().split('T')[0])
			setTime(newNow.toTimeString().slice(0, 5))
			setSeconds(newNow.getSeconds().toString().padStart(2, '0'))
		} catch (error) {
			console.error('Failed to create Clock Event:', error)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/50 backdrop-blur-sm" />
				<Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg">
					<Dialog.Title className="text-lg font-semibold">
						Add Clock Event
					</Dialog.Title>
					<form onSubmit={handleSubmit} className="space-y-4">
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
						<div className="grid grid-cols-2 gap-4">
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
							<div className="space-y-2">
								<Label htmlFor="seconds">Seconds</Label>
								<Input
									id="seconds"
									type="number"
									min="0"
									max="59"
									value={seconds}
									onChange={(e) => setSeconds(e.target.value.padStart(2, '0'))}
									required
								/>
							</div>
						</div>
						<div className="text-muted-foreground text-sm">
							Clock Time: {date} {time}:{seconds}
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
									'Create Clock Event'
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
