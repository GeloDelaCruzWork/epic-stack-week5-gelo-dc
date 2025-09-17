import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/api.clockevents.$clockEventId.ts'

export async function loader({ request, params }: Route.LoaderArgs) {
	await requireUserId(request)

	const { clockEventId } = params

	if (!clockEventId) {
		return new Response(
			JSON.stringify({ error: 'ClockEvent ID is required' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}

	const clockEvent = await prisma.clockEvent.findUnique({
		where: { id: clockEventId },
	})

	if (!clockEvent) {
		return new Response(JSON.stringify({ error: 'ClockEvent not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	return { clockEvent }
}

export async function action({ request, params }: Route.ActionArgs) {
	await requireUserId(request)

	const { clockEventId } = params

	if (!clockEventId) {
		return new Response(
			JSON.stringify({ error: 'ClockEvent ID is required' }),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}

	if (request.method === 'PUT') {
		const data = (await request.json()) as {
			clockTime: string
		}

		try {
			// Update the clock event
			const updatedClockEvent = await prisma.clockEvent.update({
				where: { id: clockEventId },
				data: {
					clockTime: new Date(data.clockTime),
				},
			})

			// Also update the parent timelog's timestamp to match
			// This keeps the timelog and clock event in sync
			const timelog = await prisma.timelog.update({
				where: { id: updatedClockEvent.timelogId },
				data: {
					timestamp: new Date(data.clockTime),
				},
				include: {
					dtr: true,
				},
			})

			// Get all timelogs for the parent DTR to recalculate hours
			const dtrTimelogs = await prisma.timelog.findMany({
				where: { dtrId: timelog.dtrId },
				orderBy: { timestamp: 'asc' },
			})

			if (dtrTimelogs.length >= 2) {
				// Find time-in and time-out pairs
				const timeIn = dtrTimelogs.find((log) => log.mode === 'in')
				const timeOut = dtrTimelogs.find((log) => log.mode === 'out')

				if (timeIn && timeOut) {
					// Calculate hours worked
					const start = new Date(timeIn.timestamp)
					const end = new Date(timeOut.timestamp)
					const hoursWorked =
						(end.getTime() - start.getTime()) / (1000 * 60 * 60)

					// Simple calculation - you may want to adjust based on business rules
					const regularHours = Math.min(hoursWorked, 8)
					const overtimeHours = Math.max(0, hoursWorked - 8)

					// Calculate night differential (hours worked between 10 PM and 6 AM)
					let nightDifferential = 0
					const nightStart = 22 // 10 PM
					const nightEnd = 6 // 6 AM

					if (
						start.getHours() >= nightStart ||
						start.getHours() < nightEnd ||
						end.getHours() >= nightStart ||
						end.getHours() < nightEnd
					) {
						// Simplified calculation - you may want more precise logic
						nightDifferential = hoursWorked * 0.1 // 10% of hours as night diff
					}

					// Update DTR with recalculated hours
					await prisma.dTR.update({
						where: { id: timelog.dtrId },
						data: {
							regularHours,
							overtimeHours,
							nightDifferential,
						},
					})

					// Update parent timesheet totals
					const allDTRs = await prisma.dTR.findMany({
						where: { timesheetId: timelog.dtr.timesheetId },
					})

					const totals = allDTRs.reduce(
						(acc, d) => ({
							regularHours: acc.regularHours + d.regularHours,
							overtimeHours: acc.overtimeHours + d.overtimeHours,
							nightDifferential: acc.nightDifferential + d.nightDifferential,
						}),
						{ regularHours: 0, overtimeHours: 0, nightDifferential: 0 },
					)

					await prisma.timesheet.update({
						where: { id: timelog.dtr.timesheetId },
						data: totals,
					})
				}
			}

			// Get the updated DTR and timesheet for returning to the client
			const updatedDTR = await prisma.dTR.findUnique({
				where: { id: timelog.dtrId },
			})

			const updatedTimesheet = await prisma.timesheet.findUnique({
				where: { id: timelog.dtr.timesheetId },
			})

			return new Response(
				JSON.stringify({
					clockEvent: updatedClockEvent,
					timelog,
					dtr: updatedDTR,
					timesheet: updatedTimesheet,
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		} catch (error) {
			console.error('Failed to update clock event:', error)
			return new Response(
				JSON.stringify({ error: 'Failed to update clock event' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}
	}

	if (request.method === 'DELETE') {
		try {
			// Get the clock event with its parent hierarchy before deletion
			const clockEvent = await prisma.clockEvent.findUnique({
				where: { id: clockEventId },
				include: {
					timelog: {
						include: {
							dtr: {
								include: {
									timesheet: true,
								},
							},
							clockEvents: true,
						},
					},
				},
			})

			if (!clockEvent) {
				return new Response('Clock event not found', { status: 404 })
			}

			// Delete clock event (removing the restriction on last clock event)
			await prisma.clockEvent.delete({
				where: { id: clockEventId },
			})

			// Return parent data for potential UI updates
			return new Response(
				JSON.stringify({
					success: true,
					timelog: clockEvent.timelog,
					dtr: clockEvent.timelog.dtr,
					timesheet: clockEvent.timelog.dtr.timesheet,
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		} catch (error) {
			console.error('Failed to delete clock event:', error)
			return new Response(
				JSON.stringify({ error: 'Failed to delete clock event' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}
	}

	return new Response(JSON.stringify({ error: 'Method not allowed' }), {
		status: 405,
		headers: { 'Content-Type': 'application/json' },
	})
}
