# Playwright E2E Testing - Team Onboarding Guide

## Overview

This guide will help you get started with Playwright E2E testing in our Epic
Stack application. Playwright is a powerful testing framework that simulates
real user interactions with our application.

## Getting Started

### 1. Initial Setup (One-time per developer)

```bash
# Install Playwright browsers (only Chromium for now)
npm run test:e2e:install

# Verify installation
npx playwright --version
```

### 2. Understanding Our Test Scripts

- **`npm run test:e2e`** - Launches Playwright UI mode (recommended for
  development)
- **`npm run test:e2e:dev`** - Same as above, opens interactive test runner
- **`npm run test:e2e:run`** - Runs tests in headless mode (used in CI)

### 3. Running Your First Test

#### Interactive Mode (Recommended for Learning)

```bash
npm run test:e2e:dev
```

This opens Playwright UI where you can:

- See all tests visually
- Run individual tests
- Debug step by step
- View browser actions in real-time

#### Headless Mode

```bash
npm run test:e2e:run
```

## Existing Test Coverage

Our application currently has E2E tests for:

| Test File                   | Purpose                                    | Good First Test to Study    |
| --------------------------- | ------------------------------------------ | --------------------------- |
| `onboarding.test.ts`        | User registration flow                     | ✅ Yes - Simple flow        |
| `search.test.ts`            | Search functionality                       | ✅ Yes - Basic interactions |
| `notes.test.ts`             | CRUD operations for notes                  | ⭐ Medium complexity        |
| `2fa.test.ts`               | Two-factor authentication                  | Advanced                    |
| `passkey.test.ts`           | WebAuthn/Passkeys                          | Advanced                    |
| `password-security.test.ts` | Password requirements & session management | Medium                      |
| `projects.test.ts`          | Project management features                | Medium                      |
| `settings-profile.test.ts`  | User profile settings                      | Medium                      |
| `note-images.test.ts`       | Image upload functionality                 | Advanced                    |
| `error-boundary.test.ts`    | Error handling                             | Medium                      |

## Your First Tasks

### Task 1: Environment Setup & Exploration

**Goal**: Get familiar with Playwright UI and run existing tests

1. Install Playwright browsers:

   ```bash
   npm run test:e2e:install
   ```

2. Open Playwright UI:

   ```bash
   npm run test:e2e:dev
   ```

3. In the UI:
   - Click on `onboarding.test.ts` to see the test
   - Click the play button to run it
   - Watch how it interacts with the browser

### Task 2: Understanding Test Structure

**Goal**: Learn how Playwright tests are written

Study this simple test pattern from our codebase:

```typescript
import { test, expect } from '@playwright/test'

test('user can search for content', async ({ page }) => {
	// Navigate to the page
	await page.goto('/search')

	// Find and interact with elements
	await page.fill('input[name="search"]', 'test query')
	await page.click('button[type="submit"]')

	// Assert expected results
	await expect(page.locator('h1')).toContainText('Search Results')
})
```

### Task 3: Write Your First Test

**Goal**: Create a simple navigation test

Create a new file `tests/e2e/navigation.test.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
	test('can navigate to login page', async ({ page }) => {
		await page.goto('/')
		await page.click('text=Log In')
		await expect(page).toHaveURL('/login')
		await expect(page.locator('h1')).toContainText('Welcome back')
	})
})
```

Run your test:

```bash
npx playwright test tests/e2e/navigation.test.ts --ui
```

### Task 4: Test with Authentication

**Goal**: Learn to test authenticated features

Many tests require a logged-in user. Study how our existing tests handle this:

```typescript
import { test as base } from '@playwright/test'
import { createUser } from '#tests/fixtures/user.ts'

// Create authenticated test fixture
const test = base.extend({
	// This provides a logged-in user for your tests
})

test('authenticated user can access dashboard', async ({ page, login }) => {
	const user = await login()
	await page.goto('/dashboard')
	await expect(page.locator('h1')).toContainText('Dashboard')
})
```

### Task 5: Debug a Failing Test

**Goal**: Learn debugging techniques

1. Run tests and intentionally break one:

   ```bash
   npm run test:e2e:dev
   ```

2. Use these debugging tools:
   - **Trace Viewer**: Shows step-by-step execution
   - **Time Travel**: Hover over steps to see browser state
   - **Console Logs**: Add `console.log()` in tests
   - **Pause Execution**: Use `await page.pause()` to debug

## Best Practices

### 1. Selector Strategies

```typescript
// ❌ Avoid: Fragile selectors
await page.click('.btn-3')

// ✅ Better: Semantic selectors
await page.click('button[type="submit"]')
await page.click('text=Submit')
await page.getByRole('button', { name: 'Submit' })
```

### 2. Waiting for Elements

```typescript
// ❌ Avoid: Fixed timeouts
await page.waitForTimeout(5000)

// ✅ Better: Wait for specific conditions
await page.waitForSelector('text=Loading', { state: 'hidden' })
await expect(page.locator('.results')).toBeVisible()
```

### 3. Test Organization

```typescript
test.describe('Feature Name', () => {
	test.beforeEach(async ({ page }) => {
		// Common setup
		await page.goto('/feature')
	})

	test('specific scenario 1', async ({ page }) => {
		// Test implementation
	})

	test('specific scenario 2', async ({ page }) => {
		// Test implementation
	})
})
```

## Common Commands Reference

### Page Navigation

```typescript
await page.goto('/path')
await page.goBack()
await page.reload()
```

### Element Interaction

```typescript
await page.click('selector')
await page.fill('input', 'text')
await page.selectOption('select', 'value')
await page.check('input[type="checkbox"]')
```

### Assertions

```typescript
await expect(page).toHaveURL('/expected-path')
await expect(page).toHaveTitle('Page Title')
await expect(locator).toBeVisible()
await expect(locator).toHaveText('Expected Text')
await expect(locator).toHaveValue('input value')
```

## Troubleshooting

### Issue: Tests fail with "timeout exceeded"

**Solution**: Increase timeout in specific test or globally

```typescript
test.setTimeout(30000) // 30 seconds for this test
```

### Issue: Can't find element

**Solution**: Use Playwright Inspector

```typescript
await page.pause() // Opens inspector at this point
```

### Issue: Tests pass locally but fail in CI

**Solution**: Ensure consistent environment

```bash
# Run locally with CI settings
cross-env CI=true npm run test:e2e:run
```

## Next Steps

Once comfortable with basics:

1. Study our authentication test helpers in `tests/fixtures/`
2. Learn about Page Object Model pattern
3. Explore advanced features:
   - Network mocking
   - File uploads
   - API testing
   - Visual regression testing

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Our Test Utilities](./tests/playwright-utils.ts)
- Team Slack Channel: #e2e-testing

## Getting Help

1. Run test in UI mode for visual debugging
2. Check existing tests for patterns
3. Ask in #e2e-testing Slack channel
4. Pair with a team member who knows Playwright

Remember: Start simple, build confidence, then tackle complex scenarios!
