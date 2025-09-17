import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/api.dtrs.$dtrId.ts'

export async function loader({ request, params }: Route.LoaderArgs) {
	await requireUserId(request)

	const { dtrId } = params

	if (!dtrId) {
		return new Response(JSON.stringify({ error: 'DTR ID is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	const dtr = await prisma.dTR.findUnique({
		where: { id: dtrId },
	})

	if (!dtr) {
		return new Response(JSON.stringify({ error: 'DTR not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	return { dtr }
}

export async function action({ request, params }: Route.ActionArgs) {
	await requireUserId(request)

	const { dtrId } = params

	if (!dtrId) {
		return new Response(JSON.stringify({ error: 'DTR ID is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	if (request.method === 'PUT') {
		const data = (await request.json()) as {
			date?: string
			regularHours: string | number
			overtimeHours: string | number
			nightDifferential: string | number
		}

		try {
			const updatedDTR = await prisma.dTR.update({
				where: { id: dtrId },
				data: {
					regularHours: parseFloat(String(data.regularHours)),
					overtimeHours: parseFloat(String(data.overtimeHours)),
					nightDifferential: parseFloat(String(data.nightDifferential)),
				},
			})

			// Also update the parent timesheet totals
			const allDTRs = await prisma.dTR.findMany({
				where: { timesheetId: updatedDTR.timesheetId },
			})

			const totals = allDTRs.reduce(
				(acc, dtr) => ({
					regularHours: acc.regularHours + dtr.regularHours,
					overtimeHours: acc.overtimeHours + dtr.overtimeHours,
					nightDifferential: acc.nightDifferential + dtr.nightDifferential,
				}),
				{ regularHours: 0, overtimeHours: 0, nightDifferential: 0 },
			)

			const updatedTimesheet = await prisma.timesheet.update({
				where: { id: updatedDTR.timesheetId },
				data: totals,
			})

			return new Response(
				JSON.stringify({
					dtr: updatedDTR,
					timesheet: updatedTimesheet,
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		} catch (error) {
			console.error('Failed to update DTR:', error)
			return new Response(JSON.stringify({ error: 'Failed to update DTR' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			})
		}
	}

	if (request.method === 'DELETE') {
		try {
			// Get the DTR with its timesheet before deletion
			const dtr = await prisma.dTR.findUnique({
				where: { id: dtrId },
				include: { timesheet: true },
			})

			if (!dtr) {
				return new Response('DTR not found', { status: 404 })
			}

			// Delete DTR (cascade will delete Timelogs and ClockEvents)
			await prisma.dTR.delete({
				where: { id: dtrId },
			})

			// Recalculate timesheet totals
			const updatedTimesheet = await prisma.timesheet.findUnique({
				where: { id: dtr.timesheetId },
				include: {
					dtrs: true,
				},
			})

			if (updatedTimesheet) {
				// Calculate new totals from remaining DTRs
				const totals = updatedTimesheet.dtrs.reduce(
					(acc, d) => ({
						regularHours: acc.regularHours + d.regularHours,
						overtimeHours: acc.overtimeHours + d.overtimeHours,
						nightDifferential: acc.nightDifferential + d.nightDifferential,
					}),
					{ regularHours: 0, overtimeHours: 0, nightDifferential: 0 },
				)

				// Update timesheet with new totals
				const timesheet = await prisma.timesheet.update({
					where: { id: dtr.timesheetId },
					data: totals,
				})

				return new Response(JSON.stringify({ success: true, timesheet }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			}

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
		} catch (error) {
			console.error('Failed to delete DTR:', error)
			return new Response(JSON.stringify({ error: 'Failed to delete DTR' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			})
		}
	}

	return new Response(JSON.stringify({ error: 'Method not allowed' }), {
		status: 405,
		headers: { 'Content-Type': 'application/json' },
	})
}
