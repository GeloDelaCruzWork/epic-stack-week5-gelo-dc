# 🎭 Playwright + MSW Testing Fixtures Guide

## 📋 Overview

This guide covers the integration of Playwright with Mock Service Worker (MSW)
for comprehensive E2E testing with API mocking capabilities and custom test
fixtures.

## 🏗️ Test Fixture Architecture

### Authentication Fixture (`auth.fixture.ts`)

```typescript
import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Extend base test with authenticated page
export const test = base.extend<{
	authenticatedPage: Page
}>({
	authenticatedPage: async ({ page }, use) => {
		// Login before each test
		await page.goto('http://localhost:3000/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]:has-text("Log in")')

		// Wait for login to complete
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})

		// Provide authenticated page to test
		await use(page)

		// Cleanup after test (optional)
		// await page.context().clearCookies()
	},
})

export { expect }
```

### Usage in Tests

```typescript
import { test, expect } from '../fixtures/auth.fixture'

test('authenticated user can access protected route', async ({
	authenticatedPage,
}) => {
	const page = authenticatedPage

	// Already logged in, can access protected routes
	await page.goto('/users/kody/notes/new')
	await expect(page).toHaveURL(/.*\/notes\/new/)
})
```

## 🌐 MSW Integration

### MSW Setup (`msw.setup.ts`)

```typescript
import { setupWorker, rest } from 'msw'

// Define mock handlers
export const handlers = [
	// Mock notes API
	rest.get('/api/notes', (req, res, ctx) => {
		return res(
			ctx.status(200),
			ctx.json({
				notes: [
					{ id: '1', title: 'Test Note 1', content: 'Content 1' },
					{ id: '2', title: 'Test Note 2', content: 'Content 2' },
				],
			}),
		)
	}),

	// Mock user API
	rest.get('/api/user/:userId', (req, res, ctx) => {
		const { userId } = req.params
		return res(
			ctx.status(200),
			ctx.json({
				id: userId,
				username: 'kody',
				email: 'kody@epicstack.dev',
			}),
		)
	}),

	// Mock authentication
	rest.post('/api/login', async (req, res, ctx) => {
		const { username, password } = await req.json()

		if (username === 'kody' && password === 'kodylovesyou') {
			return res(
				ctx.status(200),
				ctx.json({ success: true, userId: 'kody123' }),
			)
		}

		return res(ctx.status(401), ctx.json({ error: 'Invalid credentials' }))
	}),
]

// Browser worker for development
export const worker = setupWorker(...handlers)

// Server for Node.js/testing
import { setupServer } from 'msw/node'
export const server = setupServer(...handlers)
```

### Playwright Global Setup with MSW

```typescript
// global-setup.ts
import { server } from './msw.setup'

async function globalSetup() {
	// Start MSW server for tests
	server.listen({
		onUnhandledRequest: 'bypass', // Allow real requests to pass through
	})

	console.log('✅ MSW Server started')

	return async () => {
		server.close()
		console.log('✅ MSW Server closed')
	}
}

export default globalSetup
```

### Playwright Configuration with MSW

```typescript
// playwright.config.ts
export default defineConfig({
	globalSetup: require.resolve('./global-setup.ts'),
	use: {
		// Base URL for all tests
		baseURL: 'http://localhost:3000',

		// Inject MSW into browser context
		contextOptions: {
			// Add any service worker related options
		},
	},
})
```

## 🧩 Advanced Test Fixtures

### Database Fixture

```typescript
export const test = base.extend<{
	dbUser: User
	dbNotes: Note[]
}>({
	dbUser: async ({}, use) => {
		// Create test user in database
		const user = await prisma.user.create({
			data: {
				username: `test-${Date.now()}`,
				email: `test-${Date.now()}@example.com`,
			},
		})

		// Use in test
		await use(user)

		// Cleanup
		await prisma.user.delete({ where: { id: user.id } })
	},

	dbNotes: async ({ dbUser }, use) => {
		// Create test notes
		const notes = await Promise.all([
			prisma.note.create({
				data: {
					title: 'Test Note 1',
					content: 'Content 1',
					ownerId: dbUser.id,
				},
			}),
			prisma.note.create({
				data: {
					title: 'Test Note 2',
					content: 'Content 2',
					ownerId: dbUser.id,
				},
			}),
		])

		// Use in test
		await use(notes)

		// Cleanup
		await prisma.note.deleteMany({
			where: { ownerId: dbUser.id },
		})
	},
})
```

### Page Object Fixture

