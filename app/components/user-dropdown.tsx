import { Img } from 'openimg/react'
import { useRef } from 'react'
import { Link, Form } from 'react-router'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { useUser } from '#app/utils/user.ts'
import { Button } from './ui/button'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuPortal,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from './ui/dropdown-menu'
import { Icon } from './ui/icon'

export function UserDropdown() {
	const user = useUser()
	const formRef = useRef<HTMLFormElement>(null)
	const hasAdminRole = user.roles.some((role) => role.name === 'admin')
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button asChild variant="secondary">
					<Link
						to={`/users/${user.username}`}
						// this is for progressive enhancement
						onClick={(e) => e.preventDefault()}
						className="flex items-center gap-2"
					>
						<Img
							className="size-8 rounded-full object-cover"
							alt={user.name ?? user.username}
							src={getUserImgSrc(user.image?.objectKey)}
							width={256}
							height={256}
						/>
						<span className="text-body-sm font-bold">
							{user.name ?? user.username}
						</span>
					</Link>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuPortal>
				<DropdownMenuContent sideOffset={8} align="end">
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to={`/users/${user.username}`}>
							<Icon className="text-body-md" name="avatar">
								Profile
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to="/projects">
							<Icon className="text-body-md" name="file-text">
								Projects
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to="/employees">
							<Icon className="text-body-md" name="file-text">
								Employees
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to="/timesheets">
							<Icon className="text-body-md" name="clock">
								Timesheets
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to="/clock/in/out">
							<Icon className="text-body-md" name="file-text">
								Clock In/Out
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to="/users-info">
							<Icon className="text-body-md" name="file-text">
								User Info
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to={`/users/${user.username}/notes`}>
							<Icon className="text-body-md" name="pencil-2">
								Notes
							</Icon>
						</Link>
					</DropdownMenuItem>
					{hasAdminRole && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<Link prefetch="intent" to="/admin/role-assignments">
									<Icon className="text-body-md" name="lock-closed">
										Role Assignments
									</Icon>
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link prefetch="intent" to="/admin/cache">
									<Icon className="text-body-md" name="file-text">
										Cache Admin
									</Icon>
								</Link>
							</DropdownMenuItem>
						</>
					)}
					<DropdownMenuSeparator />
					<Form action="/logout" method="POST" ref={formRef}>
						<DropdownMenuItem asChild>
							<button type="submit" className="w-full">
								<Icon className="text-body-md" name="exit">
									Logout
								</Icon>
							</button>
						</DropdownMenuItem>
					</Form>
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenu>
	)
}
