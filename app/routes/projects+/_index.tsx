import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
// import { invariantResponse } from '@epic-web/invariant'
import { type Project } from '@prisma/client'
import { data, Form, Link, useFetcher /*useLoaderData*/ } from 'react-router'
import { z } from 'zod'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { type Route } from './+types/_index.ts'

const ProjectSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Name is required')
		.max(100, 'Name must be 100 characters or less'),
	description: z
		.string()
		.trim()
		.max(500, 'Description must be 500 characters or less')
		.optional(),
})

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
	const projects = await prisma.project.findMany({
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			name: true,
			description: true,
			createdAt: true,
			updatedAt: true,
		},
	})
	return { projects }
}

export async function action({ request }: Route.ActionArgs) {
	await requireUserId(request)
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: ProjectSchema,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { name, description } = submission.value

	await prisma.project.create({
		data: {
			name,
			description,
		},
	})

	return data({ result: submission.reply({ resetForm: true }) })
}

export default function ProjectsIndex({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { projects } = loaderData
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'project-form',
		constraint: getZodConstraint(ProjectSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ProjectSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container mx-auto py-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-h1">Projects</h1>
					<p className="text-muted-foreground mt-1">
						Manage your projects here
					</p>
				</div>
			</div>

			{/* Create Project Form */}
			<div className="bg-muted/40 mb-8 rounded-lg border p-6">
				<h2 className="text-h3 mb-4">Create New Project</h2>
				<Form method="POST" {...getFormProps(form)}>
					<div className="space-y-4">
						<Field
							labelProps={{ children: 'Project Name' }}
							inputProps={{
								...getInputProps(fields.name, { type: 'text' }),
								placeholder: 'Enter project name',
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
						<div className="flex justify-end">
							<StatusButton
								type="submit"
								status={isPending ? 'pending' : (form.status ?? 'idle')}
								disabled={isPending}
								className="min-w-[120px]"
							>
								<Icon name="plus" className="mr-2 h-4 w-4" />
								Create Project
							</StatusButton>
						</div>
					</div>
					<ErrorList errors={form.errors} id={form.errorId} />
				</Form>
			</div>

			{/* Projects List */}
			<div className="space-y-4">
				<h2 className="text-h3 mb-4">Your Projects</h2>
				{projects.length === 0 ? (
					<div className="bg-muted/40 rounded-lg border border-dashed p-12 text-center">
						<Icon
							name="file-text"
							className="text-muted-foreground mx-auto mb-4 h-12 w-12"
						/>
						<p className="text-lg font-medium">No projects yet</p>
						<p className="text-muted-foreground mt-1">
							Create your first project to get started
						</p>
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{projects.map((project) => (
							<ProjectCard key={project.id} project={project} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}

function ProjectCard({
	project,
}: {
	project: Pick<
		Project,
		'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'
	>
}) {
	const fetcher = useFetcher()
	const isDeleting = fetcher.state !== 'idle'

	return (
		<div className="group bg-card relative rounded-lg border p-6 transition-all hover:shadow-md">
			<div className="mb-4 flex items-start justify-between">
				<div className="flex-1">
					<h3 className="text-lg font-semibold">{project.name}</h3>
					{project.description && (
						<p className="text-muted-foreground mt-1 text-sm">
							{project.description}
						</p>
					)}
				</div>
				<div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
					<Button size="sm" variant="ghost" asChild>
						<Link to={`/projects/${project.id}/edit`}>
							<Icon name="pencil-1" className="h-4 w-4" />
							<span className="sr-only">Edit project</span>
						</Link>
					</Button>
					<fetcher.Form method="POST" action={`/projects/${project.id}/delete`}>
						<Button
							size="sm"
							variant="ghost"
							type="submit"
							disabled={isDeleting}
						>
							{isDeleting ? (
								<Icon name="update" className="h-4 w-4 animate-spin" />
							) : (
								<Icon name="trash" className="h-4 w-4" />
							)}
							<span className="sr-only">Delete project</span>
						</Button>
					</fetcher.Form>
				</div>
			</div>
			<div className="text-muted-foreground space-y-2 text-sm">
				<div className="flex items-center gap-2">
					<Icon name="clock" className="h-3 w-3" />
					<span>
						Created {new Date(project.createdAt).toLocaleDateString()}
					</span>
				</div>
				{project.updatedAt !== project.createdAt && (
					<div className="flex items-center gap-2">
						<Icon name="update" className="h-3 w-3" />
						<span>
							Updated {new Date(project.updatedAt).toLocaleDateString()}
						</span>
					</div>
				)}
			</div>
		</div>
	)
}

export const meta: Route.MetaFunction = () => {
	return [
		{ title: 'Projects | Epic Stack' },
		{ name: 'description', content: 'Manage your projects' },
	]
}
