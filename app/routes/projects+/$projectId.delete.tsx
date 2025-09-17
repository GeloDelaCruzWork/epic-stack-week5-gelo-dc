import { invariantResponse } from '@epic-web/invariant'
import { redirect } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { type Route } from './+types/$projectId.delete.ts'

export async function action({ request, params }: Route.ActionArgs) {
	await requireUserId(request)
	const { projectId } = params

	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { id: true, name: true },
	})

	invariantResponse(project, 'Project not found', { status: 404 })

	await prisma.project.delete({
		where: { id: projectId },
	})

	return redirectWithToast('/projects', {
		type: 'success',
		title: 'Project deleted',
		description: `"${project.name}" has been deleted successfully.`,
	})
}

// This route only handles POST requests, no UI component needed
export async function loader() {
	return redirect('/projects')
}
