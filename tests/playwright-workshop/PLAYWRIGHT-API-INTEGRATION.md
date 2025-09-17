# Playwright API Integration Guide

## Table of Contents

- [Introduction](#introduction)
- [API Testing Fundamentals](#api-testing-fundamentals)
- [Request Context](#request-context)
- [Authentication](#authentication)
- [CRUD Operations](#crud-operations)
- [Mock Service Worker Integration](#mock-service-worker-integration)
- [Network Interception](#network-interception)
- [API Test Patterns](#api-test-patterns)
- [Performance Testing](#performance-testing)
- [Best Practices](#best-practices)

## Introduction

Playwright provides powerful API testing capabilities alongside UI testing,
enabling:

- Direct API endpoint testing
- API mocking for UI tests
- Network interception and modification
- Performance monitoring
- Full end-to-end testing scenarios

### Why API Testing with Playwright?

| Feature            | Benefit                             |
| ------------------ | ----------------------------------- |
| Unified Framework  | Single tool for UI and API testing  |
| Parallel Execution | Fast test execution                 |
| TypeScript Support | Type-safe API testing               |
| Request Context    | Isolated API sessions               |
| Network Control    | Complete control over network layer |

## API Testing Fundamentals

### Basic API Request

```typescript
import { test, expect } from '@playwright/test'

test('basic API request', async ({ request }) => {
	const response = await request.get('/api/notes')

	expect(response.ok()).toBeTruthy()
	expect(response.status()).toBe(200)

	const notes = await response.json()
	expect(Array.isArray(notes)).toBeTruthy()
})
```

### Request Methods

```typescript
test('all HTTP methods', async ({ request }) => {
	// GET
	const getResponse = await request.get('/api/notes/1')

	// POST
	const postResponse = await request.post('/api/notes', {
		data: {
			title: 'New Note',
			content: 'Content',
		},
	})

	// PUT
	const putResponse = await request.put('/api/notes/1', {
		data: {
			title: 'Updated Note',
		},
	})

	// PATCH
	const patchResponse = await request.patch('/api/notes/1', {
		data: {
			status: 'archived',
		},
	})

	// DELETE
	const deleteResponse = await request.delete('/api/notes/1')
})
```

### Headers and Query Parameters

```typescript
test('headers and params', async ({ request }) => {
	const response = await request.get('/api/notes', {
		headers: {
			Authorization: 'Bearer token123',
			'X-Custom-Header': 'value',
		},
		params: {
			page: 1,
			limit: 10,
			sort: 'createdAt',
		},
	})

	expect(response.ok()).toBeTruthy()
})
```

## Request Context

### Creating Custom Context

```typescript
test('custom request context', async ({ playwright }) => {
	const context = await playwright.request.newContext({
		baseURL: 'http://localhost:3000',
		extraHTTPHeaders: {
			Authorization: 'Bearer token123',
		},
	})

	const response = await context.get('/api/notes')
	expect(response.ok()).toBeTruthy()

	await context.dispose()
})
```

### Reusable API Client

```typescript
class APIClient {
	private request: APIRequestContext

	constructor(request: APIRequestContext) {
		this.request = request
	}

	async login(username: string, password: string) {
		const response = await this.request.post('/api/auth/login', {
			data: { username, password },
		})

		const { token } = await response.json()

		// Update headers with token
		this.request = await this.request.newContext({
			extraHTTPHeaders: {
				Authorization: `Bearer ${token}`,
			},
		})

		return token
	}

	async getNotes() {
		const response = await this.request.get('/api/notes')
		return response.json()
	}

	async createNote(title: string, content: string) {
		const response = await this.request.post('/api/notes', {
			data: { title, content },
		})
		return response.json()
	}
}

test('use API client', async ({ request }) => {
	const client = new APIClient(request)
	await client.login('kody', 'kodylovesyou')

	const notes = await client.getNotes()
	expect(notes).toHaveLength(0)

	const newNote = await client.createNote('Test', 'Content')
	expect(newNote.title).toBe('Test')
})
```

## Authentication

### Token-Based Auth

```typescript
test.describe('API with authentication', () => {
	let authToken: string

	test.beforeAll(async ({ request }) => {
		const response = await request.post('/api/auth/login', {
			data: {
				username: 'kody',
				password: 'kodylovesyou',
			},
		})

		const data = await response.json()
		authToken = data.token
	})

	test('authenticated request', async ({ request }) => {
		const response = await request.get('/api/protected/data', {
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		})

		expect(response.ok()).toBeTruthy()
	})
})
```

### Cookie-Based Auth

```typescript
test('cookie authentication', async ({ request }) => {
	// Login to get session cookie
	const loginResponse = await request.post('/api/auth/login', {
		data: {
			username: 'kody',
			password: 'kodylovesyou',
		},
	})

	// Extract cookies
	const cookies = loginResponse.headers()['set-cookie']

	// Use cookies in subsequent requests
	const response = await request.get('/api/protected/data', {
		headers: {
			Cookie: cookies,
		},
	})

	expect(response.ok()).toBeTruthy()
})
```

### OAuth Flow

```typescript
test('OAuth authentication', async ({ request }) => {
	// Step 1: Get authorization code
	const authResponse = await request.get('/api/oauth/authorize', {
		params: {
			client_id: 'test-client',
			redirect_uri: 'http://localhost:3000/callback',
			response_type: 'code',
		},
	})

	const authCode = new URL(authResponse.url()).searchParams.get('code')

	// Step 2: Exchange code for token
	const tokenResponse = await request.post('/api/oauth/token', {
		data: {
			grant_type: 'authorization_code',
			code: authCode,
			client_id: 'test-client',
			client_secret: 'test-secret',
		},
	})

	const { access_token } = await tokenResponse.json()

	// Step 3: Use token
	const dataResponse = await request.get('/api/user/profile', {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})

	expect(dataResponse.ok()).toBeTruthy()
})
```

## CRUD Operations

### Complete CRUD Test Suite

```typescript
test.describe('Notes CRUD API', () => {
	let noteId: string

	test('Create note', async ({ request }) => {
		const response = await request.post('/api/notes', {
			data: {
				title: 'Test Note',
				content: 'Test Content',
				tags: ['test', 'api'],
			},
		})

		expect(response.status()).toBe(201)

		const note = await response.json()
		expect(note).toMatchObject({
			title: 'Test Note',
			content: 'Test Content',
			tags: ['test', 'api'],
		})

		noteId = note.id
	})

	test('Read note', async ({ request }) => {
		const response = await request.get(`/api/notes/${noteId}`)

		expect(response.status()).toBe(200)

		const note = await response.json()
		expect(note.id).toBe(noteId)
		expect(note.title).toBe('Test Note')
	})

	test('Update note', async ({ request }) => {
		const response = await request.put(`/api/notes/${noteId}`, {
			data: {
				title: 'Updated Note',
				content: 'Updated Content',
			},
		})

		expect(response.status()).toBe(200)

		const note = await response.json()
		expect(note.title).toBe('Updated Note')
		expect(note.content).toBe('Updated Content')
	})

	test('List notes', async ({ request }) => {
		const response = await request.get('/api/notes', {
			params: {
				page: 1,
				limit: 10,
			},
		})

		expect(response.status()).toBe(200)

		const data = await response.json()
		expect(data).toHaveProperty('notes')
		expect(data).toHaveProperty('total')
		expect(data).toHaveProperty('page')

		const ourNote = data.notes.find((n: any) => n.id === noteId)
		expect(ourNote).toBeDefined()
	})

	test('Delete note', async ({ request }) => {
		const response = await request.delete(`/api/notes/${noteId}`)

		expect(response.status()).toBe(204)

		// Verify deletion
		const getResponse = await request.get(`/api/notes/${noteId}`)
		expect(getResponse.status()).toBe(404)
	})
})
```

### Batch Operations

```typescript
test('batch operations', async ({ request }) => {
	// Create multiple notes
	const notes = await Promise.all([
		request.post('/api/notes', { data: { title: 'Note 1' } }),
		request.post('/api/notes', { data: { title: 'Note 2' } }),
		request.post('/api/notes', { data: { title: 'Note 3' } }),
	])

	const noteIds = await Promise.all(
		notes.map((r) => r.json().then((n) => n.id)),
	)

	// Batch update
	const batchResponse = await request.patch('/api/notes/batch', {
		data: {
			ids: noteIds,
			update: { status: 'archived' },
		},
	})

	expect(batchResponse.status()).toBe(200)

	// Batch delete
	const deleteResponse = await request.delete('/api/notes/batch', {
		data: { ids: noteIds },
	})

	expect(deleteResponse.status()).toBe(204)
})
```

## Mock Service Worker Integration

### Setting Up MSW

```typescript
import { setupWorker, rest } from 'msw'

const worker = setupWorker(
	rest.get('/api/notes', (req, res, ctx) => {
		return res(
			ctx.status(200),
			ctx.json([
				{ id: '1', title: 'Mocked Note 1' },
				{ id: '2', title: 'Mocked Note 2' },
			]),
		)
	}),

	rest.post('/api/notes', (req, res, ctx) => {
		return res(
			ctx.status(201),
			ctx.json({
				id: '3',
				...req.body,
			}),
		)
	}),
)

// In tests
test.beforeAll(async () => {
	await worker.start()
})

test.afterAll(async () => {
	await worker.stop()
})
```

### Dynamic Mocking

```typescript
test('dynamic API mocking', async ({ page }) => {
	// Mock different responses based on test needs
	await page.route('**/api/notes', (route, request) => {
		if (request.method() === 'GET') {
			route.fulfill({
				status: 200,
				body: JSON.stringify([{ id: '1', title: 'Test Note' }]),
			})
		} else if (request.method() === 'POST') {
			const postData = request.postDataJSON()
			route.fulfill({
				status: 201,
				body: JSON.stringify({
					id: Date.now().toString(),
					...postData,
				}),
			})
		}
	})

	await page.goto('/notes')
	await expect(page.locator('text=Test Note')).toBeVisible()
})
```

## Network Interception

### Request Interception

```typescript
test('intercept and modify requests', async ({ page }) => {
	await page.route('**/api/**', async (route) => {
		const request = route.request()

		// Log request
		console.log(`${request.method()} ${request.url()}`)

		// Modify headers
		const headers = {
			...request.headers(),
			'X-Test-Header': 'test-value',
		}

		// Continue with modified request
		await route.continue({ headers })
	})

	await page.goto('/')
})
```

### Response Modification

```typescript
test('modify API responses', async ({ page }) => {
	await page.route('**/api/notes', async (route) => {
		// Get original response
		const response = await route.fetch()
		const json = await response.json()

		// Modify response
		json.push({
			id: 'injected',
			title: 'Injected Note',
		})

		// Return modified response
		await route.fulfill({
			response,
			json,
		})
	})

	await page.goto('/notes')
	await expect(page.locator('text=Injected Note')).toBeVisible()
})
```

### Network Conditions

```typescript
test('simulate network conditions', async ({ page }) => {
	// Simulate slow network
	await page.route('**/api/**', async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 2000))
		await route.continue()
	})

	// Simulate network failure
	await page.route('**/api/critical', (route) => {
		route.abort('failed')
	})

	// Simulate offline
	await page.context().setOffline(true)

	await page.goto('/')

	// Test error handling
	await expect(page.locator('.error-message')).toBeVisible()
})
```

## API Test Patterns

### Data-Driven Testing

```typescript
const testData = [
	{ title: 'Note 1', content: 'Content 1', expectedStatus: 201 },
	{ title: '', content: 'Content 2', expectedStatus: 400 },
	{ title: 'Note 3', content: '', expectedStatus: 400 },
]

testData.forEach(({ title, content, expectedStatus }) => {
	test(`create note with title="${title}"`, async ({ request }) => {
		const response = await request.post('/api/notes', {
			data: { title, content },
		})

		expect(response.status()).toBe(expectedStatus)
	})
})
```

### Schema Validation

```typescript
import Joi from 'joi'

const noteSchema = Joi.object({
	id: Joi.string().required(),
	title: Joi.string().required(),
	content: Joi.string().required(),
	createdAt: Joi.date().iso().required(),
	updatedAt: Joi.date().iso().required(),
})

test('validate API response schema', async ({ request }) => {
	const response = await request.get('/api/notes/1')
	const note = await response.json()

	const { error } = noteSchema.validate(note)
	expect(error).toBeUndefined()
})
```

### Error Handling

```typescript
test.describe('API error handling', () => {
	test('404 for non-existent resource', async ({ request }) => {
		const response = await request.get('/api/notes/non-existent')

		expect(response.status()).toBe(404)

		const error = await response.json()
		expect(error).toHaveProperty('message')
		expect(error.message).toContain('not found')
	})

	test('400 for invalid data', async ({ request }) => {
		const response = await request.post('/api/notes', {
			data: {
				// Missing required fields
			},
		})

		expect(response.status()).toBe(400)

		const error = await response.json()
		expect(error).toHaveProperty('errors')
	})

	test('401 for unauthorized', async ({ request }) => {
		const response = await request.get('/api/protected')

		expect(response.status()).toBe(401)
	})

	test('429 for rate limiting', async ({ request }) => {
		// Make many requests quickly
		const requests = Array(100)
			.fill(null)
			.map(() => request.get('/api/rate-limited'))

		const responses = await Promise.all(requests)

		// Some should be rate limited
		const rateLimited = responses.filter((r) => r.status() === 429)
		expect(rateLimited.length).toBeGreaterThan(0)
	})
})
```

## Performance Testing

### Response Time Monitoring

```typescript
test('API performance', async ({ request }) => {
	const startTime = Date.now()

	const response = await request.get('/api/notes')

	const responseTime = Date.now() - startTime

	expect(response.status()).toBe(200)
	expect(responseTime).toBeLessThan(1000) // Under 1 second

	// Check server timing header
	const serverTiming = response.headers()['server-timing']
	if (serverTiming) {
		console.log('Server timing:', serverTiming)
	}
})
```

### Load Testing

```typescript
test('concurrent API requests', async ({ request }) => {
	const concurrentRequests = 10

	const requests = Array(concurrentRequests)
		.fill(null)
		.map((_, i) =>
			request.post('/api/notes', {
				data: {
					title: `Note ${i}`,
					content: `Content ${i}`,
				},
			}),
		)

	const startTime = Date.now()
	const responses = await Promise.all(requests)
	const totalTime = Date.now() - startTime

	// All should succeed
	responses.forEach((response) => {
		expect(response.status()).toBe(201)
	})

	// Should handle concurrent requests efficiently
	expect(totalTime).toBeLessThan(5000)

	console.log(`Handled ${concurrentRequests} requests in ${totalTime}ms`)
})
```

### Stress Testing

```typescript
test('API stress test', async ({ request }) => {
	const iterations = 100
	const results = {
		success: 0,
		failure: 0,
		times: [] as number[],
	}

	for (let i = 0; i < iterations; i++) {
		const startTime = Date.now()

		try {
			const response = await request.get('/api/notes')

			if (response.ok()) {
				results.success++
			} else {
				results.failure++
			}

			results.times.push(Date.now() - startTime)
		} catch (error) {
			results.failure++
		}
	}

	// Calculate statistics
	const avgTime =
		results.times.reduce((a, b) => a + b, 0) / results.times.length
	const maxTime = Math.max(...results.times)
	const minTime = Math.min(...results.times)

	console.log('Stress test results:', {
		success: results.success,
		failure: results.failure,
		avgTime,
		maxTime,
		minTime,
	})

	// Assert acceptable performance
	expect(results.success / iterations).toBeGreaterThan(0.95) // 95% success rate
	expect(avgTime).toBeLessThan(500) // Average under 500ms
})
```

## Best Practices

### 1. Test Organization

```typescript
// Group related API tests
test.describe('User API', () => {
	test.describe('Authentication', () => {
		test('login', async ({ request }) => {
			/* ... */
		})
		test('logout', async ({ request }) => {
			/* ... */
		})
	})

	test.describe('Profile', () => {
		test('get profile', async ({ request }) => {
			/* ... */
		})
		test('update profile', async ({ request }) => {
			/* ... */
		})
	})
})
```

### 2. Reusable Helpers

```typescript
class APIHelpers {
	static async createAuthenticatedContext(playwright: any) {
		const context = await playwright.request.newContext({
			baseURL: 'http://localhost:3000',
		})

		const loginResponse = await context.post('/api/auth/login', {
			data: {
				username: 'kody',
				password: 'kodylovesyou',
			},
		})

		const { token } = await loginResponse.json()

		return playwright.request.newContext({
			baseURL: 'http://localhost:3000',
			extraHTTPHeaders: {
				Authorization: `Bearer ${token}`,
			},
		})
	}

	static async waitForEventualConsistency(
		request: APIRequestContext,
		endpoint: string,
		expectedValue: any,
		maxAttempts = 10,
	) {
		for (let i = 0; i < maxAttempts; i++) {
			const response = await request.get(endpoint)
			const data = await response.json()

			if (JSON.stringify(data) === JSON.stringify(expectedValue)) {
				return true
			}

			await new Promise((resolve) => setTimeout(resolve, 1000))
		}

		return false
	}
}
```

### 3. Environment Configuration

```typescript
const config = {
	development: {
		baseURL: 'http://localhost:3000',
		timeout: 10000,
	},
	staging: {
		baseURL: 'https://staging.example.com',
		timeout: 30000,
	},
	production: {
		baseURL: 'https://api.example.com',
		timeout: 30000,
	},
}

const env = process.env.TEST_ENV || 'development'
const apiConfig = config[env]

test.use({
	baseURL: apiConfig.baseURL,
	extraHTTPHeaders: {
		'X-Test-Environment': env,
	},
})
```

### 4. Error Handling

```typescript
async function apiRequest(
	request: APIRequestContext,
	method: string,
	endpoint: string,
	options?: any,
) {
	try {
		const response = await request[method](endpoint, options)

		if (!response.ok()) {
			const error = await response.text()
			throw new Error(`API Error: ${response.status()} - ${error}`)
		}

		return response
	} catch (error) {
		console.error(`API Request Failed: ${method} ${endpoint}`, error)
		throw error
	}
}
```

### 5. Test Data Management

```typescript
class TestDataManager {
	private createdIds: string[] = []

	async createNote(request: APIRequestContext, data: any) {
		const response = await request.post('/api/notes', { data })
		const note = await response.json()
		this.createdIds.push(note.id)
		return note
	}

	async cleanup(request: APIRequestContext) {
		await Promise.all(
			this.createdIds.map((id) =>
				request.delete(`/api/notes/${id}`).catch(() => {}),
			),
		)

		this.createdIds = []
	}
}

test.describe('with test data', () => {
	const testData = new TestDataManager()

	test.afterEach(async ({ request }) => {
		await testData.cleanup(request)
	})

	test('test with managed data', async ({ request }) => {
		const note = await testData.createNote(request, {
			title: 'Test Note',
		})

		// Test with note
		// Cleanup happens automatically
	})
})
```

## Conclusion

Playwright's API testing capabilities provide a comprehensive solution for:

- Direct API endpoint testing
- Integration with UI tests
- Network control and mocking
- Performance monitoring
- Complete end-to-end scenarios

Key advantages:

- **Unified Framework**: Single tool for all testing needs
- **TypeScript Support**: Type-safe API interactions
- **Parallel Execution**: Fast test runs
- **Network Control**: Complete control over requests/responses
- **Easy Integration**: Works seamlessly with existing Playwright tests

By following these patterns and best practices, you can build robust API test
suites that ensure your application's backend reliability and performance.