```typescript
class NotesPage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto('/users/kody/notes')
	}

	async create(title: string, content: string) {
		await this.page.goto('/users/kody/notes/new')
		await this.page.fill('input[name="title"]', title)
		await this.page.fill('textarea[name="content"]', content)
		await this.page.click('button[type="submit"]:has-text("Submit")')
		await this.page.waitForURL((url) => !url.pathname.includes('/new'))
	}
}

export const test = base.extend<{
	notesPage: NotesPage
}>({
	notesPage: async ({ page }, use) => {
		await use(new NotesPage(page))
	},
})
```

## 🔄 API Mocking Patterns

### Dynamic Response Mocking

```typescript
test('mock different responses', async ({ page }) => {
	let callCount = 0

	await page.route('**/api/notes', (route) => {
		callCount++

		if (callCount === 1) {
			// First call returns empty
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ notes: [] }),
			})
		} else {
			// Subsequent calls return data
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					notes: [{ id: '1', title: 'New Note' }],
				}),
			})
		}
	})

	await page.goto('/users/kody/notes')
	// First load shows empty
	await expect(page.locator('text=No notes')).toBeVisible()

	// Refresh to get new data
	await page.reload()
	await expect(page.locator('text=New Note')).toBeVisible()
})
```

### Network Condition Simulation

```typescript
test('handle network errors', async ({ page }) => {
	// Simulate network failure
	await page.route('**/api/**', (route) => {
		route.abort('failed')
	})

	await page.goto('/users/kody/notes')

	// Should show error state
	await expect(page.locator('text=/error|failed/i')).toBeVisible()
})

test('handle slow network', async ({ page }) => {
	// Simulate slow response
	await page.route('**/api/**', async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 3000))
		route.continue()
	})

	await page.goto('/users/kody/notes')

	// Should show loading state
	await expect(page.locator('.spinner, [aria-busy="true"]')).toBeVisible()
})
```

## 🎯 Complete Test Example

```typescript
import { test, expect } from './fixtures/auth.fixture'
import { server } from './msw.setup'
import { rest } from 'msw'

test.describe('Notes CRUD with MSW', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		// Override default MSW handler for this test
		server.use(
			rest.get('/api/notes', (req, res, ctx) => {
				return res(
					ctx.status(200),
					ctx.json({
						notes: [
							{ id: 'mock-1', title: 'Mocked Note', content: 'Mocked content' },
						],
					}),
				)
			}),
		)
	})

	test('should display mocked notes', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		await page.goto('/users/kody/notes')

		// Should see mocked note
		await expect(page.locator('text=Mocked Note')).toBeVisible()
	})

	test('should create note with mocked API', async ({ authenticatedPage }) => {
		const page = authenticatedPage

		// Mock the create endpoint
		server.use(
			rest.post('/api/notes', async (req, res, ctx) => {
				const { title, content } = await req.json()

				return res(
					ctx.status(201),
					ctx.json({
						id: 'new-mock-id',
						title,
						content,
						createdAt: new Date().toISOString(),
					}),
				)
			}),
		)

		// Create note
		await page.goto('/users/kody/notes/new')
		await page.fill('input[name="title"]', 'New Test Note')
		await page.fill('textarea[name="content"]', 'New test content')
		await page.click('button[type="submit"]:has-text("Submit")')

		// Should redirect after creation
		await page.waitForURL((url) => !url.pathname.includes('/new'))

		// Verify note was created
		await expect(page.locator('h2:has-text("New Test Note")')).toBeVisible()
	})
})
```

## 📊 Benefits of Fixtures + MSW

1. **Isolation**: Each test runs in isolation with predictable data
2. **Speed**: No need to hit real APIs or databases
3. **Reliability**: Tests don't fail due to external dependencies
4. **Flexibility**: Easy to test edge cases and error states
5. **Maintainability**: Centralized setup and cleanup logic

## 🚀 Running Tests with Fixtures

```bash
# Run all tests with fixtures
npx playwright test --config=playwright.config.ts

# Run specific fixture tests
npx playwright test tests/with-fixtures --config=playwright.config.ts

# Debug mode with fixtures
$env:PWDEBUG=1; npx playwright test tests/auth-fixture.test.ts
```

## 📝 Best Practices

1. **Keep fixtures focused** - Each fixture should have a single responsibility
2. **Use composition** - Combine fixtures for complex scenarios
3. **Clean up properly** - Always clean up data in fixture teardown
4. **Mock at the right level** - Use MSW for API mocking, fixtures for app state
5. **Document dependencies** - Clear documentation of fixture requirements
6. **Test both success and failure** - Mock various response scenarios

## 🎓 Key Takeaways

- **Fixtures** provide reusable test setup and teardown
- **MSW** enables API mocking without changing application code
- **Combined** they create a powerful, maintainable test infrastructure
- **Epic Stack** works seamlessly with both Playwright and MSW
- **Authentication fixture** eliminates repetitive login code
- **Page objects** encapsulate UI interactions
