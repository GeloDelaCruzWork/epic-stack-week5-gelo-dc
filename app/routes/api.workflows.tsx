import {
	data,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from 'react-router'
import { z } from 'zod'
import { prisma } from '#app/utils/db.server'
import { requireUserId } from '#app/utils/auth.server'

// Schema definitions for workflow operations
const WorkflowInstanceSchema = z.object({
	workflowId: z.string(),
	employeeId: z.string(),
	data: z.record(z.any()).optional(),
	dueDate: z.string().datetime().optional(),
})

const WorkflowTaskUpdateSchema = z.object({
	taskId: z.string(),
	status: z.enum([
		'PENDING',
		'ASSIGNED',
		'IN_PROGRESS',
		'COMPLETED',
		'REJECTED',
		'CANCELLED',
		'ESCALATED',
	]),
	comments: z.string().optional(),
	data: z.record(z.any()).optional(),
})

const WorkflowFilterSchema = z.object({
	employeeType: z.string().optional(),
	status: z.string().optional(),
	assignedTo: z.string().optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
})

// GET /api/workflows - List workflows with filters
export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const url = new URL(request.url)
	const searchParams = Object.fromEntries(url.searchParams)

	// Parse and validate filters
	const filters = WorkflowFilterSchema.parse(searchParams)

	// Build query conditions
	const where: any = {}

	if (filters.employeeType) {
		where.employeeType = { code: filters.employeeType }
	}

	if (filters.status) {
		where.status = filters.status
	}

	if (filters.startDate || filters.endDate) {
		where.createdAt = {}
		if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
		if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
	}

	// Fetch workflow instances
	const instances = await prisma.workflowInstance.findMany({
		where,
		include: {
			workflow: {
				include: {
					template: true,
					employeeType: true,
				},
			},
			employee: true,
			tasks: {
				where: filters.assignedTo
					? { assignedTo: filters.assignedTo }
					: undefined,
				orderBy: { createdAt: 'desc' },
			},
		},
		orderBy: { createdAt: 'desc' },
		take: 100, // Limit results
	})

	// Get workflow metrics
	const metrics = await getWorkflowMetrics(userId)

	return data({ instances, metrics })
}

// POST /api/workflows - Create new workflow instance or update task
export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	switch (intent) {
		case 'create-instance': {
			const data = Object.fromEntries(formData)
			const validatedData = WorkflowInstanceSchema.parse(data)

			// Verify workflow exists and is active
			const workflow = await prisma.workflow.findUnique({
				where: { id: validatedData.workflowId },
				include: {
					template: {
						include: {
							steps: {
								orderBy: { stepNumber: 'asc' },
							},
						},
					},
				},
			})

			if (!workflow) {
				return data({ error: 'Workflow not found' }, { status: 404 })
			}
			if (workflow.status !== 'ACTIVE') {
				return data({ error: 'Workflow is not active' }, { status: 400 })
			}

			// Create workflow instance
			const instance = await prisma.workflowInstance.create({
				data: {
					workflowId: validatedData.workflowId,
					employeeId: validatedData.employeeId,
					status: 'PENDING',
					currentStep: 1,
					data: validatedData.data || {},
					dueDate: validatedData.dueDate
						? new Date(validatedData.dueDate)
						: undefined,
				},
				include: {
					workflow: true,
					employee: true,
				},
			})

			// Create initial tasks based on workflow template
			if (workflow.template.steps.length > 0) {
				const firstStep = workflow.template.steps[0]
				await prisma.workflowTask.create({
					data: {
						instanceId: instance.id,
						stepNumber: firstStep.stepNumber,
						taskName: firstStep.name,
						assignedTo: firstStep.assigneeRole,
						status: 'PENDING',
						priority: 'MEDIUM',
						data: {},
						dueDate: calculateTaskDueDate(firstStep.slaHours),
					},
				})
			}

			// Log workflow creation
			await prisma.workflowHistory.create({
				data: {
					instanceId: instance.id,
					action: 'WORKFLOW_STARTED',
					performedBy: userId,
					toStatus: 'PENDING',
					stepNumber: 1,
					comments: `Workflow initiated for ${instance.employee.firstName} ${instance.employee.lastName}`,
				},
			})

			return data({ success: true, instance })
		}

		case 'update-task': {
			const data = Object.fromEntries(formData)
			const validatedData = WorkflowTaskUpdateSchema.parse(data)

			// Get current task
			const task = await prisma.workflowTask.findUnique({
				where: { id: validatedData.taskId },
				include: {
					instance: {
						include: {
							workflow: {
								include: {
									template: {
										include: {
											steps: {
												orderBy: { stepNumber: 'asc' },
											},
										},
									},
								},
							},
						},
					},
				},
			})

			if (!task) {
				return data({ error: 'Task not found' }, { status: 404 })
			}

			const previousStatus = task.status

			// Update task
			const updatedTask = await prisma.workflowTask.update({
				where: { id: validatedData.taskId },
				data: {
					status: validatedData.status,
					comments: validatedData.comments,
					data: validatedData.data || task.data,
					completedAt:
						validatedData.status === 'COMPLETED' ? new Date() : undefined,
					startedAt:
						task.startedAt ||
						(validatedData.status === 'IN_PROGRESS' ? new Date() : undefined),
				},
			})

			// Log task update
			await prisma.workflowHistory.create({
				data: {
					instanceId: task.instanceId,
					action: `TASK_${validatedData.status}`,
					performedBy: userId,
					fromStatus: previousStatus,
					toStatus: validatedData.status,
					stepNumber: task.stepNumber,
					comments: validatedData.comments,
				},
			})

			// If task is completed, check for next steps
			if (validatedData.status === 'COMPLETED') {
				await processNextStep(task.instanceId, task.stepNumber, userId)
			}

			return data({ success: true, task: updatedTask })
		}

		case 'cancel-instance': {
			const instanceId = formData.get('instanceId') as string
			const reason = formData.get('reason') as string

			const instance = await prisma.workflowInstance.update({
				where: { id: instanceId },
				data: {
					status: 'CANCELLED',
					completedAt: new Date(),
				},
			})

			// Cancel all pending tasks
			await prisma.workflowTask.updateMany({
				where: {
					instanceId,
					status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
				},
				data: {
					status: 'CANCELLED',
					completedAt: new Date(),
				},
			})

			// Log cancellation
			await prisma.workflowHistory.create({
				data: {
					instanceId,
					action: 'WORKFLOW_CANCELLED',
					performedBy: userId,
					fromStatus: instance.status,
					toStatus: 'CANCELLED',
					comments: reason,
				},
			})

			return data({ success: true })
		}

		default:
			return data({ error: 'Invalid intent' }, { status: 400 })
	}
}

