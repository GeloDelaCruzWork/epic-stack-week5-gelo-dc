# Playwright E2E Testing Best Practices

## 1. Test Structure & Organization

### ✅ DO: Use Descriptive Test Names

```typescript
// Good
test('user can reset password via email link', async ({ page }) => {})

// Bad
test('test password', async ({ page }) => {})
```

### ✅ DO: Group Related Tests

```typescript
test.describe('Shopping Cart', () => {
	test.describe('Adding Items', () => {
		test('can add single item', async ({ page }) => {})
		test('can add multiple items', async ({ page }) => {})
	})

	test.describe('Removing Items', () => {
		test('can remove single item', async ({ page }) => {})
		test('can clear entire cart', async ({ page }) => {})
	})
})
```

### ❌ DON'T: Create Test Dependencies

```typescript
// Bad - Tests depend on each other
test('create user', async ({ page }) => {
	// Creates user that next test needs
})

test('login with created user', async ({ page }) => {
	// Fails if previous test didn't run
})

// Good - Independent tests
test('complete user flow', async ({ page }) => {
	// Create user
	// Login with that user
	// All in one test
})
```

## 2. Selector Strategies

### Priority Order (Best to Worst)

1. **User-facing attributes**: `getByRole()`, `getByLabel()`,
   `getByPlaceholder()`, `getByText()`
2. **Test IDs**: `getByTestId()`
3. **CSS/XPath**: Last resort only

### ✅ DO: Use Semantic Selectors

```typescript
// Best - Uses accessible role
await page.getByRole('button', { name: 'Submit' }).click()

// Good - Uses label association
await page.getByLabel('Email Address').fill('test@example.com')

// Good - Uses visible text
await page.getByText('Welcome back').click()

// Acceptable - Test ID when needed
await page.getByTestId('user-menu').click()
```

### ❌ DON'T: Use Fragile Selectors

```typescript
// Bad - Class names can change
await page.click('.btn-primary-2')

// Bad - DOM structure dependent
await page.click('div > div > button:nth-child(3)')

// Bad - Auto-generated IDs
await page.click('#__next_id_12345')
```

## 3. Waiting & Synchronization

### ✅ DO: Use Auto-waiting

```typescript
// Good - Playwright auto-waits for element
await page.getByRole('button', { name: 'Submit' }).click()

// Good - Wait for specific condition
await expect(page.getByText('Loading')).toBeHidden()
await expect(page.getByRole('alert')).toBeVisible()
```

### ❌ DON'T: Use Fixed Timeouts

```typescript
// Bad - Arbitrary wait time
await page.waitForTimeout(5000)

// Bad - May be too short or too long
await new Promise((resolve) => setTimeout(resolve, 3000))
```

### ✅ DO: Wait for Specific Conditions

```typescript
// Wait for navigation
await page.waitForURL('/dashboard')

// Wait for network idle
await page.waitForLoadState('networkidle')

// Wait for specific response
await page.waitForResponse(
	(response) =>
		response.url().includes('/api/data') && response.status() === 200,
)
```

## 4. Test Data Management

### ✅ DO: Create Fresh Test Data

```typescript
test('user workflow', async ({ page }) => {
	// Create unique test data
	const uniqueEmail = `test-${Date.now()}@example.com`
	const testUser = {
		email: uniqueEmail,
		username: `user_${Date.now()}`,
		password: 'TestPass123!',
	}

	// Use the test data
	await createUser(testUser)

	// Clean up in afterEach or at test end
})
```

### ✅ DO: Use Fixtures for Common Data

```typescript
// fixtures/user.ts
export const testUser = {
	email: 'test@example.com',
	password: 'TestPass123!',
}

// In test
import { testUser } from './fixtures/user'
```

### ❌ DON'T: Rely on Production Data

```typescript
// Bad - Production data can change
test('login as admin', async ({ page }) => {
	await page.fill('#email', 'admin@company.com') // Might not exist
})
```

## 5. Assertions

### ✅ DO: Use Explicit Assertions

```typescript
// Good - Clear expectations
await expect(page).toHaveURL('/dashboard')
await expect(page.getByRole('heading')).toHaveText('Dashboard')
await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
```

### ✅ DO: Test User-Visible Behavior

```typescript
// Good - Tests what user sees
await expect(page.getByText('Successfully saved')).toBeVisible()

// Bad - Tests implementation details
const response = await page.evaluate(() => window.localStorage.getItem('key'))
expect(response).toBe('value')
```

### ✅ DO: Use Soft Assertions When Appropriate

```typescript
// Soft assertions continue test even if they fail
await expect.soft(page.getByText('Optional feature')).toBeVisible()
await expect.soft(page.getByRole('button', { name: 'Beta' })).toBeEnabled()

// Hard assertion - stops test if fails
await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
```

## 6. Page Object Model

### ✅ DO: Encapsulate Page Logic

```typescript
// pages/LoginPage.ts
export class LoginPage {
	constructor(private page: Page) {}

	private emailInput = () => this.page.getByLabel('Email')
	private passwordInput = () => this.page.getByLabel('Password')
	private submitButton = () => this.page.getByRole('button', { name: 'Log in' })

	async goto() {
		await this.page.goto('/login')
	}

	async login(email: string, password: string) {
		await this.emailInput().fill(email)
		await this.passwordInput().fill(password)
		await this.submitButton().click()
	}

	async expectError(message: string) {
		await expect(this.page.getByRole('alert')).toContainText(message)
	}
}

// In test
const loginPage = new LoginPage(page)
await loginPage.goto()
await loginPage.login('user@example.com', 'password')
```

