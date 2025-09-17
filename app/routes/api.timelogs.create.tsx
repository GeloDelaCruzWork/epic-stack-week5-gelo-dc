import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/api.timelogs.create.ts'

export async function action({ request }: Route.ActionArgs) {
	await requireUserId(request)

	const data = await request.json()

	if (!data.dtrId) {
		return Response.json({ error: 'dtrId is required' }, { status: 400 })
	}

	const timelog = await prisma.timelog.create({
		data: {
			dtrId: data.dtrId,
			mode: data.mode || 'in',
			timestamp: new Date(data.timestamp || new Date()),
		},
		include: {
			dtr: {
				include: {
					timesheet: true,
				},
			},
		},
	})

	// Return timelog, DTR and timesheet for updates
	return Response.json({
		timelog,
		dtr: timelog.dtr,
		timesheet: timelog.dtr.timesheet,
	})
}
