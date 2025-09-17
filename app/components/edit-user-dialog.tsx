import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from './ui/dialog' //Function: Imports Dialog components from the UI library.

export function EditUserDialog({
	user,
	isOpen,
	onClose,
	onUserUpdated,
}: {
	user: { id: string; name: string | null; username: string; email:string } | null
	isOpen: boolean
	onClose: () => void
	onUserUpdated: (name: string) => void
}) {
	const [error, setError] = useState<string | null>(null)
	const [formData, setFormData] = useState({
		username: '',
		name: '',
		email: '',
		password: '',
	})

	useEffect(() => {
		if (user) {
			setFormData({
				username: user.username,
				name: user.name ?? '',
				email: user.email,
				password: '', // Password should not be pre-filled
			})
		}
	}, [user])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.id]: e.target.value })
	}

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError(null)

		try {
			const response = await fetch(`/api/users/${user?.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			})

			if (response.ok) {
				onClose()
				onUserUpdated(formData.name)
			} else {
				const errorData = await response.json()
				const errorMessage =
					errorData.error ||
					(errorData.errors
						? JSON.stringify(errorData.errors)
						: 'Failed to update user')
				setError(errorMessage)
				console.error('Failed to update user:', errorData)
			}
		} catch (error) {
			setError('An unexpected error occurred.')
			console.error('An error occurred:', error)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editing user: {user?.name || user?.username}</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-gray-500 dark:text-gray-400">
					Fill out the form to edit the user.
				</p>
				<form className="mt-4 space-y-4" onSubmit={handleSubmit}>
					{error && <p className="text-red-500">{error}</p>}
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							type="text"
							id="name"
							name="name"
							value={formData.name}
							onChange={handleChange}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="username">Username</Label>
						<Input
							type="text"
							id="username"
							name="username"
							value={formData.username}
							onChange={handleChange}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							type="email"
							id="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							type="password"
							id="password"
							name="password"
							placeholder="Enter new password (leave blank to keep current)"
							value={formData.password}
							onChange={handleChange}
						/>
					</div>
					<DialogFooter className="mt-6">
						<Button variant="outline" type="button" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">Save changes</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
