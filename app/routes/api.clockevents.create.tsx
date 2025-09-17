import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/api.clockevents.create.ts'

export async function action({ request }: Route.ActionArgs) {
	await requireUserId(request)

	const data = await request.json()

	if (!data.timelogId) {
		return Response.json({ error: 'timelogId is required' }, { status: 400 })
	}

	const clockEvent = await prisma.clockEvent.create({
		data: {
			timelogId: data.timelogId,
			clockTime: new Date(data.clockTime || new Date()),
		},
		include: {
			timelog: {
				include: {
					dtr: {
						include: {
							timesheet: true,
						},
					},
				},
			},
		},
	})

	// Return all levels for potential updates
	return Response.json({
		clockEvent,
		timelog: clockEvent.timelog,
		dtr: clockEvent.timelog.dtr,
		timesheet: clockEvent.timelog.dtr.timesheet,
	})
}
