import { type LoaderFunctionArgs } from 'react-router'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)

	const url = new URL(request.url)
	const query = url.searchParams.get('q')

	if (!query) {
		return new Response(JSON.stringify({ results: [] }), {
			headers: { 'Content-Type': 'application/json' },
		})
	}

	// Search in notes and users
	const [notes, users] = await Promise.all([
		prisma.note.findMany({
			where: {
				OR: [
					{ title: { contains: query, mode: 'insensitive' } },
					{ content: { contains: query, mode: 'insensitive' } },
				],
			},
			select: {
				id: true,
				title: true,
				content: true,
			},
			take: 10,
		}),
		prisma.user.findMany({
			where: {
				OR: [
					{ username: { contains: query, mode: 'insensitive' } },
					{ name: { contains: query, mode: 'insensitive' } },
				],
			},
			select: {
				id: true,
				username: true,
				name: true,
			},
			take: 10,
		}),
	])

	const results = [
		...notes.map((note) => ({
			id: note.id,
			title: note.title,
			type: 'note' as const,
			description: note.content.substring(0, 100),
		})),
		...users.map((user) => ({
			id: user.id,
			title: user.name || user.username,
			type: 'user' as const,
			description: `@${user.username}`,
		})),
	]

	// React Router v7 expects a plain object return from loaders for JSON responses
	return { results }
}
