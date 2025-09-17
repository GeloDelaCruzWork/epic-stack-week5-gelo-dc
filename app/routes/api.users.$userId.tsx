import { json } from '@remix-run/node'
import { prisma } from '#app/utils/db.server.ts'
import { requireUserId } from '#app/utils/auth.server.ts'

export async function loader({ request, params }: { request: Request; params: { userId: string } }) {
	await requireUserId(request)

	const { userId } = params

	if (!userId) {
		throw json({ message: 'User ID is required' }, { status: 400 })
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { name: true },
	})

	if (!user) {
		throw json({ message: 'User not found' }, { status: 404 })
	}

	return json({ name: user.name })
}

export async function action({ request, params }: { request: Request; params: { userId: string } }) {
	await requireUserId(request)

	const { userId } = params

	if (!userId) {
		throw json({ message: 'User ID is required' }, { status: 400 })
	}

	const formData = await request.json()
	const { name, username, email } = formData

	if (!name || !username || !email) {
		throw json({ message: 'Name, username, and email are required' }, { status: 400 })
	}

	try {
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { name, username, email },
		})
		return json({ message: 'User updated successfully', user: updatedUser })
	} catch (error) {
		console.error("Failed to update user:", error)
		throw json({ message: 'Failed to update user' }, { status: 500 })
	}
}