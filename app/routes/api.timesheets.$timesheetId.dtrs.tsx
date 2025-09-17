import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/api.timesheets.$timesheetId.dtrs.ts'

export async function loader({ request, params }: Route.LoaderArgs) {
	await requireUserId(request)

	const { timesheetId } = params

	if (!timesheetId) {
		return new Response(JSON.stringify({ error: 'Timesheet ID is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	const dtrs = await prisma.dTR.findMany({
		where: {
			timesheetId: timesheetId,
		},
		orderBy: {
			date: 'asc',
		},
	})

	return { dtrs }
}
