import { faker } from '@faker-js/faker'
import { describe, expect, test, beforeEach, vi } from 'vitest'
import { prisma } from '#app/utils/db.server.ts'
import { type Project } from '@prisma/client'

// Project service functions (these would typically be in a separate file)
export async function createProject(data: {
	name: string
	description?: string | null
}) {
	return prisma.project.create({
		data: {
			name: data.name,
			description: data.description,
		},
	})
}

export async function getProjects() {
	return prisma.project.findMany({
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			name: true,
			description: true,
			createdAt: true,
			updatedAt: true,
		},
	})
}

export async function getProjectById(id: string) {
	return prisma.project.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			description: true,
			createdAt: true,
			updatedAt: true,
		},
	})
}

export async function updateProject(
	id: string,
	data: {
		name?: string
		description?: string | null
	},
) {
	return prisma.project.update({
		where: { id },
		data,
	})
}

export async function deleteProject(id: string) {
	return prisma.project.delete({
		where: { id },
	})
}

describe('Project database operations', () => {
	beforeEach(async () => {
		// Clean up any existing test projects
		await prisma.project.deleteMany()
	})

	describe('createProject', () => {
		test('creates project with name only', async () => {
			const projectData = {
				name: faker.company.name(),
			}

			const project = await createProject(projectData)

			expect(project).toBeDefined()
			expect(project.id).toBeTruthy()
			expect(project.name).toBe(projectData.name)
			expect(project.description).toBeNull()
			expect(project.createdAt).toBeInstanceOf(Date)
			expect(project.updatedAt).toBeInstanceOf(Date)
		})

		test('creates project with name and description', async () => {
			const projectData = {
				name: faker.company.name(),
				description: faker.company.catchPhrase(),
			}

			const project = await createProject(projectData)

			expect(project.name).toBe(projectData.name)
			expect(project.description).toBe(projectData.description)
		})

		test('creates project with empty description', async () => {
			const projectData = {
				name: faker.company.name(),
				description: '',
			}

			const project = await createProject(projectData)

			expect(project.description).toBe('')
		})

		test('creates project with null description', async () => {
			const projectData = {
				name: faker.company.name(),
				description: null,
			}

			const project = await createProject(projectData)

			expect(project.description).toBeNull()
		})

		test('generates unique IDs for each project', async () => {
			const project1 = await createProject({ name: 'Project 1' })
			const project2 = await createProject({ name: 'Project 2' })

			expect(project1.id).not.toBe(project2.id)
		})

		test('sets createdAt and updatedAt to same value on creation', async () => {
			const project = await createProject({ name: 'Test Project' })

			expect(project.createdAt.getTime()).toBe(project.updatedAt.getTime())
		})
	})

	describe('getProjects', () => {
		test('returns empty array when no projects exist', async () => {
			const projects = await getProjects()

			expect(projects).toEqual([])
		})

		test('returns all projects', async () => {
			const project1 = await createProject({ name: 'Project 1' })
			const project2 = await createProject({ name: 'Project 2' })
			const project3 = await createProject({ name: 'Project 3' })

			const projects = await getProjects()

			expect(projects).toHaveLength(3)
			expect(projects.map((p) => p.id)).toContain(project1.id)
			expect(projects.map((p) => p.id)).toContain(project2.id)
			expect(projects.map((p) => p.id)).toContain(project3.id)
		})

		test('returns projects in descending order by createdAt', async () => {
			// Create projects with specific timestamps
			const oldProject = await prisma.project.create({
				data: {
					name: 'Old Project',
					createdAt: new Date('2024-01-01'),
				},
			})
			const newProject = await prisma.project.create({
				data: {
					name: 'New Project',
					createdAt: new Date('2024-01-10'),
				},
			})
			const middleProject = await prisma.project.create({
				data: {
					name: 'Middle Project',
					createdAt: new Date('2024-01-05'),
				},
			})

			const projects = await getProjects()

			expect(projects[0]?.id).toBe(newProject.id)
			expect(projects[1]?.id).toBe(middleProject.id)
			expect(projects[2]?.id).toBe(oldProject.id)
		})

		test('returns only selected fields', async () => {
			await createProject({
				name: 'Test Project',
				description: 'Test Description',
			})

			const projects = await getProjects()
			const project = projects[0]

			// Should have these fields
			expect(project).toHaveProperty('id')
			expect(project).toHaveProperty('name')
			expect(project).toHaveProperty('description')
			expect(project).toHaveProperty('createdAt')
			expect(project).toHaveProperty('updatedAt')

			// Type check - if this compiles, we're selecting the right fields
			const _typeCheck: Pick<
				Project,
				'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'
			> = project!
		})
	})

	describe('getProjectById', () => {
		test('returns project when it exists', async () => {
			const created = await createProject({
				name: 'Test Project',
				description: 'Test Description',
			})

			const project = await getProjectById(created.id)

			expect(project).toBeDefined()
			expect(project?.id).toBe(created.id)
			expect(project?.name).toBe(created.name)
			expect(project?.description).toBe(created.description)
		})

		test('returns null when project does not exist', async () => {
			const fakeId = faker.string.uuid()
			const project = await getProjectById(fakeId)

			expect(project).toBeNull()
		})
	})

	describe('updateProject', () => {
		test('updates project name only', async () => {
			const project = await createProject({
				name: 'Original Name',
				description: 'Original Description',
			})

			const updated = await updateProject(project.id, {
				name: 'Updated Name',
			})

			expect(updated.name).toBe('Updated Name')
			expect(updated.description).toBe('Original Description')
			expect(updated.updatedAt.getTime()).toBeGreaterThan(
				project.updatedAt.getTime(),
			)
		})

		test('updates project description only', async () => {
			const project = await createProject({
				name: 'Original Name',
				description: 'Original Description',
			})

			const updated = await updateProject(project.id, {
				description: 'Updated Description',
			})

			expect(updated.name).toBe('Original Name')
			expect(updated.description).toBe('Updated Description')
		})

		test('updates both name and description', async () => {
			const project = await createProject({
				name: 'Original Name',
				description: 'Original Description',
			})

			const updated = await updateProject(project.id, {
				name: 'New Name',
				description: 'New Description',
			})

			expect(updated.name).toBe('New Name')
			expect(updated.description).toBe('New Description')
		})

		test('can set description to null', async () => {
			const project = await createProject({
				name: 'Test Project',
				description: 'Has Description',
			})

			const updated = await updateProject(project.id, {
				description: null,
			})

			expect(updated.description).toBeNull()
		})

		test('can set description to empty string', async () => {
			const project = await createProject({
				name: 'Test Project',
				description: 'Has Description',
			})

			const updated = await updateProject(project.id, {
				description: '',
			})

			expect(updated.description).toBe('')
		})

		test('updates updatedAt timestamp', async () => {
			const project = await createProject({
				name: 'Test Project',
			})

			// Wait a bit to ensure different timestamp
			await new Promise((resolve) => setTimeout(resolve, 10))

			const updated = await updateProject(project.id, {
				name: 'Updated Project',
			})

			expect(updated.updatedAt.getTime()).toBeGreaterThan(
				project.createdAt.getTime(),
			)
			expect(updated.createdAt.getTime()).toBe(project.createdAt.getTime())
		})

		test('throws error when updating non-existent project', async () => {
			const fakeId = faker.string.uuid()

			await expect(
				updateProject(fakeId, { name: 'New Name' }),
			).rejects.toThrow()
		})
	})

	describe('deleteProject', () => {
		test('deletes existing project', async () => {
			const project = await createProject({
				name: 'To Be Deleted',
			})

			await deleteProject(project.id)

			const found = await getProjectById(project.id)
			expect(found).toBeNull()
		})

		test('returns deleted project data', async () => {
			const project = await createProject({
				name: 'To Be Deleted',
				description: 'Will be gone',
			})

			const deleted = await deleteProject(project.id)

			expect(deleted.id).toBe(project.id)
			expect(deleted.name).toBe(project.name)
			expect(deleted.description).toBe(project.description)
		})

		test('throws error when deleting non-existent project', async () => {
			const fakeId = faker.string.uuid()

			await expect(deleteProject(fakeId)).rejects.toThrow()
		})
	})

	describe('concurrent operations', () => {
		test('handles concurrent project creation', async () => {
			const projectPromises = Array.from({ length: 10 }, (_, i) =>
				createProject({ name: `Project ${i}` }),
			)

			const projects = await Promise.all(projectPromises)
			const projectIds = projects.map((p) => p.id)
			const uniqueIds = new Set(projectIds)

			expect(uniqueIds.size).toBe(10)
			expect(projects.every((p) => p.name.startsWith('Project'))).toBe(true)
		})

		test('handles concurrent updates to different projects', async () => {
			const project1 = await createProject({ name: 'Project 1' })
			const project2 = await createProject({ name: 'Project 2' })

			const [updated1, updated2] = await Promise.all([
				updateProject(project1.id, { name: 'Updated 1' }),
				updateProject(project2.id, { name: 'Updated 2' }),
			])

			expect(updated1.name).toBe('Updated 1')
			expect(updated2.name).toBe('Updated 2')
		})
	})

	describe('data integrity', () => {
		test('preserves special characters in project names', async () => {
			const specialName = 'Project & Co. <tag> "quoted" \'apostrophe\' @2024'
			const project = await createProject({ name: specialName })

			expect(project.name).toBe(specialName)
		})

		test('preserves unicode characters', async () => {
			const unicodeName = '项目 プロジェクト проект 🚀'
			const project = await createProject({ name: unicodeName })

			expect(project.name).toBe(unicodeName)
		})

		test('preserves multi-line descriptions', async () => {
			const multilineDesc = 'Line 1\nLine 2\nLine 3\n\nLine 5'
			const project = await createProject({
				name: 'Test',
				description: multilineDesc,
			})

			expect(project.description).toBe(multilineDesc)
		})

		test('handles maximum length values', async () => {
			const maxName = 'a'.repeat(100)
			const maxDesc = 'b'.repeat(500)

			const project = await createProject({
				name: maxName,
				description: maxDesc,
			})

			expect(project.name).toBe(maxName)
			expect(project.description).toBe(maxDesc)
		})
	})
})
