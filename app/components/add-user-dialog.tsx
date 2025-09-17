import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
	Sheet,
	SheetTrigger,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetFooter,
	SheetClose,
} from '#app/components/ui/sheet'

export function AddUserDialog({ onUserAdded }: { onUserAdded: (name: string) => void }) {
	const [error, setError] = useState<string | null>(null)
	const [open, setOpen] = useState(false)

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError(null)
		const formData = new FormData(event.currentTarget)
		const data = Object.fromEntries(formData.entries())

		try {
			const response = await fetch('/api/users/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			})

			if (response.ok) {
				setOpen(false)
				onUserAdded(data.name as string)
			} else {
				const errorData = await response.json()
				const errorMessage =
					errorData.error ||
					(errorData.errors
						? JSON.stringify(errorData.errors)
						: 'Failed to create user')
				setError(errorMessage)
				console.error('Failed to create user:', errorData)
			}
		} catch (error) {
			setError('An unexpected error occurred.')
			console.error('An error occurred:', error)
		}
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button>Add User</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Add User</SheetTitle>
					<SheetDescription>
						Fill out the form to add a new user.
					</SheetDescription>
				</SheetHeader>
				<form className="mt-4 space-y-4" onSubmit={handleSubmit}>
					{error && <p className="text-red-500">{error}</p>}
					<div className="space-y-2">
						<Label htmlFor="username">Username</Label>
						<Input type="text" id="username" name="username" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input type="text" id="name" name="name" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input type="email" id="email" name="email" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input type="password" id="password" name="password" />
					</div>
					<SheetFooter>
						<Button variant="outline" type="button" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type="submit">Save</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	)
}

