import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/api.timesheets.$timesheetId.ts'

export async function action({ request, params }: Route.ActionArgs) {
	await requireUserId(request)

	const { timesheetId } = params

	if (!timesheetId) {
		return new Response(JSON.stringify({ error: 'Timesheet ID is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	if (request.method === 'PUT') {
		const data = (await request.json()) as {
			employeeName: string
			payPeriod: string
			detachment: string
			shift: string
			regularHours: string | number
			overtimeHours: string | number
			nightDifferential: string | number
		}

		try {
			const updatedTimesheet = await prisma.timesheet.update({
				where: { id: timesheetId },
				data: {
					employeeName: data.employeeName,
					payPeriod: data.payPeriod,
					detachment: data.detachment,
					shift: data.shift,
					regularHours: parseFloat(String(data.regularHours)),
					overtimeHours: parseFloat(String(data.overtimeHours)),
					nightDifferential: parseFloat(String(data.nightDifferential)),
				},
			})

			return new Response(JSON.stringify({ timesheet: updatedTimesheet }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
		} catch (error) {
			console.error('Failed to update timesheet:', error)
			return new Response(
				JSON.stringify({ error: 'Failed to update timesheet' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}
	}

	if (request.method === 'DELETE') {
		try {
			// Delete timesheet (cascade will delete DTRs, Timelogs, and ClockEvents)
			await prisma.timesheet.delete({
				where: { id: timesheetId },
			})

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
		} catch (error) {
			console.error('Failed to delete timesheet:', error)
			return new Response(
				JSON.stringify({ error: 'Failed to delete timesheet' }),
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
