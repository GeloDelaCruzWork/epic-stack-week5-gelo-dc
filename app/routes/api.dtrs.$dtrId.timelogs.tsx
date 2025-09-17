import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/api.dtrs.$dtrId.timelogs.ts'

export async function loader({ request, params }: Route.LoaderArgs) {
	await requireUserId(request)

	const { dtrId } = params

	if (!dtrId) {
		return new Response(JSON.stringify({ error: 'DTR ID is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	// Return all timelogs for this DTR (typically Time IN and Time OUT)
	const timelogs = await prisma.timelog.findMany({
		where: {
			dtrId: dtrId,
		},
		orderBy: {
			timestamp: 'asc', // Show in chronological order
		},
	})

	return { timelogs }
}
