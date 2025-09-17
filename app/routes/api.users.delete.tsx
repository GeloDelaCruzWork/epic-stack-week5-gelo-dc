import { json } from '@remix-run/node'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'

export async function action({ request }: { request: Request }) {
	//Function: Handles the deletion of a user. It requires the user to be an admin and expects a userId in the request body.
	const currentUserId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: currentUserId },
		include: { roles: true },
	})

	const isAdmin = user?.roles.some(role => role.name === 'admin')

	if (!isAdmin) {
		return json({ error: 'Unauthorized' }, { status: 403 })
	}

	const payload = await request.json().catch(() => null)
	const userIdToDelete = payload?.userId

	if (!userIdToDelete) {
		return json({ error: 'User ID is required' }, { status: 400 })
	}

	try {
		if (userIdToDelete === currentUserId) {
			return json({ error: 'You cannot delete yourself.' }, { status: 400 })
		}
		await prisma.user.delete({ where: { id: userIdToDelete } })
		return json({ success: true })
	} catch (error) {
		return json({ error: 'Failed to delete user' }, { status: 500 })
	}
}

