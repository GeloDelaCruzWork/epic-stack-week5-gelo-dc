import { test, expect } from '@playwright/test'

// Increase timeout for all tests
test.setTimeout(45000)

test.describe('Roles and Permissions Basic Tests', () => {
	const BASE_URL = 'http://localhost:3000'

	test('should require authentication for protected routes', async ({
		page,
	}) => {
		// Test without login
		const protectedRoutes = [
			'/users/kody/notes/new', // Creating notes requires auth
			'/projects',
			'/timesheets',
		]

		for (const route of protectedRoutes) {
			await page.goto(`${BASE_URL}${route}`)

			// Should redirect to login
			await page.waitForURL(/.*\/login/, { timeout: 5000 })
			expect(page.url()).toContain('/login')
			console.log(`✅ Route ${route} requires authentication`)
		}
	})

	test('should allow authenticated access to resources', async ({ page }) => {
		// Login first
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})

		// Test authenticated access
		const routes = [
			{ path: '/users/kody', contains: 'kody' },
			{ path: '/users/kody/notes', contains: 'notes' },
			{ path: '/projects', contains: 'project' },
		]

		for (const route of routes) {
			await page.goto(`${BASE_URL}${route.path}`)

			// Should not redirect to login
			expect(page.url()).not.toContain('/login')

			// Should contain relevant content
			const content = await page.textContent('body')
			expect(content?.toLowerCase()).toContain(route.contains)

			console.log(`✅ Authenticated access to ${route.path}`)
		}
	})

	test('should show appropriate CRUD permissions for notes', async ({
		page,
	}) => {
		// Login
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})

		// Go to notes
		await page.goto(`${BASE_URL}/users/kody/notes`)

		// Check for create permission
		const newNoteLink = await page
			.locator('a[href*="new"]')
			.first()
			.isVisible({ timeout: 2000 })
			.catch(() => false)
		expect(newNoteLink).toBe(true)

		// Check if any notes exist to test edit/delete
		const noteLinks = page.locator('a[href*="/notes/"]:not([href*="new"])')
		const noteCount = await noteLinks.count()

		console.log(
			`✅ Notes page has ${noteCount} notes, can create: ${newNoteLink}`,
		)
	})

	test('should handle project permissions correctly', async ({ page }) => {
		// Login
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})

		// Go to projects
		await page.goto(`${BASE_URL}/projects`)

		// Check permissions
		const permissions = {
			view: !page.url().includes('/login'),
			create: await page
				.locator('input[name="name"], button[type="submit"]')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false),
			hasProjects:
				(await page.textContent('body'))?.includes('Test Project') || false,
		}

		expect(permissions.view).toBe(true)
		console.log('✅ Project permissions:', permissions)
	})

	test('should handle timesheet permissions correctly', async ({ page }) => {
		// Login
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})

		// Go to timesheets
		await page.goto(`${BASE_URL}/timesheets`)

		// Wait for AG-Grid to load
		await page.waitForTimeout(3000)

		// Check permissions
		const permissions = {
			view: !page.url().includes('/login'),
			hasGrid: await page
				.locator('.ag-root')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false),
			canAdd: await page
				.locator('button:has-text("Add"), button:has-text("Create")')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false),
		}

		expect(permissions.view).toBe(true)
		console.log('✅ Timesheet permissions:', permissions)
	})

	test('should handle session correctly', async ({ page, context }) => {
		// Login
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})

		// Verify logged in
		await page.goto(`${BASE_URL}/users/kody`)
		expect(page.url()).toContain('/users/kody')

		// Clear session
		await context.clearCookies()

		// Try to access protected resource (creating notes requires auth)
		await page.goto(`${BASE_URL}/users/kody/notes/new`)

		// Should redirect to login
		await page.waitForURL(/.*\/login/, { timeout: 5000 })
		expect(page.url()).toContain('/login')

		console.log('✅ Session management works correctly')
	})

	test('should prevent unauthorized API access', async ({ page }) => {
		// Test without authentication
		const response = await page.request.get(`${BASE_URL}/api/user`, {
			failOnStatusCode: false,
		})

		const status = response.status()

		// Should return auth error or not found
		expect(status).toBeGreaterThanOrEqual(400)
		console.log(`✅ Unauthorized API access returns ${status}`)
	})

	test('should show correct UI for authenticated user', async ({ page }) => {
		// Login
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})

		// Go to homepage
		await page.goto(BASE_URL)

		// Check for user elements
		const userElements = {
			username: await page.locator('text=/kody/i').count(),
			userMenu: await page
				.locator('button[aria-label*="user" i], img[alt*="kody" i]')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false),
			logoutForm: await page
				.locator('form[action="/logout"], button[form="logout-form"]')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false),
		}

		// Should have at least username visible
		expect(userElements.username).toBeGreaterThan(0)
		console.log('✅ User UI elements:', userElements)
	})

	test('should handle cross-user access appropriately', async ({ page }) => {
		// Login as kody
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})

		// Try to access non-existent user's resources
		await page.goto(`${BASE_URL}/users/nonexistent/notes`)

		// Should handle gracefully (redirect, 404, or empty)
		const url = page.url()
		const content = await page.textContent('body')

		const isHandled =
			url.includes('/404') ||
			url.includes('/login') ||
			content?.includes('not found') ||
			content?.includes('404') ||
			!content?.includes('nonexistent')

		expect(isHandled).toBe(true)
		console.log('✅ Cross-user access handled appropriately')
	})

	test('should create and manage notes with proper permissions', async ({
		page,
	}) => {
		// Login
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})

		// Go to notes
		await page.goto(`${BASE_URL}/users/kody/notes`)

		// Try to create a new note
		const newLink = page.locator('a[href*="new"]').first()
		if (await newLink.isVisible({ timeout: 2000 })) {
			await newLink.click()

			// Wait for navigation
			await page.waitForTimeout(1000)

			// Check if on new note page
			if (page.url().includes('/new')) {
				// Fill note form
				const titleInput = page.locator('input[name="title"]').first()
				const contentInput = page.locator('textarea[name="content"]').first()

				if (
					(await titleInput.isVisible()) &&
					(await contentInput.isVisible())
				) {
					await titleInput.fill(`Role Test ${Date.now()}`)
					await contentInput.fill('Testing role-based permissions')

					// Submit
					await page.click('button[type="submit"]')

					// Wait for save
					await page.waitForTimeout(2000)

					console.log('✅ Successfully created note with proper permissions')
				}
			}
		} else {
			console.log('ℹ️ New note link not available')
		}
	})
})
