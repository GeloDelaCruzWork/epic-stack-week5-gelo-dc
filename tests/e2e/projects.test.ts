import { faker } from '@faker-js/faker'
import { type Project } from '@prisma/client'
import { prisma } from '#app/utils/db.server.ts'
import { expect, test } from '#tests/playwright-utils.ts'

test.describe('Project Management', () => {
	test('User must be logged in to access projects', async ({ page }) => {
		await page.goto('/projects')
		await expect(page).toHaveURL('/login?redirectTo=%2Fprojects')
	})

	test('Logged in user can view projects page', async ({ page, login }) => {
		await login()
		await page.goto('/projects')

		await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
		await expect(page.getByText('Manage your projects here')).toBeVisible()
		await expect(
			page.getByRole('heading', { name: 'Create New Project' }),
		).toBeVisible()
		await expect(
			page.getByRole('heading', { name: 'Your Projects' }),
		).toBeVisible()
	})

	test('Shows empty state when no projects exist', async ({ page, login }) => {
		await login()
		await page.goto('/projects')

		await expect(page.getByText('No projects yet')).toBeVisible()
		await expect(
			page.getByText('Create your first project to get started'),
		).toBeVisible()
	})

	test('User can create a new project with name only', async ({
		page,
		login,
	}) => {
		const user = await login()
		await page.goto('/projects')

		const projectData = createProject()

		// Fill in project name only
		await page
			.getByRole('textbox', { name: /project name/i })
			.fill(projectData.name)
		await page.getByRole('button', { name: /create project/i }).click()

		// Verify project was created and appears in the list
		await expect(
			page.getByRole('heading', { name: projectData.name }),
		).toBeVisible()
		await expect(page.getByText('Created')).toBeVisible()

		// Verify in database
		const project = await prisma.project.findFirst({
			where: { name: projectData.name },
		})
		expect(project).toBeTruthy()
		expect(project?.name).toBe(projectData.name)
		expect(project?.description).toBeNull()
	})

	test('User can create a project with name and description', async ({
		page,
		login,
	}) => {
		await login()
		await page.goto('/projects')

		const projectData = createProject()

		// Fill in both fields
		await page
			.getByRole('textbox', { name: /project name/i })
			.fill(projectData.name)
		await page
			.getByRole('textbox', { name: /description/i })
			.fill(projectData.description!)
		await page.getByRole('button', { name: /create project/i }).click()

		// Verify project was created with description
		await expect(
			page.getByRole('heading', { name: projectData.name }),
		).toBeVisible()
		await expect(page.getByText(projectData.description!)).toBeVisible()

		// Verify in database
		const project = await prisma.project.findFirst({
			where: { name: projectData.name },
		})
		expect(project).toBeTruthy()
		expect(project?.description).toBe(projectData.description)
	})

	test('Project creation validates required name field', async ({
		page,
		login,
	}) => {
		await login()
		await page.goto('/projects')

		// Try to submit without filling name
		await page.getByRole('button', { name: /create project/i }).click()

		// Should show validation error
		await expect(page.getByText('Name is required')).toBeVisible()
	})

	test('Project creation validates name length', async ({ page, login }) => {
		await login()
		await page.goto('/projects')

		// Try to submit with name too long
		const longName = 'a'.repeat(101)
		await page.getByRole('textbox', { name: /project name/i }).fill(longName)
		await page.getByRole('button', { name: /create project/i }).click()

		// Should show validation error
		await expect(
			page.getByText('Name must be 100 characters or less'),
		).toBeVisible()
	})

	test('Project creation validates description length', async ({
		page,
		login,
	}) => {
		await login()
		await page.goto('/projects')

		// Try to submit with description too long
		const longDescription = 'a'.repeat(501)
		await page
			.getByRole('textbox', { name: /project name/i })
			.fill('Valid Name')
		await page
			.getByRole('textbox', { name: /description/i })
			.fill(longDescription)
		await page.getByRole('button', { name: /create project/i }).click()

		// Should show validation error
		await expect(
			page.getByText('Description must be 500 characters or less'),
		).toBeVisible()
	})

	test('User can edit an existing project', async ({ page, login }) => {
		const user = await login()

		// Create a project directly in database
		const project = await prisma.project.create({
			data: createProject(),
		})

		await page.goto('/projects')

		// Click edit button for the project
		await page
			.getByRole('heading', { name: project.name })
			.locator('..')
			.locator('..')
			.getByRole('link', { name: /edit project/i })
			.click()

		// Should be on edit page
		await expect(page).toHaveURL(`/projects/${project.id}/edit`)
		await expect(
			page.getByRole('heading', { name: 'Edit Project' }),
		).toBeVisible()

		// Update the project
		const updatedData = createProject()
		await page.getByRole('textbox', { name: /project name/i }).clear()
		await page
			.getByRole('textbox', { name: /project name/i })
			.fill(updatedData.name)
		await page.getByRole('textbox', { name: /description/i }).clear()
		await page
			.getByRole('textbox', { name: /description/i })
			.fill(updatedData.description!)

		await page.getByRole('button', { name: /save changes/i }).click()

		// Should redirect back to projects list with toast
		await expect(page).toHaveURL('/projects')
		await expect(page.getByText('Project updated')).toBeVisible()
		await expect(
			page.getByText(`"${updatedData.name}" has been updated successfully.`),
		).toBeVisible()

		// Verify the updated project appears in the list
		await expect(
			page.getByRole('heading', { name: updatedData.name }),
		).toBeVisible()
		await expect(page.getByText(updatedData.description!)).toBeVisible()

		// Verify in database
		const updatedProject = await prisma.project.findUnique({
			where: { id: project.id },
		})
		expect(updatedProject?.name).toBe(updatedData.name)
		expect(updatedProject?.description).toBe(updatedData.description)
	})

	test('Edit project validates required fields', async ({ page, login }) => {
		await login()

		// Create a project
		const project = await prisma.project.create({
			data: createProject(),
		})

		await page.goto(`/projects/${project.id}/edit`)

		// Clear the name field and try to save
		await page.getByRole('textbox', { name: /project name/i }).clear()
		await page.getByRole('button', { name: /save changes/i }).click()

		// Should show validation error
		await expect(page.getByText('Name is required')).toBeVisible()
	})

	test('User can delete a project from edit page', async ({ page, login }) => {
		await login()

		// Create a project
		const project = await prisma.project.create({
			data: createProject(),
		})

		await page.goto(`/projects/${project.id}/edit`)

		// Click delete button in danger zone
		await page.getByRole('button', { name: /delete project/i }).click()

		// Should redirect to projects list with success toast
		await expect(page).toHaveURL('/projects')
		await expect(page.getByText('Project deleted')).toBeVisible()
		await expect(
			page.getByText(`"${project.name}" has been deleted successfully.`),
		).toBeVisible()

		// Project should not appear in the list
		await expect(
			page.getByRole('heading', { name: project.name }),
		).not.toBeVisible()

		// Verify deleted from database
		const deletedProject = await prisma.project.findUnique({
			where: { id: project.id },
		})
		expect(deletedProject).toBeNull()
	})

	test('User can delete a project from projects list', async ({
		page,
		login,
	}) => {
		await login()

		// Create a project
		const project = await prisma.project.create({
			data: createProject(),
		})

		await page.goto('/projects')

		// Click delete button on the project card
		const projectCard = page
			.getByRole('heading', { name: project.name })
			.locator('..')
			.locator('..')
		await projectCard.getByRole('button', { name: /delete project/i }).click()

		// Should show success toast
		await expect(page.getByText('Project deleted')).toBeVisible()
		await expect(
			page.getByText(`"${project.name}" has been deleted successfully.`),
		).toBeVisible()

		// Project should not appear in the list
		await expect(
			page.getByRole('heading', { name: project.name }),
		).not.toBeVisible()

		// Verify deleted from database
		const deletedProject = await prisma.project.findUnique({
			where: { id: project.id },
		})
		expect(deletedProject).toBeNull()
	})

	test('Shows 404 error when editing non-existent project', async ({
		page,
		login,
	}) => {
		await login()

		const fakeId = faker.string.uuid()
		await page.goto(`/projects/${fakeId}/edit`)

		// Should show 404 error
		await expect(
			page.getByRole('heading', { name: 'Project not found' }),
		).toBeVisible()
		await expect(
			page.getByText(`We couldn't find a project with ID "${fakeId}"`),
		).toBeVisible()

		// Should have back to projects button
		await page.getByRole('link', { name: /back to projects/i }).click()
		await expect(page).toHaveURL('/projects')
	})

	test('Cancel button on edit page returns to projects list', async ({
		page,
		login,
	}) => {
		await login()

		// Create a project
		const project = await prisma.project.create({
			data: createProject(),
		})

		await page.goto(`/projects/${project.id}/edit`)

		// Make some changes but don't save
		await page
			.getByRole('textbox', { name: /project name/i })
			.fill('Changed Name')

		// Click cancel
		await page.getByRole('link', { name: /cancel/i }).click()

		// Should be back on projects page
		await expect(page).toHaveURL('/projects')

		// Original name should still be displayed
		await expect(
			page.getByRole('heading', { name: project.name }),
		).toBeVisible()
		await expect(
			page.getByRole('heading', { name: 'Changed Name' }),
		).not.toBeVisible()
	})

	test('Projects are displayed in correct order (newest first)', async ({
		page,
		login,
	}) => {
		await login()

		// Create projects with specific timestamps
		const project1 = await prisma.project.create({
			data: {
				...createProject(),
				createdAt: new Date('2024-01-01'),
			},
		})
		const project2 = await prisma.project.create({
			data: {
				...createProject(),
				createdAt: new Date('2024-01-02'),
			},
		})
		const project3 = await prisma.project.create({
			data: {
				...createProject(),
				createdAt: new Date('2024-01-03'),
			},
		})

		await page.goto('/projects')

		// Get all project names in order
		const projectNames = await page
			.getByRole('heading', { level: 3 })
			.allTextContents()

		// Should be in reverse chronological order (newest first)
		expect(projectNames[0]).toBe(project3.name)
		expect(projectNames[1]).toBe(project2.name)
		expect(projectNames[2]).toBe(project1.name)
	})

	test('Shows updated date when project has been edited', async ({
		page,
		login,
	}) => {
		await login()

		// Create a project with different created and updated dates
		const project = await prisma.project.create({
			data: {
				...createProject(),
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-10'),
			},
		})

		await page.goto('/projects')

		const projectCard = page
			.getByRole('heading', { name: project.name })
			.locator('..')
			.locator('..')

		// Should show both created and updated dates
		await expect(projectCard.getByText(/Created/)).toBeVisible()
		await expect(projectCard.getByText(/Updated/)).toBeVisible()
	})

	test('Form is cleared after successful project creation', async ({
		page,
		login,
	}) => {
		await login()
		await page.goto('/projects')

		const projectData = createProject()

		// Fill and submit form
		await page
			.getByRole('textbox', { name: /project name/i })
			.fill(projectData.name)
		await page
			.getByRole('textbox', { name: /description/i })
			.fill(projectData.description!)
		await page.getByRole('button', { name: /create project/i }).click()

		// Wait for the project to appear in the list
		await expect(
			page.getByRole('heading', { name: projectData.name }),
		).toBeVisible()

		// Form should be cleared
		await expect(
			page.getByRole('textbox', { name: /project name/i }),
		).toHaveValue('')
		await expect(
			page.getByRole('textbox', { name: /description/i }),
		).toHaveValue('')
	})
})

function createProject() {
	return {
		name: faker.company.name().substring(0, 50), // Ensure it fits within limit
		description: faker.company.catchPhrase(),
	} satisfies Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
}
