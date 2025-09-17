import { useLoaderData, useRevalidator } from 'react-router-dom'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { Toaster, toast } from 'sonner'

import 'ag-grid-community/styles/ag-theme-quartz.css' // Function: Removed ag-grid.css import to prevent theming conflicts and rely on ag-theme-quartz.
import { ColDef, RowSelectedEvent, RowDoubleClickedEvent } from 'ag-grid-community'
import { useMemo, useState, useCallback, useRef } from 'react'
import { useTheme } from '#app/routes/resources+/theme-switch.tsx'
import { AddUserDialog } from '#app/components/add-user-dialog.tsx'
import { DeleteUserDialog } from '#app/components/delete-user-dialog.tsx'
//Function: Imports the EditUserDialog component for user editing functionality.
import { EditUserDialog } from '#app/components/edit-user-dialog.tsx'
import { Button } from '#app/components/ui/button.tsx'

// Register AG-Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

//Function: Loads the list of users from the database.
export async function loader({ request }: { request: Request }) {
	await requireUserId(request)

	const users = await prisma.user.findMany({
		select: {
			id: true,
			username: true,
			name: true,
			email: true,
		},
	})

	return { users }
}

//Function: Renders the user information page with a grid of users.
export default function UsersInfoPage() {
	const { users } = useLoaderData<typeof loader>()
	const theme = useTheme()
	const gridRef = useRef<AgGridReact>(null)
	const revalidator = useRevalidator()

	const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; username: string; email: string } | null>(null)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	//Function: State to control the visibility of the edit user dialog.
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	//Function: State to store the user data selected for editing.
	const [selectedUserForEdit, setSelectedUserForEdit] = useState<{ id: string; name: string; username: string; email: string } | null>(null)

	//Function: Handles the selection of a user in the grid and updates the state.
	const onSelectionChanged = useCallback((event: RowSelectedEvent) => {
		const selectedRows = event.api.getSelectedRows()
		if (selectedRows.length > 0) {
			
			console.log("Selected row data:", selectedRows[0]); // Added console.log
			setSelectedUser(selectedRows[0])
		} else {
			setSelectedUser(null)
		}
	}, [])

	//Function: Handles double-clicking a row in the grid to open the edit user dialog.
	const onRowDoubleClicked = useCallback((event: RowDoubleClickedEvent) => {
		setSelectedUserForEdit(event.data)
		setIsEditDialogOpen(true)
	}, [])

	//Function: Handles clicks outside the grid to deselect the current user.
	const onBodyClick = (event: React.MouseEvent<HTMLDivElement>) => {
		let target = event.target as HTMLElement
		let isRowClick = false
		while (target && target !== document.body) {
			if (target.classList.contains('ag-row')) {
				isRowClick = true
				break
			}
			target = target.parentElement as HTMLElement
		}

		if (!isRowClick && gridRef.current) {
			gridRef.current.api.deselectAll()
		}
	}

	const onUserAdded = (name: string) => {
		revalidator.revalidate()
		toast.success(`User ${name} is successfully added`)
	}

	//Function: Revalidates user data after a user has been updated.
	const onUserUpdated = (name: string) => {
		revalidator.revalidate()
		toast.success(`User ${name} is successfully edited`)
	}

	const onUserDeleted = (name: string) => {
		revalidator.revalidate()
		toast.success(`User ${name} is successfully deleted`)
	}

	const gridThemeClass =
		theme === 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'

	const columnDefs = useMemo<ColDef[]>(
		() => [
			{
				field: 'username',
				headerName: 'Username',
				filter: 'agTextColumnFilter',
				floatingFilter: true,
				flex: 1,
				cellStyle: // Function: Dynamically sets background color and text color based on theme (light/dark mode).
					theme === 'dark'
						? { backgroundColor: '#A7C7E7', color: 'black' } // Pastel Blue for Dark Mode, Black text
						: { backgroundColor: '#E0F2F7' }, // Light Blue for Light Mode
			},
			{
				field: 'name',
				headerName: 'Name',
				filter: 'agTextColumnFilter',
				floatingFilter: true,
				flex: 1,
				cellStyle: // Function: Dynamically sets background color and text color based on theme (light/dark mode).
					theme === 'dark'
						? { backgroundColor: '#B2D8B2', color: 'black' } // Pastel Green for Dark Mode, Black text
						: { backgroundColor: '#E8F5E9' }, // Light Green for Light Mode
			},
			{
				field: 'email',
				headerName: 'Email',
				filter: 'agTextColumnFilter',
				floatingFilter: true,
				flex: 1,
				cellStyle: // Function: Dynamically sets background color and text color based on theme (light/dark mode).
					theme === 'dark'
						? { backgroundColor: '#FFB6C1', color: 'black' } // Pastel Red for Dark Mode, Black text
						: { backgroundColor: '#FFEBEE' }, // Light Red for Light Mode
			},
			{
				field: 'id',
				headerName: 'ID',
				filter: 'agTextColumnFilter',
				floatingFilter: true,
				flex: 1,
				cellStyle: // Function: Dynamically sets background color and text color based on theme (light/dark mode).
					theme === 'dark'
						? { backgroundColor: '#D8BFD8', color: 'black' } // Pastel Purple for Dark Mode, Black text
						: { backgroundColor: '#F3E5F5' }, // Light Purple for Light Mode
			},
		],
		[theme] // Function: Added 'theme' to dependency array to re-render columnDefs when theme changes.
	)

	const defaultColDef = useMemo<ColDef>(
		() => ({
			sortable: true,
			resizable: true,
		}),
		[],
	)

	return (
		<div className="container mx-auto px-4 py-8" { ...(!isDeleteDialogOpen && { onClick: onBodyClick }) }>
			<Toaster />
			<div className="mb-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-foreground text-3xl font-bold">User Information</h1>
						<p className="text-muted-foreground mt-2">
							A list of all users in the system.
						</p>
					</div>
					{selectedUser && (
						<div className="text-right text-lg font-semibold">
							Selected User: {selectedUser.name}
						</div>
					)}
				</div>
				<div className="mt-4 flex gap-2">
					<AddUserDialog onUserAdded={() => onUserAdded(selectedUser?.name || '')} />
					{selectedUser && (
						<Button variant="destructive" onClick={() => {
							
							console.log("Delete User button clicked. selectedUser:", selectedUser); // Add this
							setIsDeleteDialogOpen(true);
						}}>
							Delete User
						</Button>
					)}
				</div>
				<DeleteUserDialog
					selectedUserId={selectedUser?.id || null}
					isOpen={isDeleteDialogOpen}
					setIsOpen={setIsDeleteDialogOpen}
					onUserDeleted={() => onUserDeleted(selectedUser?.name || '')} // Function: Revalidates user data to update the grid in real-time after a user is deleted.
				/>
				<EditUserDialog
					user={selectedUserForEdit}
					isOpen={isEditDialogOpen}
					onClose={() => setIsEditDialogOpen(false)}
					onUserUpdated={() => onUserUpdated(selectedUserForEdit?.name || '')}
				/>
			</div>

			<div className="border-border bg-card rounded-lg border shadow-sm">
				<div
					className={`${gridThemeClass} h-[700px] w-full`}
					style={{}} // Function: Removed inline dark mode styles to rely on ag-theme-quartz-dark CSS variables.
				>
					<AgGridReact
						ref={gridRef}
						rowData={users}
						columnDefs={columnDefs}
						defaultColDef={defaultColDef}
						pagination={true}
						paginationPageSize={15}
						paginationPageSizeSelector={[15, 30, 50, 100]}
						rowSelection='single'
						onSelectionChanged={onSelectionChanged}
						onRowDoubleClicked={onRowDoubleClicked}
					/>
				</div>
			</div>
		</div>
	)
}