## 7. Error Handling

### ✅ DO: Add Meaningful Error Messages

```typescript
// Good - Provides context
await expect(page.getByRole('button', { name: 'Submit' }))
	.toBeVisible({ timeout: 10000 })
	.catch((e) => {
		throw new Error(
			`Submit button not found after login. Current URL: ${page.url()}`,
		)
	})
```

### ✅ DO: Take Screenshots on Failure

```typescript
test.afterEach(async ({ page }, testInfo) => {
	if (testInfo.status !== 'passed') {
		await page.screenshot({
			path: `screenshots/${testInfo.title}-failure.png`,
			fullPage: true,
		})
	}
})
```

## 8. Performance

### ✅ DO: Run Tests in Parallel

```typescript
// playwright.config.ts
export default defineConfig({
	fullyParallel: true,
	workers: process.env.CI ? 2 : undefined,
})
```

### ✅ DO: Reuse Authentication State

```typescript
// Save auth state once
const authFile = 'playwright/.auth/user.json'

test('authenticate', async ({ page }) => {
	await page.goto('/login')
	await loginUser(page)
	await page.context().storageState({ path: authFile })
})

// Reuse in other tests
test.use({ storageState: authFile })
```

### ❌ DON'T: Repeat Expensive Operations

```typescript
// Bad - Logs in for every test
test.beforeEach(async ({ page }) => {
	await page.goto('/login')
	await loginFlow(page) // Expensive
})

// Good - Reuse authentication
test.use({ storageState: 'auth.json' })
```

## 9. Debugging

### ✅ DO: Use Debug Tools

```typescript
// Pause execution for debugging
await page.pause()

// Slow down execution
test.use({ launchOptions: { slowMo: 100 } })

// Enable verbose logging
test.use({ trace: 'on' })
```

### ✅ DO: Add Strategic Logging

```typescript
test('complex flow', async ({ page }) => {
	console.log('Starting test at:', page.url())

	await page.click('button')
	console.log('Button clicked, waiting for navigation')

	await page.waitForURL('/next-page')
	console.log('Navigation complete')
})
```

## 10. CI/CD Integration

### ✅ DO: Configure for CI Environment

```typescript
// playwright.config.ts
export default defineConfig({
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? 'github' : 'html',
	use: {
		trace: process.env.CI ? 'on-first-retry' : 'on',
		video: process.env.CI ? 'on-first-retry' : 'off',
	},
})
```

### ✅ DO: Handle Environment Differences

```typescript
const baseURL = process.env.CI
	? 'http://localhost:3000'
	: process.env.BASE_URL || 'http://localhost:3000'
```

## 11. Accessibility Testing

### ✅ DO: Include Accessibility Checks

```typescript
import { injectAxe, checkA11y } from 'axe-playwright'

test('page is accessible', async ({ page }) => {
	await page.goto('/')
	await injectAxe(page)
	await checkA11y(page, null, {
		detailedReport: true,
		detailedReportOptions: { html: true },
	})
})
```

## 12. Anti-Patterns to Avoid

### ❌ Testing Implementation Details

```typescript
// Bad - Tests internal state
const state = await page.evaluate(() => window.__REDUX_STATE__)
expect(state.user.isLoggedIn).toBe(true)

// Good - Tests user-facing behavior
await expect(page.getByText('Welcome, User')).toBeVisible()
```

### ❌ Excessive Mocking

```typescript
// Bad - Mocks everything
await page.route('**/*', route => route.fulfill({ body: 'mocked' }))

// Good - Mock only external dependencies
await page.route('**/external-api/**', route => route.fulfill({ ... }))
```

### ❌ Conditional Testing

```typescript
// Bad - Conditional logic in tests
if (await page.locator('.modal').isVisible()) {
	await page.click('.close-modal')
}

// Good - Deterministic tests
await expect(page.locator('.modal')).toBeVisible()
await page.click('.close-modal')
```

## Quick Reference Checklist

Before committing your test:

- [ ] Test name clearly describes what is being tested
- [ ] Test is independent and can run in isolation
- [ ] Uses semantic selectors (roles, labels, text)
- [ ] No hardcoded waits or sleeps
- [ ] Includes proper assertions
- [ ] Cleans up test data
- [ ] Handles errors gracefully
- [ ] Runs successfully locally and in CI
- [ ] Follows team naming conventions
- [ ] Includes comments for complex logic

## Common Pitfalls & Solutions

| Problem           | Solution                                                |
| ----------------- | ------------------------------------------------------- |
| Flaky tests       | Use proper waiting strategies, avoid race conditions    |
| Slow tests        | Run in parallel, reuse auth state, mock external APIs   |
| Brittle selectors | Use user-facing attributes, add data-testid when needed |
| Test pollution    | Clean up after tests, use unique test data              |
| Hard to debug     | Add logging, use trace viewer, take screenshots         |
| CI failures       | Account for environment differences, add retries        |

## Recommended Reading

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles)
- [Component Testing vs E2E](https://playwright.dev/docs/testing-types)
