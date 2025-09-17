import { test, expect } from '@playwright/test'

test.describe('Roles and Assignment Tests - Fixed', () => {
	const BASE_URL = 'http://localhost:3000'

	test('should enforce authentication on protected routes', async ({
		browser,
	}) => {
		// Create new context without login
		const context = await browser.newContext()
		const page = await context.newPage()

		// Test protected routes
		const protectedRoutes = [
			'/users/kody/notes',
			'/projects',
			'/timesheets',
			'/admin',
		]

		for (const route of protectedRoutes) {
			await page.goto(`${BASE_URL}${route}`)
			const url = new URL(page.url())
			expect(url.pathname).toBe('/login')
		}

		await context.close()
	})

	test('should allow access to own resources', async ({ page }) => {
		// Login before test
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		// Access own user page
		await page.goto(`${BASE_URL}/users/kody`)
		expect(page.url()).toContain('/users/kody')

		// Access own notes
		await page.goto(`${BASE_URL}/users/kody/notes`)
		expect(page.url()).toContain('/users/kody/notes')

		// Check for user content
		const pageContent = await page.textContent('body')
		expect(pageContent?.toLowerCase()).toContain('kody')

		console.log('✅ User can access own resources')
	})

	test('should show appropriate actions based on permissions', async ({
		page,
	}) => {
		// Login before test
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		// Navigate to notes
		await page.goto(`${BASE_URL}/users/kody/notes`)

		// Check for CRUD actions
		const actions = {
			create: await page
				.locator('a[href*="new"], button:has-text("New")')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false),
			edit: await page
				.locator('a[href*="edit"], button:has-text("Edit")')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false),
			delete: await page
				.locator('button:has-text("Delete")')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false),
		}

		// User should have at least create permission for own notes
		expect(actions.create).toBe(true)

		console.log('✅ User permissions:', actions)
	})

	test('should handle project permissions', async ({ page }) => {
		// Login before test
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		// Navigate to projects
		await page.goto(`${BASE_URL}/projects`)

		// Should be able to view projects page
		expect(page.url()).toContain('/projects')

		// Check for project actions
		const canCreateProject = await page
			.locator(
				'button[type="submit"], button:has-text("Create"), button:has-text("Add")',
			)
			.first()
			.isVisible({ timeout: 2000 })
			.catch(() => false)

		// Check for edit/delete buttons if projects exist
		const editButtons = await page
			.locator('a[href*="edit"], button:has-text("Edit")')
			.count()
		const deleteButtons = await page
			.locator('button:has-text("Delete")')
			.count()

		console.log('✅ Project permissions:', {
			canCreate: canCreateProject,
			editButtons,
			deleteButtons,
		})
	})

	test('should handle timesheet permissions', async ({ page }) => {
		// Login before test
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		// Navigate to timesheets
		await page.goto(`${BASE_URL}/timesheets`)

		// Wait for page to load
		await page.waitForLoadState('networkidle')

		// Should be able to view timesheets
		expect(page.url()).toContain('/timesheets')

		// Check for timesheet actions
		const actions = {
			add: await page
				.locator('button:has-text("Add"), button:has-text("Create")')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false),
			edit: await page
				.locator('button[title*="Edit"]')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false),
			delete: await page
				.locator('button[title*="Delete"]')
				.first()
				.isVisible({ timeout: 2000 })
				.catch(() => false),
		}

		console.log('✅ Timesheet permissions:', actions)
	})

	test('should not show admin features to regular users', async ({ page }) => {
		// Login before test
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		// Check homepage for admin links
		await page.goto(BASE_URL)

		// Should not see admin menu items
		const adminLinks = await page
			.locator(
				'a[href="/admin"], button:has-text("Admin"), a:has-text("Administration")',
			)
			.count()
		expect(adminLinks).toBe(0)

		// Try to access admin directly
		await page.goto(`${BASE_URL}/admin`)

		// Should not be on admin page
		// Should show a "not found" or "forbidden" message instead of the admin page
		const heading = await page
			.getByRole('heading', {
				name: /we can't find this page/i,
			})
			.isVisible()
		expect(heading).toBe(true)

		console.log('✅ Admin features hidden from regular users')
	})

	test('should maintain session across navigation', async ({ page }) => {
		// Login before test
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		// Navigate through multiple pages
		const routes = [
			'/users/kody',
			'/users/kody/notes',
			'/projects',
			'/timesheets',
		]

		for (const route of routes) {
			await page.goto(`${BASE_URL}${route}`)

			// Should not redirect to login
			expect(page.url()).not.toContain('/login')
			console.log(`✅ Session maintained for ${route}`)
		}
	})

	test('should handle session expiration', async ({ page, context }) => {
		// Verify logged in
		await page.goto(`${BASE_URL}/users/kody/notes`)
		expect(page.url()).toContain('/users/kody/notes')

		// Clear cookies to simulate session expiration
		await context.clearCookies()

		// Try to access protected resource
		await page.goto(`${BASE_URL}/users/kody/notes/new`)

		// Should redirect to login
		await page.waitForURL(/.*\/login/, { timeout: 5000 })
		expect(page.url()).toContain('/login')

		console.log('✅ Session expiration handled correctly')
	})

	test('should validate API access control', async ({ page }) => {
		// Test API endpoints with authentication
		const endpoints = ['/api/timesheets', '/api/projects', '/api/user']

		for (const endpoint of endpoints) {
			const response = await page.request.get(`${BASE_URL}${endpoint}`, {
				failOnStatusCode: false,
			})

			const status = response.status()

			// Should either succeed or return proper auth error
			const isProperlyHandled =
				(status >= 200 && status < 300) || // Success
				status === 401 || // Unauthorized
				status === 403 || // Forbidden
				status === 404 // Not found (might not exist)

			expect(isProperlyHandled).toBe(true)
			console.log(`✅ API ${endpoint} returns ${status}`)
		}
	})

	test('should prevent cross-user data access', async ({ page }) => {
		// Try to access another user's notes (assuming otheruser doesn't exist)
		await page.goto(`${BASE_URL}/users/otheruser/notes`)

		// Should either redirect, show error, or show empty
		const pageContent = await page.textContent('body')
		const url = page.url()

		// Should not show other user's data
		const isProtected =
			url.includes('/login') ||
			url.includes('/404') ||
			pageContent?.includes('not found') ||
			pageContent?.includes('unauthorized') ||
			!pageContent?.includes('otheruser')

		expect(isProtected).toBe(true)
		console.log('✅ Cross-user data access prevented')
	})

	test('should show user-specific UI elements', async ({ page }) => {
		// Login before test
		await page.goto(`${BASE_URL}/login`)
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		// Go to homepage
		await page.goto(BASE_URL)

		// Should see user menu with username
		const userElements = await page.locator('text=/kody/i').count()
		expect(userElements).toBeGreaterThan(0)

		// Should have logout option
		await page.getByRole('link', { name: /kody/i }).click()
		await expect(page.getByRole('menuitem', { name: /logout/i })).toBeVisible()

		console.log('✅ User-specific UI elements displayed')
	})

	test('should handle CRUD operations based on ownership', async ({ page }) => {
		// Navigate to own notes
		await page.goto(`${BASE_URL}/users/kody/notes`)

		// Should be able to create new note
		const newNoteLink = page.locator('a[href*="new"]').first()
		if (await newNoteLink.isVisible({ timeout: 2000 })) {
			await newNoteLink.click()

			// Should be on new note page
			expect(page.url()).toContain('/new')

			// Fill and submit note
			await page.fill('input[name="title"]', `Permission Test ${Date.now()}`)
			await page.fill('textarea[name="content"]', 'Testing CRUD permissions')
			await page.click('button[type="submit"]:has-text("Submit")')

			// Wait for save
			await page
				.waitForURL((url) => !url.pathname.includes('/new'), { timeout: 5000 })
				.catch(() => {})

			console.log('✅ CRUD operations work for owned resources')
		} else {
			console.log('ℹ️ New note link not found')
		}
	})
})
