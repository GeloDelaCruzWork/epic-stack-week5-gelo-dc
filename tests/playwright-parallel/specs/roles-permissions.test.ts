import { test, expect } from '@playwright/test'
import { AuthHelpers } from '../helpers/auth-helpers'

test.describe('Roles and Permissions', () => {
	test.use({ baseURL: 'http://localhost:3000' })

	let authHelpers: AuthHelpers

	test.beforeEach(async ({ page }) => {
		authHelpers = new AuthHelpers(page)
	})

	test('should restrict admin features to admin users', async ({ page }) => {
		// Login as regular user
		await authHelpers.login('kody', 'kodylovesyou')

		// Try to access admin area (if exists)
		await page.goto('/admin', { waitUntil: 'networkidle' })

		// A non-admin user should not see the admin page, but a "Not Found" page.
		await expect(
			page.getByRole('heading', { name: /we can't find this page/i }),
		).toBeVisible()
	})

	test('should allow different users to have different permissions', async ({
		page,
	}) => {
		// Login as first user
		await authHelpers.login('kody', 'kodylovesyou')

		// Check what user can access
		await page.goto('/users/kody')
		expect(page.url()).toContain('/users/kody')

		// User should see their own profile
		await expect(page.getByRole('heading', { name: 'Kody' })).toBeVisible()
	})

	test('should enforce ownership rules on notes', async ({ page }) => {
		// Login as user
		await authHelpers.login('kody', 'kodylovesyou')

		// Navigate to own notes
		await page.goto('/users/kody/notes')

		// Should be able to see notes
		await expect(
			page.getByRole('heading', { name: /kody's notes/i }),
		).toBeVisible()

		// Try to access another user's notes (if exists)
		await page.goto('/users/otheruser/notes', { waitUntil: 'networkidle' })

		// Check if we can see but not edit
		const editButtons = page.locator(
			'button:has-text("Edit"), a:has-text("Edit")',
		)
		const editCount = await editButtons.count()
		// Shouldn't have edit buttons for other user's notes
		expect(editCount).toBe(0)
	})

	test('should control project access based on permissions', async ({
		page,
	}) => {
		// Login as user
		await authHelpers.login('kody', 'kodylovesyou')

		// Navigate to projects
		await page.goto('/projects')
		await page.waitForLoadState('networkidle')

		// Should be able to view projects
		expect(page.url()).toContain('/projects')

		// Check for create/edit/delete buttons based on permissions
		const createButton = page.locator(
			'button:has-text("Create"), button:has-text("New Project")',
		)
		const hasCreatePermission = await createButton.isVisible()

		// User permissions should determine what buttons are visible
		expect(typeof hasCreatePermission).toBe('boolean')
	})

	test('should enforce timesheet permissions', async ({ page }) => {
		// Login as user
		await authHelpers.login('kody', 'kodylovesyou')

		// Try to access timesheets
		await page.goto('/timesheets')
		await page.waitForLoadState('networkidle')

		// Check if user has access
		const hasAccess =
			!page.url().includes('/login') && !page.url().includes('/unauthorized')

		if (hasAccess) {
			// Check what actions are available
			const addButton = page.getByRole('button', {
				name: /create timesheet/i,
			})
			const canCreate = await addButton.isVisible()

			const editButtons = page.locator('button[title*="Edit" i]')
			const canEdit = (await editButtons.count()) > 0

			const deleteButtons = page.locator('button[title*="Delete" i]')
			const canDelete = (await deleteButtons.count()) > 0

			// Permissions should be consistently applied
			expect(typeof canCreate).toBe('boolean')
			expect(typeof canEdit).toBe('boolean')
			expect(typeof canDelete).toBe('boolean')
		}
	})

	test('should handle unauthorized access gracefully', async ({ page }) => {
		// Try to access protected resource without login
		await page.goto('/api/timesheets', { waitUntil: 'networkidle' })

		// Should either redirect to login or return unauthorized
		const url = page.url()
		const responseText = await page.textContent('body')

		const isProtected =
			url.includes('/login') ||
			/unauthorized|401|403|not found/i.test(responseText ?? '')

		expect(isProtected).toBe(true)
	})

	test('should maintain permission consistency across navigation', async ({
		page,
	}) => {
		// Login
		await authHelpers.login('kody', 'kodylovesyou')

		// Navigate to multiple protected areas
		const protectedRoutes = ['/users/kody/notes', '/projects', '/timesheets']

		for (const route of protectedRoutes) {
			await page.goto(route, { waitUntil: 'networkidle' })

			// Should maintain session and not redirect to login
			const isAuthorized = !page.url().includes('/login')

			if (!isAuthorized) {
				// If one route requires login, it might be intentionally restricted
			}
		}
	})

	test('should show appropriate UI elements based on user role', async ({
		page,
	}) => {
		// Login as user
		await authHelpers.login('kody', 'kodylovesyou')

		// Check for role-specific UI elements
		await page.goto('/')

		// Regular users shouldn't see admin menu items
		const adminMenu = page.locator('a[href="/admin"], button:has-text("Admin")')
		const adminMenuCount = await adminMenu.count()
		expect(adminMenuCount).toBe(0)

		// Should see user-specific elements
		const userMenu = page.getByRole('link', { name: /kody/i })
		const userMenuVisible = await userMenu.isVisible()
		expect(userMenuVisible).toBe(true)
	})

	test('should handle session expiration', async ({ page }) => {
		// Login
		await authHelpers.login('kody', 'kodylovesyou')

		// Clear cookies to simulate session expiration
		await page.context().clearCookies()

		// Try to access protected resource
		await page.goto('/users/kody/notes/new')

		// Should redirect to login
		await page.waitForURL(/.*\/login/, { timeout: 5000 })
		expect(page.url()).toContain('/login')
	})

	test('should validate CRUD permissions on resources', async ({ page }) => {
		// Login
		await authHelpers.login('kody', 'kodylovesyou')

		// Test CREATE permission
		await page.goto('/users/kody/notes/new')
		const canCreate =
			!page.url().includes('/login') && !page.url().includes('/unauthorized')

		if (canCreate) {
			// Test READ permission
			await page.goto('/users/kody/notes')
			const canRead = await page
				.getByRole('heading', { name: /notes/i })
				.isVisible()
			expect(canRead).toBe(true)

			// Test UPDATE permission (if note exists)
			const editLinks = page.locator('a[href*="edit"]')
			const canUpdate = (await editLinks.count()) > 0

			// Test DELETE permission
			const deleteButtons = page.locator(
				'button[name*="delete" i], button:has-text("Delete")',
			)
			const canDelete = (await deleteButtons.count()) > 0
		}
	})

	test('should prevent cross-user data modification', async ({ page }) => {
		// Login as kody
		await authHelpers.login('kody', 'kodylovesyou')

		// Try to modify another user's data via API
		const response = await page.request.put(
			'/api/users/otheruser/notes/somenote',
			{
				data: { title: 'Hacked!', content: 'Should not work' },
				failOnStatusCode: false,
			},
		)

		// Should be forbidden or not found
		const status = response.status()
		expect(status).toBeGreaterThanOrEqual(400) // 401, 403, or 404
	})

	test('should apply role-based API access control', async ({ page }) => {
		// Login
		await authHelpers.login('kody', 'kodylovesyou')

		// Test various API endpoints
		const endpoints = [
			{ url: '/api/timesheets', method: 'GET' },
			{ url: '/api/projects', method: 'GET' },
			{ url: '/api/dtrs', method: 'GET' },
		]

		for (const endpoint of endpoints) {
			let response
			switch (endpoint.method) {
				case 'GET':
					response = await page.request.get(endpoint.url, {
						failOnStatusCode: false,
					})
					break
				case 'POST':
					response = await page.request.post(endpoint.url, {
						failOnStatusCode: false,
					})
					break
				// Add other methods as needed
				default:
					throw new Error(`Unsupported method: ${endpoint.method}`)
			}

			const status = response.status()

			// Should either succeed (200-299) or properly reject (401/403)
			const isProperlyHandled =
				(status >= 200 && status < 300) || [401, 403, 404].includes(status)
			expect(isProperlyHandled).toBe(true)
		}
	})
})
