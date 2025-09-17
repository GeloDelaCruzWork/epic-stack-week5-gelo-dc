import { useState } from 'react'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card'
import { Button } from '#app/components/ui/button'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '#app/components/ui/tabs'
import { Badge } from '#app/components/ui/badge'
import { Progress } from '#app/components/ui/progress'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#app/components/ui/select'
import { Icon } from '#app/components/ui/icon'

interface WorkflowInstance {
	id: string
	workflowName: string
	employeeName: string
	employeeType: string
	status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
	currentStep: number
	totalSteps: number
	startedAt: string
	dueDate?: string
	completedAt?: string
}

interface WorkflowTask {
	id: string
	taskName: string
	assignedTo: string
	priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
	status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
	dueDate?: string
}

interface WorkflowMetrics {
	totalActive: number
	completed: number
	pending: number
	overdue: number
	averageCompletionTime: number
	onTimeRate: number
}

export function WorkflowDashboard() {
	const [selectedEmployeeType, setSelectedEmployeeType] =
		useState<string>('all')
	const [selectedStatus, setSelectedStatus] = useState<string>('all')

	// Mock data - in real implementation, this would come from API
	const mockInstances: WorkflowInstance[] = [
		{
			id: '1',
			workflowName: 'Guard Onboarding',
			employeeName: 'Juan Dela Cruz',
			employeeType: 'Security Guard',
			status: 'IN_PROGRESS',
			currentStep: 3,
			totalSteps: 8,
			startedAt: '2024-01-15T08:00:00Z',
			dueDate: '2024-01-20T17:00:00Z',
		},
		{
			id: '2',
			workflowName: 'Leave Request',
			employeeName: 'Maria Santos',
			employeeType: 'Non-Guard',
			status: 'PENDING',
			currentStep: 1,
			totalSteps: 4,
			startedAt: '2024-01-16T09:00:00Z',
			dueDate: '2024-01-17T17:00:00Z',
		},
		{
			id: '3',
			workflowName: 'Performance Review',
			employeeName: 'Pedro Garcia',
			employeeType: 'Security Guard',
			status: 'COMPLETED',
			currentStep: 5,
			totalSteps: 5,
			startedAt: '2024-01-10T08:00:00Z',
			completedAt: '2024-01-14T16:00:00Z',
		},
	]

	const mockTasks: WorkflowTask[] = [
		{
			id: '1',
			taskName: 'Verify Documents',
			assignedTo: 'HR Manager',
			priority: 'HIGH',
			status: 'PENDING',
			dueDate: '2024-01-18T12:00:00Z',
		},
		{
			id: '2',
			taskName: 'Approve Leave Request',
			assignedTo: 'Supervisor',
			priority: 'MEDIUM',
			status: 'PENDING',
			dueDate: '2024-01-17T17:00:00Z',
		},
		{
			id: '3',
			taskName: 'Schedule Training',
			assignedTo: 'Training Coordinator',
			priority: 'LOW',
			status: 'IN_PROGRESS',
			dueDate: '2024-01-19T15:00:00Z',
		},
	]

	const mockMetrics: WorkflowMetrics = {
		totalActive: 45,
		completed: 120,
		pending: 23,
		overdue: 5,
		averageCompletionTime: 3.5,
		onTimeRate: 87,
	}

	const getStatusBadge = (status: string) => {
		const statusConfig = {
			PENDING: { variant: 'secondary' as const, icon: 'clock' },
			IN_PROGRESS: { variant: 'default' as const, icon: 'refresh' },
			COMPLETED: { variant: 'success' as const, icon: 'check' },
			FAILED: { variant: 'destructive' as const, icon: 'x' },
			REJECTED: { variant: 'destructive' as const, icon: 'x' },
		}

		const config =
			statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

		return (
			<Badge variant={config.variant} className="gap-1">
				<Icon name={config.icon} className="h-3 w-3" />
				{status.replace('_', ' ')}
			</Badge>
		)
	}

	const getPriorityBadge = (priority: string) => {
		const priorityConfig = {
			LOW: { variant: 'secondary' as const, className: '' },
			MEDIUM: { variant: 'default' as const, className: '' },
			HIGH: {
				variant: 'warning' as const,
				className: 'bg-orange-500 text-white',
			},
			CRITICAL: { variant: 'destructive' as const, className: '' },
		}

		const config =
			priorityConfig[priority as keyof typeof priorityConfig] ||
			priorityConfig.MEDIUM

		return (
			<Badge variant={config.variant} className={config.className}>
				{priority}
			</Badge>
		)
	}

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	return (
		<div className="space-y-6">
			{/* Metrics Overview */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">
							Active Workflows
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{mockMetrics.totalActive}</div>
						<p className="text-muted-foreground mt-1 text-xs">
							+12% from last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">Completed</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{mockMetrics.completed}</div>
						<p className="text-muted-foreground mt-1 text-xs">This month</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{mockMetrics.pending}</div>
						<p className="text-muted-foreground mt-1 text-xs">
							{mockMetrics.overdue} overdue
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{mockMetrics.onTimeRate}%</div>
						<Progress value={mockMetrics.onTimeRate} className="mt-2" />
					</CardContent>
				</Card>
			</div>

			{/* Main Content Tabs */}
			<Tabs defaultValue="instances" className="space-y-4">
				<TabsList>
					<TabsTrigger value="instances">Workflow Instances</TabsTrigger>
					<TabsTrigger value="tasks">My Tasks</TabsTrigger>
					<TabsTrigger value="templates">Templates</TabsTrigger>
				</TabsList>

				{/* Workflow Instances Tab */}
				<TabsContent value="instances" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Active Workflows</CardTitle>
									<CardDescription>
										Monitor and manage running workflow instances
									</CardDescription>
								</div>
								<div className="flex gap-2">
									<Select
										value={selectedEmployeeType}
										onValueChange={setSelectedEmployeeType}
									>
										<SelectTrigger className="w-[180px]">
											<SelectValue placeholder="Employee Type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Types</SelectItem>
											<SelectItem value="guard">Security Guard</SelectItem>
											<SelectItem value="non-guard">Non-Guard</SelectItem>
											<SelectItem value="contractual">Contractual</SelectItem>
											<SelectItem value="part-time">Part-Time</SelectItem>
										</SelectContent>
									</Select>

									<Select
										value={selectedStatus}
										onValueChange={setSelectedStatus}
									>
										<SelectTrigger className="w-[150px]">
											<SelectValue placeholder="Status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Status</SelectItem>
											<SelectItem value="pending">Pending</SelectItem>
											<SelectItem value="in-progress">In Progress</SelectItem>
											<SelectItem value="completed">Completed</SelectItem>
											<SelectItem value="failed">Failed</SelectItem>
										</SelectContent>
									</Select>

									<Button>
										<Icon name="plus" className="mr-2 h-4 w-4" />
										New Workflow
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Workflow</TableHead>
										<TableHead>Employee</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Progress</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Started</TableHead>
										<TableHead>Due Date</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{mockInstances.map((instance) => (
										<TableRow key={instance.id}>
											<TableCell className="font-medium">
												{instance.workflowName}
											</TableCell>
											<TableCell>{instance.employeeName}</TableCell>
											<TableCell>{instance.employeeType}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Progress
														value={
															(instance.currentStep / instance.totalSteps) * 100
														}
														className="w-[60px]"
													/>
													<span className="text-muted-foreground text-sm">
														{instance.currentStep}/{instance.totalSteps}
													</span>
												</div>
											</TableCell>
											<TableCell>{getStatusBadge(instance.status)}</TableCell>
											<TableCell>{formatDate(instance.startedAt)}</TableCell>
											<TableCell>
												{instance.dueDate ? formatDate(instance.dueDate) : '-'}
											</TableCell>
											<TableCell>
												<div className="flex gap-1">
													<Button variant="ghost" size="sm">
														<Icon name="eye" className="h-4 w-4" />
													</Button>
													<Button variant="ghost" size="sm">
														<Icon name="pencil-1" className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tasks Tab */}
				<TabsContent value="tasks" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>My Tasks</CardTitle>
									<CardDescription>
										Tasks assigned to you across all workflows
									</CardDescription>
								</div>
								<Button variant="outline">
									<Icon name="download" className="mr-2 h-4 w-4" />
									Export
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Task</TableHead>
										<TableHead>Assigned To</TableHead>
										<TableHead>Priority</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Due Date</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{mockTasks.map((task) => (
										<TableRow key={task.id}>
											<TableCell className="font-medium">
												{task.taskName}
											</TableCell>
											<TableCell>{task.assignedTo}</TableCell>
											<TableCell>{getPriorityBadge(task.priority)}</TableCell>
											<TableCell>{getStatusBadge(task.status)}</TableCell>
											<TableCell>
												{task.dueDate ? formatDate(task.dueDate) : '-'}
											</TableCell>
											<TableCell>
												<div className="flex gap-1">
													<Button variant="ghost" size="sm">
														<Icon name="check" className="h-4 w-4" />
													</Button>
													<Button variant="ghost" size="sm">
														<Icon name="x" className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Templates Tab */}
				<TabsContent value="templates" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Workflow Templates</CardTitle>
									<CardDescription>
										Manage and configure workflow templates
									</CardDescription>
								</div>
								<Button>
									<Icon name="plus" className="mr-2 h-4 w-4" />
									Create Template
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{/* Template Cards */}
								<Card className="cursor-pointer transition-shadow hover:shadow-lg">
									<CardHeader>
										<CardTitle className="text-base">
											Guard Onboarding
										</CardTitle>
										<CardDescription>
											Complete onboarding process for security guards
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-2 text-sm">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Steps:</span>
												<span className="font-medium">8</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">
													Avg. Duration:
												</span>
												<span className="font-medium">3 days</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Used:</span>
												<span className="font-medium">45 times</span>
											</div>
										</div>
										<div className="mt-4 flex gap-2">
											<Button size="sm" className="flex-1">
												Edit
											</Button>
											<Button size="sm" variant="outline" className="flex-1">
												Clone
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card className="cursor-pointer transition-shadow hover:shadow-lg">
									<CardHeader>
										<CardTitle className="text-base">Leave Request</CardTitle>
										<CardDescription>
											Standard leave request approval workflow
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-2 text-sm">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Steps:</span>
												<span className="font-medium">4</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">
													Avg. Duration:
												</span>
												<span className="font-medium">1 day</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Used:</span>
												<span className="font-medium">156 times</span>
											</div>
										</div>
										<div className="mt-4 flex gap-2">
											<Button size="sm" className="flex-1">
												Edit
											</Button>
											<Button size="sm" variant="outline" className="flex-1">
												Clone
											</Button>
										</div>
									</CardContent>
								</Card>

								<Card className="cursor-pointer transition-shadow hover:shadow-lg">
									<CardHeader>
										<CardTitle className="text-base">
											Performance Review
										</CardTitle>
										<CardDescription>
											Quarterly performance evaluation process
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-2 text-sm">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Steps:</span>
												<span className="font-medium">5</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">
													Avg. Duration:
												</span>
												<span className="font-medium">5 days</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Used:</span>
												<span className="font-medium">89 times</span>
											</div>
										</div>
										<div className="mt-4 flex gap-2">
											<Button size="sm" className="flex-1">
												Edit
											</Button>
											<Button size="sm" variant="outline" className="flex-1">
												Clone
											</Button>
										</div>
									</CardContent>
								</Card>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
