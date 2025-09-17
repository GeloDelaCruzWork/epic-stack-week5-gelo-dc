import { type Route } from './+types/admin.role-assignments.ts'
import { useFetcher, useLoaderData } from 'react-router'
import { useState, useEffect } from 'react'
import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
	closestCenter,
	useDroppable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useDraggable } from '@dnd-kit/core'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.server.ts'
import { cn } from '#app/utils/misc.tsx'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '#app/components/ui/avatar.tsx'
import { Badge } from '#app/components/ui/badge.tsx'
import { ScrollArea } from '#app/components/ui/scroll-area.tsx'
import { toast } from 'sonner'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserWithRole(request, 'admin')

	const roles = await prisma.role.findMany({
		include: {
			users: {
				select: {
					id: true,
					username: true,
					name: true,
					email: true,
					image: {
						select: {
							id: true,
							altText: true,
						},
					},
				},
			},
			_count: {
				select: {
					users: true,
					permissions: true,
				},
			},
		},
		orderBy: {
			name: 'asc',
		},
	})

	const allUsers = await prisma.user.findMany({
		select: {
			id: true,
			username: true,
			name: true,
			email: true,
			image: {
				select: {
					id: true,
					altText: true,
				},
			},
			roles: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: {
			username: 'asc',
		},
	})

	return { roles, allUsers }
}

export async function action({ request }: Route.ActionArgs) {
	await requireUserWithRole(request, 'admin')

	const formData = await request.formData()
	const intent = formData.get('intent')
	const userId = formData.get('userId') as string
	const roleId = formData.get('roleId') as string

	if (!userId || !roleId) {
		return { error: 'Missing required fields' }
	}

	try {
		if (intent === 'assign') {
			await prisma.user.update({
				where: { id: userId },
				data: {
					roles: {
						connect: { id: roleId },
					},
				},
			})
			return { success: true, message: 'User assigned to role' }
		} else if (intent === 'unassign') {
			await prisma.user.update({
				where: { id: userId },
				data: {
					roles: {
						disconnect: { id: roleId },
					},
				},
			})
			return { success: true, message: 'User removed from role' }
		}
	} catch (error) {
		console.error('Role assignment error:', error)
		return { error: 'Failed to update role assignment' }
	}

	return { error: 'Invalid intent' }
}

interface User {
	id: string
	username: string
	name: string | null
	email: string
	image?: {
		id: string
		altText: string | null
	} | null
}

interface DraggableUserProps {
	user: User
	isDragging?: boolean
}

function DraggableUser({ user, isDragging = false }: DraggableUserProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		isDragging: isCurrentlyDragging,
	} = useDraggable({
		id: user.id,
		data: { user },
	})

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				transition: isCurrentlyDragging ? 'none' : undefined,
			}
		: undefined

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={cn(
				'bg-card hover:bg-accent flex cursor-move items-center gap-3 rounded-lg border p-3',
				isDragging && 'opacity-50',
				!isCurrentlyDragging && 'transition-all duration-200',
			)}
		>
			<Avatar className="h-8 w-8">
				{user.image?.id ? (
					<AvatarImage
						src={`/resources/user-images/${user.image.id}`}
						alt={user.image.altText || user.username}
					/>
				) : null}
				<AvatarFallback>
					{user.name?.slice(0, 2).toUpperCase() ||
						user.username.slice(0, 2).toUpperCase()}
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium">
					{user.name || user.username}
				</p>
				<p className="text-muted-foreground truncate text-xs">{user.email}</p>
			</div>
		</div>
	)
}

interface DroppableZoneProps {
	id: string
	users: User[]
	title: string
	count: number
	emptyMessage: string
	emptySubMessage: string
}

function DroppableZone({
	id,
	users,
	title,
	count,
	emptyMessage,
	emptySubMessage,
}: DroppableZoneProps) {
	const { setNodeRef, isOver } = useDroppable({ id })

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>{title}</span>
					<Badge variant="secondary">{count}</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[500px]">
					<div
						ref={setNodeRef}
						className={cn(
							'min-h-[480px] rounded-lg border-2 border-dashed p-2 transition-colors',
							users.length === 0 && 'border-muted-foreground/25',
							isOver && 'border-primary bg-accent/50',
						)}
					>
						{users.length === 0 ? (
							<div className="text-muted-foreground flex h-full items-center justify-center">
								<p className="text-center">
									{emptyMessage}
									<br />
									<span className="text-sm">{emptySubMessage}</span>
								</p>
							</div>
						) : (
							<div className="space-y-2 transition-all duration-200">
								{users.map((user) => (
									<DraggableUser key={user.id} user={user} />
								))}
							</div>
						)}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	)
}

