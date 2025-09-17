import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from './ui/dialog' //Function: Imports Dialog components from the UI library.

export function DeleteUserDialog({
	selectedUserId,
	isOpen,
	setIsOpen,
	onUserDeleted,
}: {
	selectedUserId: string | null
	isOpen: boolean
	setIsOpen: (isOpen: boolean) => void
	onUserDeleted: (name: string) => void
}) {

	const [userName, setUserName] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null)

	// Effect to set userIdToDelete when the dialog opens
		// This effect ensures userIdToDelete is set as soon as the dialog is opened
	// and selectedUserId is available, preventing race conditions with handleDelete.
	useEffect(() => {
		if (isOpen && selectedUserId) {
			setUserIdToDelete(selectedUserId)
		} else if (!isOpen) {
			setUserIdToDelete(null)
		}
	}, [isOpen, selectedUserId])

	useEffect(() => {
		async function fetchUserName() {
			if (!userIdToDelete || !isOpen) { // Use userIdToDelete here
				setUserName(null)
				return
			}

			setIsLoading(true)
			setError(null)
			try {
				// Assuming an API endpoint to fetch user details by ID
				const response = await fetch(`/api/users/${userIdToDelete}`) // Use userIdToDelete here
				if (response.ok) {
					const userData = await response.json()
					setUserName(userData.name) // Assuming the API returns a 'name' field
				} else {
					const errorData = await response.json()
					setError(errorData.error || 'Failed to fetch user details')
					setUserName(null)
				}
			} catch (err) {
				console.error("Error fetching user details:", err)
				setError('An unexpected error occurred while fetching user details.')
				setUserName(null)
			} finally {
				setIsLoading(false)
			}
		}
		fetchUserName()
	}, [userIdToDelete, isOpen])

	const handleDelete = async () => {
		console.log("handleDelete called");
		if (!userIdToDelete) {
			console.log("No user ID to delete, returning.");
			return;
		}

		console.log("User ID to delete:", userIdToDelete);

		setError(null);
		const url = '/api/users/delete';
		const body = JSON.stringify({ userId: userIdToDelete });

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: body,
			});

			if (response.ok) {
				console.log("User deleted successfully.");
				setIsOpen(false);
				onUserDeleted(userName as string); // Pass userName here
			} else {
				const errorData = await response.json();
				console.error("Failed to delete user:", errorData);
				setError(errorData.error || 'Failed to delete');
			}
		} catch (error) {
			console.error("An unexpected error occurred during delete:", error);
			setError('An unexpected error occurred.');
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Warning</DialogTitle>
				</DialogHeader>
				<p className="my-4 text-gray-500 dark:text-gray-400">
					{isLoading
						? 'Loading user details...'
						: error
						? `Error: ${error}`
						: `Are you sure you want to delete this user named: ${userName}?`}
				</p>
				<DialogFooter>
					<Button
						variant="outline"
						type="button"
						onClick={() => setIsOpen(false)}
					>
						Cancel
					</Button>
					<Button variant="destructive" onClick={handleDelete}>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
