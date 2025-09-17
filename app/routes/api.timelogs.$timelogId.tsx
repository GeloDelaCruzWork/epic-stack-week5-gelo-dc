import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/api.timelogs.$timelogId.ts'

export async function loader({ request, params }: Route.LoaderArgs) {
	await requireUserId(request)

	const { timelogId } = params

	if (!timelogId) {
		return new Response(JSON.stringify({ error: 'TimeLog ID is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	const timelog = await prisma.timelog.findUnique({
		where: { id: timelogId },
	})

	if (!timelog) {
		return new Response(JSON.stringify({ error: 'TimeLog not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	return { timelog }
}

export async function action({ request, params }: Route.ActionArgs) {
	await requireUserId(request)

	const { timelogId } = params

	if (!timelogId) {
		return new Response(JSON.stringify({ error: 'TimeLog ID is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	if (request.method === 'PUT') {
		const data = (await request.json()) as {
			mode: 'in' | 'out'
			timestamp: string
		}

		try {
			// Update the timelog
			const updatedTimeLog = await prisma.timelog.update({
				where: { id: timelogId },
				data: {
					mode: data.mode,
					timestamp: new Date(data.timestamp),
				},
			})

			// Get the parent DTR to recalculate hours based on updated timelogs
			const dtr = await prisma.dTR.findUnique({
				where: { id: updatedTimeLog.dtrId },
				include: {
					timelogs: {
						orderBy: { timestamp: 'asc' },
					},
				},
			})

			if (dtr && dtr.timelogs.length >= 2) {
				// Find time-in and time-out pairs
				const timeIn = dtr.timelogs.find((log) => log.mode === 'in')
				const timeOut = dtr.timelogs.find((log) => log.mode === 'out')

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
						where: { id: dtr.id },
						data: {
							regularHours,
							overtimeHours,
							nightDifferential,
						},
					})

					// Update parent timesheet totals
					const allDTRs = await prisma.dTR.findMany({
						where: { timesheetId: dtr.timesheetId },
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
						where: { id: dtr.timesheetId },
						data: totals,
					})
				}
			}

			// Also update the associated clock event if it exists
			const clockEvent = await prisma.clockEvent.findFirst({
				where: { timelogId: timelogId },
			})

			if (clockEvent) {
				await prisma.clockEvent.update({
					where: { id: clockEvent.id },
					data: {
						clockTime: new Date(data.timestamp),
					},
				})
			}

			// Get the updated DTR with new totals
			const updatedDTR = await prisma.dTR.findUnique({
				where: { id: updatedTimeLog.dtrId },
			})

			// Get the updated timesheet with new totals
			const updatedTimesheet = await prisma.timesheet.findUnique({
				where: { id: dtr!.timesheetId },
			})

			return new Response(
				JSON.stringify({
					timelog: updatedTimeLog,
					dtr: updatedDTR,
					timesheet: updatedTimesheet,
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		} catch (error) {
			console.error('Failed to update timelog:', error)
			return new Response(
				JSON.stringify({ error: 'Failed to update timelog' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}
	}

	if (request.method === 'DELETE') {
		try {
			// Get the timelog with its DTR and timesheet before deletion
			const timelog = await prisma.timelog.findUnique({
				where: { id: timelogId },
				include: {
					dtr: {
						include: {
							timesheet: true,
							timelogs: true,
						},
					},
				},
			})

			if (!timelog) {
				return new Response('Timelog not found', { status: 404 })
			}

			// Delete timelog (cascade will delete ClockEvents)
			await prisma.timelog.delete({
				where: { id: timelogId },
			})

			// For now, we're not recalculating hours from timelogs
			// This would be done by your time calculation service
			// Just return the current DTR and timesheet

			return new Response(
				JSON.stringify({
					success: true,
					dtr: timelog.dtr,
					timesheet: timelog.dtr.timesheet,
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		} catch (error) {
			console.error('Failed to delete timelog:', error)
			return new Response(
				JSON.stringify({ error: 'Failed to delete timelog' }),
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