export default function RoleAssignments() {
	const loaderData = useLoaderData<typeof loader>()
	const [selectedRole, setSelectedRole] = useState<string | null>(
		loaderData.roles[0]?.id || null,
	)
	const [activeUser, setActiveUser] = useState<User | null>(null)
	const [optimisticAssignments, setOptimisticAssignments] = useState<
		Map<string, Set<string>>
	>(new Map())
	const fetcher = useFetcher()

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 200,
				tolerance: 8,
			},
		}),
	)

	// Apply optimistic updates to the data
	const roles = loaderData.roles.map((role: any) => {
		const optimisticUserIds = optimisticAssignments.get(role.id) || new Set()
		if (optimisticUserIds.size === 0) return role

		// Apply optimistic updates
		const updatedUsers = loaderData.allUsers.filter((u: any) =>
			optimisticUserIds.has(u.id),
		)
		return {
			...role,
			users: updatedUsers,
		}
	})

	const allUsers = loaderData.allUsers

	const currentRole = roles.find((r: any) => r.id === selectedRole)
	const assignedUsers = currentRole?.users || []
	const assignedUserIds = new Set<string>(assignedUsers.map((u: any) => u.id))
	const availableUsers = allUsers.filter((u: any) => !assignedUserIds.has(u.id))

	useEffect(() => {
		if (fetcher.data && fetcher.state === 'idle') {
			if ('success' in fetcher.data) {
				toast.success(fetcher.data.message)
				// Clear optimistic updates after successful save
				setOptimisticAssignments(new Map())
			} else if ('error' in fetcher.data) {
				toast.error(fetcher.data.error)
				// Revert optimistic updates on error
				setOptimisticAssignments(new Map())
			}
		}
	}, [fetcher.data, fetcher.state])

	function handleDragStart(event: DragStartEvent) {
		const { active } = event
		const activeData = active.data.current as { user: User } | undefined
		setActiveUser(activeData?.user || null)
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		setActiveUser(null)

		if (!over || !selectedRole) return

		const userId = active.id as string
		const isAssigned = assignedUserIds.has(userId)
		const dropZoneId = over.id as string

		// Only process if dropping on the opposite zone
		if (isAssigned && dropZoneId === 'available') {
			// Optimistically remove user from role
			setOptimisticAssignments((prev) => {
				const newMap = new Map(prev)
				const currentAssigned = Array.from(assignedUserIds)
				const roleUsers =
					newMap.get(selectedRole) || new Set<string>(currentAssigned)
				roleUsers.delete(userId)
				newMap.set(selectedRole, roleUsers)
				return newMap
			})

			// Unassign user from role in database
			fetcher.submit(
				{ intent: 'unassign', userId, roleId: selectedRole },
				{ method: 'POST' },
			)
		} else if (!isAssigned && dropZoneId === 'assigned') {
			// Optimistically add user to role
			setOptimisticAssignments((prev) => {
				const newMap = new Map(prev)
				const currentAssigned = Array.from(assignedUserIds)
				const roleUsers =
					newMap.get(selectedRole) || new Set<string>(currentAssigned)
				roleUsers.add(userId)
				newMap.set(selectedRole, roleUsers)
				return newMap
			})

			// Assign user to role in database
			fetcher.submit(
				{ intent: 'assign', userId, roleId: selectedRole },
				{ method: 'POST' },
			)
		}
	}

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Role Assignments</h1>
				<p className="text-muted-foreground mt-2">
					Drag and drop users to assign or remove them from roles
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
				{/* Roles Panel */}
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>Roles</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<ScrollArea className="h-[600px]">
							<div className="space-y-2 p-4">
								{roles.map((role) => (
									<button
										key={role.id}
										onClick={() => setSelectedRole(role.id)}
										className={cn(
											'w-full rounded-lg border p-3 text-left transition-colors',
											'hover:bg-accent',
											selectedRole === role.id && 'bg-accent border-primary',
										)}
									>
										<div className="font-medium">{role.name}</div>
										<div className="text-muted-foreground mt-1 text-sm">
											{role._count.users} users • {role._count.permissions}{' '}
											permissions
										</div>
										{role.description && (
											<div className="text-muted-foreground mt-2 text-xs">
												{role.description}
											</div>
										)}
									</button>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>

				{/* User Assignment Panels */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-3">
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
					>
						{/* Assigned Users */}
						<DroppableZone
							id="assigned"
							users={assignedUsers}
							title="Assigned Users"
							count={assignedUsers.length}
							emptyMessage="No users assigned"
							emptySubMessage="Drag users here to assign them"
						/>

						{/* Available Users */}
						<DroppableZone
							id="available"
							users={availableUsers}
							title="Available Users"
							count={availableUsers.length}
							emptyMessage="All users are assigned"
							emptySubMessage="Drag users here to remove them"
						/>

						<DragOverlay>
							{activeUser ? (
								<div className="opacity-80">
									<DraggableUser user={activeUser} isDragging />
								</div>
							) : null}
						</DragOverlay>
					</DndContext>
				</div>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				403: ({ error }) => (
					<div className="container mx-auto p-6">
						<div className="border-destructive/50 bg-destructive/10 rounded-lg border p-6">
							<h2 className="text-destructive mb-2 text-lg font-semibold">
								Access Denied
							</h2>
							<p className="text-muted-foreground">
								You must have admin role to access the Role Assignments page.
							</p>
						</div>
					</div>
				),
			}}
		/>
	)
}
