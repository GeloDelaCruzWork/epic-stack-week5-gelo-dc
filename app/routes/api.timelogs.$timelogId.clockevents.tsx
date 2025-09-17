import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/api.timelogs.$timelogId.clockevents.ts'

export async function loader({ request, params }: Route.LoaderArgs) {
	await requireUserId(request)

	const { timelogId } = params

	if (!timelogId) {
		return new Response(JSON.stringify({ error: 'Timelog ID is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	// Get only the most recent clock event for this timelog
	// In practice, there should only be one clock event per timelog
	const clockEvent = await prisma.clockEvent.findFirst({
		where: {
			timelogId: timelogId,
		},
		orderBy: {
			createdAt: 'desc', // Get the most recent one if multiple exist
		},
	})

	// Return as an array for consistency with the grid expectation
	return { clockEvents: clockEvent ? [clockEvent] : [] }
}
