import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { data, Form, Link, useNavigation } from 'react-router'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { type Route } from './+types/$projectId.edit.ts'

const ProjectEditSchema = z.object({
	name: z
		.string()
		.min(1, 'Name is required')
		.max(100, 'Name must be 100 characters or less')
		.trim(),
	description: z
		.string()
		.max(500, 'Description must be 500 characters or less')
		.trim()
		.optional(),
})

export async function loader({ request, params }: Route.LoaderArgs) {
	await requireUserId(request)
	const { projectId } = params

	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: {
			id: true,
			name: true,
			description: true,
		},
	})

	invariantResponse(project, 'Project not found', { status: 404 })

	return { project }
}

export async function action({ request, params }: Route.ActionArgs) {
	await requireUserId(request)
	const { projectId } = params

	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { id: true },
	})

	invariantResponse(project, 'Project not found', { status: 404 })

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: ProjectEditSchema,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { name, description } = submission.value

	await prisma.project.update({
		where: { id: projectId },
		data: {
			name,
			description,
		},
	})

	return redirectWithToast('/projects', {
		type: 'success',
		title: 'Project updated',
		description: `"${name}" has been updated successfully.`,
	})
}

export default function EditProject({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { project } = loaderData
	const navigation = useNavigation()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'edit-project-form',
		constraint: getZodConstraint(ProjectEditSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ProjectEditSchema })
		},
		defaultValue: {
			name: project.name,
			description: project.description || '',
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container mx-auto max-w-2xl py-8">
			<div className="mb-8">
				<div className="text-muted-foreground mb-4 flex items-center gap-2 text-sm">
					<Link to="/projects" className="hover:text-foreground">
						Projects
					</Link>
					<Icon name="arrow-right" className="h-4 w-4" />
					<span>Edit Project</span>
				</div>
				<h1 className="text-h1">Edit Project</h1>
				<p className="text-muted-foreground mt-1">
					Update your project details
				</p>
			</div>

			<div className="bg-card rounded-lg border p-6">
				<Form method="POST" {...getFormProps(form)}>
					<div className="space-y-4">
						<Field
							labelProps={{ children: 'Project Name' }}
							inputProps={{
								...getInputProps(fields.name, { type: 'text' }),
								placeholder: 'Enter project name',
								autoFocus: true,
							}}
							errors={fields.name.errors}
						/>
						<Field
							labelProps={{ children: 'Description (optional)' }}
							inputProps={{
								...getInputProps(fields.description, { type: 'text' }),
								placeholder: 'Enter project description',
							}}
							errors={fields.description.errors}
						/>
					</div>

					<ErrorList errors={form.errors} id={form.errorId} />

					<div className="mt-6 flex justify-end gap-4">
						<Button variant="outline" asChild>
							<Link to="/projects">Cancel</Link>
						</Button>
						<StatusButton
							type="submit"
							status={isPending ? 'pending' : (form.status ?? 'idle')}
							disabled={isPending}
						>
							{isPending ? (
								<>
									<Icon name="update" className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Icon name="check" className="mr-2 h-4 w-4" />
									Save Changes
								</>
							)}
						</StatusButton>
					</div>
				</Form>
			</div>

			{/* Additional Actions */}
			<div className="border-destructive/20 bg-destructive/5 mt-8 rounded-lg border p-6">
				<h2 className="text-h4 text-destructive mb-2">Danger Zone</h2>
				<p className="text-muted-foreground mb-4 text-sm">
					Once you delete a project, there is no going back. Please be certain.
				</p>
				<Form method="POST" action={`/projects/${project.id}/delete`}>
					<Button
						type="submit"
						variant="destructive"
						disabled={navigation.state !== 'idle'}
					>
						<Icon name="trash" className="mr-2 h-4 w-4" />
						Delete Project
					</Button>
				</Form>
			</div>
		</div>
	)
}

export const meta: Route.MetaFunction = ({ data }) => {
	const projectName = data?.project?.name ?? 'Project'
	return [
		{ title: `Edit ${projectName} | Epic Stack` },
		{ name: 'description', content: `Edit ${projectName} details` },
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<div className="container mx-auto flex flex-col items-center justify-center py-20">
						<Icon
							name="magnifying-glass"
							className="text-muted-foreground mb-4 h-20 w-20"
						/>
						<h1 className="text-h2 mb-2">Project not found</h1>
						<p className="text-muted-foreground mb-8">
							We couldn't find a project with ID "{params.projectId}"
						</p>
						<Button asChild>
							<Link to="/projects">
								<Icon name="arrow-left" className="mr-2 h-4 w-4" />
								Back to Projects
							</Link>
						</Button>
					</div>
				),
			}}
		/>
	)
}
