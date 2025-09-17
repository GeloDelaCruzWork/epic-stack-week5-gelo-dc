# Playwright Fixtures Deep Dive

## Table of Contents

- [Introduction](#introduction)
- [Core Concepts](#core-concepts)
- [Built-in Fixtures](#built-in-fixtures)
- [Custom Fixtures](#custom-fixtures)
- [Authentication Fixtures](#authentication-fixtures)
- [Data Fixtures](#data-fixtures)
- [Page Object Fixtures](#page-object-fixtures)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Introduction

Playwright fixtures are a powerful testing pattern that provides:

- **Isolation**: Each test gets fresh instances
- **Reusability**: Share common setup across tests
- **Composability**: Combine fixtures to build complex scenarios
- **Automatic cleanup**: Resources are cleaned up after tests
- **Type safety**: Full TypeScript support

### Fixtures vs Hooks

| Aspect               | Fixtures                  | Hooks (beforeEach/afterEach) |
| -------------------- | ------------------------- | ---------------------------- |
| Scope                | Per test                  | Per describe block           |
| Composability        | ✅ Can extend and combine | ❌ Limited                   |
| Type Safety          | ✅ Full TypeScript        | ⚠️ Partial                   |
| Lazy Loading         | ✅ Only when used         | ❌ Always runs               |
| Dependency Injection | ✅ Automatic              | ❌ Manual                    |

## Core Concepts

### Fixture Definition

```typescript
import { test as base } from '@playwright/test'

// Extend the base test with custom fixtures
export const test = base.extend<{
	customFixture: string
}>({
	customFixture: async ({}, use) => {
		// Setup
		const value = 'fixture value'

		// Provide to test
		await use(value)

		// Cleanup (automatic)
	},
})
```

### Fixture Lifecycle

1. **Creation**: When test requests it
2. **Setup**: Before `use()`
3. **Usage**: During test execution
4. **Teardown**: After `use()` returns

## Built-in Fixtures

### Page Fixture

```typescript
test('uses page fixture', async ({ page }) => {
	// Fresh page instance for each test
	await page.goto('/')
	await expect(page).toHaveTitle('Epic Stack')
})
```

### Context Fixture

```typescript
test('uses context', async ({ context }) => {
	// Browser context for cookies, localStorage
	await context.addCookies([
		{ name: 'session', value: 'abc123', url: 'http://localhost:3000' },
	])

	const page = await context.newPage()
	await page.goto('/')
})
```

### Browser Fixture

```typescript
test('uses browser', async ({ browser }) => {
	// Multiple contexts for multi-user testing
	const context1 = await browser.newContext()
	const context2 = await browser.newContext()

	const page1 = await context1.newPage()
	const page2 = await context2.newPage()
})
```

### Request Fixture

```typescript
test('API testing', async ({ request }) => {
	const response = await request.post('/api/notes', {
		data: {
			title: 'Test Note',
			content: 'Content',
		},
	})

	expect(response.ok()).toBeTruthy()
})
```

## Custom Fixtures

### Basic Custom Fixture

```typescript
type MyFixtures = {
	todoPage: Page
}

const test = base.extend<MyFixtures>({
	todoPage: async ({ page }, use) => {
		await page.goto('/todos')
		await use(page)
	},
})

test('todo test', async ({ todoPage }) => {
	// Already on /todos page
	await todoPage.fill('#new-todo', 'Task')
})
```

### Parameterized Fixtures

```typescript
type TestOptions = {
	defaultUser: 'admin' | 'user' | 'guest'
}

const test = base.extend<{}, TestOptions>({
	defaultUser: ['user', { option: true }],

	authenticatedPage: async ({ page, defaultUser }, use) => {
		const credentials = {
			admin: { username: 'admin', password: 'admin123' },
			user: { username: 'kody', password: 'kodylovesyou' },
			guest: { username: 'guest', password: 'guest123' },
		}

		await page.goto('/login')
		const creds = credentials[defaultUser]
		await page.fill('#username', creds.username)
		await page.fill('#password', creds.password)
		await page.click('button[type="submit"]')

		await use(page)
	},
})

// Use with different users
test.use({ defaultUser: 'admin' })
test('admin test', async ({ authenticatedPage }) => {
	// Logged in as admin
})
```

## Authentication Fixtures

### Simple Auth Fixture

```typescript
const test = base.extend({
	authenticatedPage: async ({ page }, use) => {
		// Login
		await page.goto('/login')
		await page.fill('#username', 'kody')
		await page.fill('#password', 'kodylovesyou')
		await page.click('button[type="submit"]')
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		// Provide authenticated page
		await use(page)

		// Logout automatically
		await page.goto('/logout')
	},
})
```

### Session Storage Fixture

```typescript
const test = base.extend({
	storageState: async ({}, use) => {
		// Load saved auth state
		const authFile = 'playwright/.auth/user.json'
		await use(authFile)
	},

	authenticatedContext: async ({ browser, storageState }, use) => {
		const context = await browser.newContext({ storageState })
		await use(context)
		await context.close()
	},
})

// Save auth state once
test('authenticate and save', async ({ page }) => {
	await page.goto('/login')
	await page.fill('#username', 'kody')
	await page.fill('#password', 'kodylovesyou')
	await page.click('button[type="submit"]')

	// Save auth state
	await page.context().storageState({ path: 'playwright/.auth/user.json' })
})

// Reuse in all tests
test('uses saved auth', async ({ authenticatedContext }) => {
	const page = await authenticatedContext.newPage()
	await page.goto('/notes')
	// Already authenticated
})
```

### Multi-User Auth Fixture

```typescript
type Users = {
	adminPage: Page
	userPage: Page
	guestPage: Page
}

const test = base.extend<Users>({
	adminPage: async ({ browser }, use) => {
		const context = await browser.newContext()
		const page = await context.newPage()
		await loginAs(page, 'admin', 'admin123')
		await use(page)
		await context.close()
	},

	userPage: async ({ browser }, use) => {
		const context = await browser.newContext()
		const page = await context.newPage()
		await loginAs(page, 'kody', 'kodylovesyou')
		await use(page)
		await context.close()
	},

	guestPage: async ({ browser }, use) => {
		const context = await browser.newContext()
		const page = await context.newPage()
		// No login for guest
		await use(page)
		await context.close()
	},
})

test('multi-user collaboration', async ({ adminPage, userPage }) => {
	// Admin creates note
	await adminPage.goto('/notes/new')
	await adminPage.fill('#title', 'Admin Note')
	await adminPage.click('button[type="submit"]')

	// User views note
	await userPage.goto('/notes')
	await expect(userPage.locator('text=Admin Note')).toBeVisible()
})
```

## Data Fixtures

### Test Data Generation

```typescript
import { faker } from '@faker-js/faker'

type TestData = {
	testUser: {
		email: string
		username: string
		password: string
	}
	testNote: {
		title: string
		content: string
	}
}

const test = base.extend<TestData>({
	testUser: async ({}, use) => {
		const user = {
			email: faker.internet.email(),
			username: faker.internet.userName(),
			password: 'SecurePass123!',
		}
		await use(user)
	},

	testNote: async ({}, use) => {
		const note = {
			title: faker.lorem.sentence(),
			content: faker.lorem.paragraphs(3),
		}
		await use(note)
	},
})

test('create user and note', async ({ page, testUser, testNote }) => {
	// Use generated test data
	await page.goto('/signup')
	await page.fill('#email', testUser.email)
	await page.fill('#username', testUser.username)
	await page.fill('#password', testUser.password)
})
```

### Database Fixtures

```typescript
import { PrismaClient } from '@prisma/client'

const test = base.extend({
	dbUser: async ({}, use) => {
		const prisma = new PrismaClient()

		// Create test user in database
		const user = await prisma.user.create({
			data: {
				email: 'test@example.com',
				username: 'testuser',
				password: { create: { hash: 'hashed_password' } },
			},
		})

		// Provide to test
		await use(user)

		// Cleanup
		await prisma.user.delete({ where: { id: user.id } })
		await prisma.$disconnect()
	},
})
```

### API Data Fixtures

```typescript
const test = base.extend({
	apiNote: async ({ request }, use) => {
		// Create via API
		const response = await request.post('/api/notes', {
			data: {
				title: 'API Test Note',
				content: 'Created via fixture',
			},
		})

		const note = await response.json()

		// Provide to test
		await use(note)

		// Cleanup via API
		await request.delete(`/api/notes/${note.id}`)
	},
})
```

## Page Object Fixtures

### Basic Page Objects

```typescript
class LoginPage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto('/login')
	}

	async login(username: string, password: string) {
		await this.page.fill('#username', username)
		await this.page.fill('#password', password)
		await this.page.click('button[type="submit"]')
	}
}

class NotesPage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto('/notes')
	}

	async createNote(title: string, content: string) {
		await this.page.click('text=New Note')
		await this.page.fill('#title', title)
		await this.page.fill('#content', content)
		await this.page.click('button[type="submit"]')
	}
}

const test = base.extend<{
	loginPage: LoginPage
	notesPage: NotesPage
}>({
	loginPage: async ({ page }, use) => {
		await use(new LoginPage(page))
	},

	notesPage: async ({ page }, use) => {
		await use(new NotesPage(page))
	},
})

test('login and create note', async ({ loginPage, notesPage }) => {
	await loginPage.goto()
	await loginPage.login('kody', 'kodylovesyou')

	await notesPage.goto()
	await notesPage.createNote('Test', 'Content')
})
```

### Composed Page Objects

```typescript
const test = base.extend<{
	app: {
		login: LoginPage
		notes: NotesPage
		profile: ProfilePage
	}
}>({
	app: async ({ page }, use) => {
		const app = {
			login: new LoginPage(page),
			notes: new NotesPage(page),
			profile: new ProfilePage(page),
		}

		await use(app)
	},
})

test('complete flow', async ({ app }) => {
	await app.login.goto()
	await app.login.login('kody', 'kodylovesyou')

	await app.notes.createNote('Title', 'Content')

	await app.profile.updateName('New Name')
})
```

## Advanced Patterns

### Fixture Dependencies

```typescript
const test = base.extend({
	server: async ({}, use) => {
		// Start test server
		const server = await startTestServer()
		await use(server)
		await server.close()
	},

	apiClient: async ({ server }, use) => {
		// Depends on server fixture
		const client = new ApiClient(server.url)
		await use(client)
	},

	authenticatedClient: async ({ apiClient }, use) => {
		// Depends on apiClient
		await apiClient.login('admin', 'admin123')
		await use(apiClient)
	},
})
```

### Worker Fixtures

```typescript
const test = base.extend<{}, { testServer: Server }>({
	testServer: [
		async ({}, use) => {
			// Shared across all tests in worker
			const server = await startServer()
			await use(server)
			await server.close()
		},
		{ scope: 'worker' },
	],
})
```

### Conditional Fixtures

```typescript
const test = base.extend({
	conditionalAuth: async ({ page }, use, testInfo) => {
		// Only authenticate for certain tests
		if (testInfo.title.includes('authenticated')) {
			await page.goto('/login')
			await page.fill('#username', 'kody')
			await page.fill('#password', 'kodylovesyou')
			await page.click('button[type="submit"]')
		}

		await use(page)
	},
})
```

### Fixture with Retries

```typescript
const test = base.extend({
	resilientPage: async ({ page }, use, testInfo) => {
		// Add retry logic to page
		const resilientPage = Object.create(page)

		resilientPage.clickWithRetry = async (selector: string) => {
			for (let i = 0; i < 3; i++) {
				try {
					await page.click(selector)
					return
				} catch (e) {
					if (i === 2) throw e
					await page.waitForTimeout(1000)
				}
			}
		}

		await use(resilientPage)
	},
})
```

### Parallel Safe Fixtures

```typescript
const test = base.extend({
	uniqueUser: async ({}, use, testInfo) => {
		// Unique user per test for parallel execution
		const userId = `user_${testInfo.workerIndex}_${Date.now()}`
		const user = {
			username: userId,
			email: `${userId}@test.com`,
			password: 'TestPass123!',
		}

		// Create user
		await createTestUser(user)

		await use(user)

		// Cleanup
		await deleteTestUser(user.username)
	},
})
```

## Best Practices

### 1. Keep Fixtures Focused

```typescript
// Good - Single responsibility
const test = base.extend({
	authenticatedPage: async ({ page }, use) => {
		await loginUser(page)
		await use(page)
	},
})

// Bad - Doing too much
const test = base.extend({
	setupEverything: async ({ page }, use) => {
		await loginUser(page)
		await createTestData()
		await setupMocks()
		await configureSettings()
		await use(page)
	},
})
```

### 2. Use Composition

```typescript
// Compose fixtures for complex scenarios
const test = base.extend({
	apiClient: async ({}, use) => {
		await use(new ApiClient())
	},

	authenticatedApi: async ({ apiClient }, use) => {
		await apiClient.login()
		await use(apiClient)
	},

	testDataWithApi: async ({ authenticatedApi }, use) => {
		const data = await authenticatedApi.createTestData()
		await use(data)
		await authenticatedApi.deleteTestData(data.id)
	},
})
```

### 3. Fixture Naming Conventions

```typescript
const test = base.extend({
	// Pages
	loginPage: async ({ page }, use) => {
		/* ... */
	},

	// Authenticated states
	authenticatedPage: async ({ page }, use) => {
		/* ... */
	},

	// Test data
	testUser: async ({}, use) => {
		/* ... */
	},

	// External services
	apiClient: async ({}, use) => {
		/* ... */
	},
})
```

### 4. Cleanup Patterns

```typescript
const test = base.extend({
	testResource: async ({}, use) => {
		const resource = await createResource()

		try {
			await use(resource)
		} finally {
			// Always cleanup, even on test failure
			await cleanupResource(resource)
		}
	},
})
```

### 5. Type Safety

```typescript
// Define fixture types
type MyFixtures = {
	testUser: User
	testNote: Note
	apiClient: ApiClient
}

// Extend with types
const test = base.extend<MyFixtures>({
	testUser: async ({}, use) => {
		const user: User = await createUser()
		await use(user)
	},
})
```

## Troubleshooting

### Common Issues

#### 1. Fixture Not Available

```typescript
// Error: fixture "customFixture" is not defined

// Solution: Ensure fixture is defined and imported
import { test } from './fixtures'
```

#### 2. Circular Dependencies

```typescript
// Error: Circular dependency between fixtures

// Bad
const test = base.extend({
	fixture1: async ({ fixture2 }, use) => {
		/* ... */
	},
	fixture2: async ({ fixture1 }, use) => {
		/* ... */
	},
})

// Good - Break circular dependency
const test = base.extend({
	baseFixture: async ({}, use) => {
		/* ... */
	},
	fixture1: async ({ baseFixture }, use) => {
		/* ... */
	},
	fixture2: async ({ baseFixture }, use) => {
		/* ... */
	},
})
```

#### 3. Fixture Cleanup Not Running

```typescript
// Ensure cleanup runs even on failure
const test = base.extend({
	resource: async ({}, use) => {
		const resource = await create()

		try {
			await use(resource)
		} finally {
			// This always runs
			await cleanup(resource)
		}
	},
})
```

#### 4. Parallel Execution Conflicts

```typescript
// Use unique identifiers for parallel safety
const test = base.extend({
	isolatedData: async ({}, use, testInfo) => {
		const id = `${testInfo.workerIndex}_${Date.now()}`
		const data = await createData(id)
		await use(data)
		await deleteData(id)
	},
})
```

#### 5. Storage State Issues

```typescript
// Ensure storage state path exists
import { mkdir } from 'fs/promises'

const test = base.extend({
	storageState: async ({}, use) => {
		await mkdir('playwright/.auth', { recursive: true })
		await use('playwright/.auth/user.json')
	},
})
```

## Performance Optimization

### Lazy Loading

```typescript
const test = base.extend({
	// Only created when used
	expensiveResource: async ({}, use) => {
		console.log('Creating expensive resource')
		const resource = await createExpensiveResource()
		await use(resource)
	},
})

test('test without resource', async ({ page }) => {
	// expensiveResource not created
})

test('test with resource', async ({ expensiveResource }) => {
	// expensiveResource created only for this test
})
```

### Worker Scoped Fixtures

```typescript
// Share expensive setup across tests in same worker
const test = base.extend<{}, { sharedDb: Database }>({
	sharedDb: [
		async ({}, use) => {
			const db = await setupDatabase()
			await use(db)
			await db.close()
		},
		{ scope: 'worker' },
	],
})
```

### Caching

```typescript
const cache = new Map()

const test = base.extend({
	cachedData: async ({}, use) => {
		const key = 'test-data'

		if (!cache.has(key)) {
			cache.set(key, await fetchExpensiveData())
		}

		await use(cache.get(key))
	},
})
```

## Integration Examples

### With CI/CD

```typescript
const test = base.extend({
	ciConfig: async ({}, use) => {
		const config = {
			baseURL: process.env.CI
				? 'https://staging.example.com'
				: 'http://localhost:3000',
			apiKey: process.env.API_KEY || 'dev-key',
			headless: !!process.env.CI,
		}

		await use(config)
	},
})
```

### With External Services

```typescript
const test = base.extend({
	mockServer: async ({}, use) => {
		const server = await createMockServer()
		await use(server)
		await server.stop()
	},

	emailService: async ({ mockServer }, use) => {
		const service = new EmailService(mockServer.url)
		await use(service)
	},
})
```

## Conclusion

Playwright fixtures provide a powerful, composable, and type-safe way to manage
test setup and teardown. Key benefits:

- **Isolation**: Each test gets fresh instances
- **Reusability**: Share setup across tests
- **Composability**: Build complex scenarios from simple fixtures
- **Type Safety**: Full TypeScript support
- **Automatic Cleanup**: Resources cleaned up automatically

By following the patterns and best practices in this guide, you can create
maintainable, reliable, and efficient test suites that scale with your
application.