// Helper function to calculate task due date based on SLA
function calculateTaskDueDate(slaHours?: number | null): Date | undefined {
	if (!slaHours) return undefined

	const dueDate = new Date()
	dueDate.setHours(dueDate.getHours() + slaHours)

	// Skip weekends
	const dayOfWeek = dueDate.getDay()
	if (dayOfWeek === 0) {
		// Sunday
		dueDate.setDate(dueDate.getDate() + 1)
	} else if (dayOfWeek === 6) {
		// Saturday
		dueDate.setDate(dueDate.getDate() + 2)
	}

	return dueDate
}

// Helper function to process next workflow step
async function processNextStep(
	instanceId: string,
	currentStepNumber: number,
	userId: string,
) {
	const instance = await prisma.workflowInstance.findUnique({
		where: { id: instanceId },
		include: {
			workflow: {
				include: {
					template: {
						include: {
							steps: {
								orderBy: { stepNumber: 'asc' },
							},
						},
					},
				},
			},
		},
	})

	if (!instance) return

	const steps = instance.workflow.template.steps
	const currentStepIndex = steps.findIndex(
		(s) => s.stepNumber === currentStepNumber,
	)

	if (currentStepIndex === -1 || currentStepIndex === steps.length - 1) {
		// No more steps, complete workflow
		await prisma.workflowInstance.update({
			where: { id: instanceId },
			data: {
				status: 'COMPLETED',
				completedAt: new Date(),
			},
		})

		await prisma.workflowHistory.create({
			data: {
				instanceId,
				action: 'WORKFLOW_COMPLETED',
				performedBy: userId,
				toStatus: 'COMPLETED',
				comments: 'All steps completed successfully',
			},
		})
	} else {
		// Create next task
		const nextStep = steps[currentStepIndex + 1]

		await prisma.workflowTask.create({
			data: {
				instanceId,
				stepNumber: nextStep.stepNumber,
				taskName: nextStep.name,
				assignedTo: nextStep.assigneeRole,
				status: 'PENDING',
				priority: 'MEDIUM',
				data: {},
				dueDate: calculateTaskDueDate(nextStep.slaHours),
			},
		})

		// Update instance current step
		await prisma.workflowInstance.update({
			where: { id: instanceId },
			data: {
				currentStep: nextStep.stepNumber,
				status: 'IN_PROGRESS',
			},
		})

		await prisma.workflowHistory.create({
			data: {
				instanceId,
				action: 'STEP_ADVANCED',
				performedBy: userId,
				stepNumber: nextStep.stepNumber,
				comments: `Advanced to step: ${nextStep.name}`,
			},
		})
	}
}

// Helper function to get workflow metrics
async function getWorkflowMetrics(userId: string) {
	const [totalActive, completed, pending, overdue] = await Promise.all([
		prisma.workflowInstance.count({
			where: { status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING'] } },
		}),
		prisma.workflowInstance.count({
			where: {
				status: 'COMPLETED',
				completedAt: {
					gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
				},
			},
		}),
		prisma.workflowTask.count({
			where: { status: 'PENDING' },
		}),
		prisma.workflowTask.count({
			where: {
				status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
				dueDate: { lt: new Date() },
			},
		}),
	])

	// Calculate average completion time (simplified)
	const recentCompleted = await prisma.workflowInstance.findMany({
		where: {
			status: 'COMPLETED',
			completedAt: { not: null },
		},
		select: {
			startedAt: true,
			completedAt: true,
		},
		take: 100,
	})

	const completionTimes = recentCompleted
		.filter((i) => i.completedAt)
		.map((i) => {
			const start = new Date(i.startedAt).getTime()
			const end = new Date(i.completedAt!).getTime()
			return (end - start) / (1000 * 60 * 60 * 24) // Convert to days
		})

	const averageCompletionTime =
		completionTimes.length > 0
			? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
			: 0

	// Calculate on-time rate
	const totalCompletedWithDue = await prisma.workflowInstance.count({
		where: {
			status: 'COMPLETED',
			dueDate: { not: null },
		},
	})

	const completedOnTime = await prisma.workflowInstance.count({
		where: {
			status: 'COMPLETED',
			dueDate: { not: null },
			completedAt: { not: null },
		},
	})

	const onTimeRate =
		totalCompletedWithDue > 0
			? Math.round((completedOnTime / totalCompletedWithDue) * 100)
			: 100

	return {
		totalActive,
		completed,
		pending,
		overdue,
		averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
		onTimeRate,
	}
}
