import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/api.dtrs.create.ts'

export async function action({ request }: Route.ActionArgs) {
	await requireUserId(request)

	const data = await request.json()

	if (!data.timesheetId) {
		return Response.json({ error: 'timesheetId is required' }, { status: 400 })
	}

	const dtr = await prisma.dTR.create({
		data: {
			timesheetId: data.timesheetId,
			date: new Date(data.date || new Date()),
			regularHours: data.regularHours ?? 0,
			overtimeHours: data.overtimeHours ?? 0,
			nightDifferential: data.nightDifferential ?? 0,
		},
		include: {
			timesheet: true,
		},
	})

	// Return both DTR and updated timesheet
	return Response.json({
		dtr,
		timesheet: dtr.timesheet,
	})
}
