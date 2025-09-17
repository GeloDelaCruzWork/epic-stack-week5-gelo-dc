import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

interface DeleteConfirmationDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	itemType: string
	itemDescription?: string
	onConfirm: () => void
	onCancel: () => void
}

export function DeleteConfirmationDialog({
	open,
	onOpenChange,
	itemType,
	itemDescription,
	onConfirm,
	onCancel,
}: DeleteConfirmationDialogProps) {
	const handleConfirm = () => {
		onConfirm()
		onOpenChange(false)
	}

	const handleCancel = () => {
		onCancel()
		onOpenChange(false)
	}

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/50 backdrop-blur-sm" />
				<Dialog.Content className="border-border bg-background fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg sm:rounded-lg">
					<Dialog.Title className="flex items-center gap-2 text-lg font-semibold">
						<Icon name="trash" className="text-destructive h-5 w-5" />
						Delete {itemType}
					</Dialog.Title>
					<Dialog.Description className="text-muted-foreground text-sm">
						Are you sure you want to delete this {itemType.toLowerCase()}?
						{itemDescription && (
							<span className="text-foreground mt-2 block font-medium">
								{itemDescription}
							</span>
						)}
						<span className="text-destructive mt-3 block text-sm">
							This action cannot be undone.
						</span>
					</Dialog.Description>
					<div className="mt-4 flex justify-end gap-3">
						<Button variant="outline" onClick={handleCancel}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleConfirm}
							className="gap-2"
						>
							<Icon name="trash" className="h-4 w-4" />
							Delete
						</Button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
