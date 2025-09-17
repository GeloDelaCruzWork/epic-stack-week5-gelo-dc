# Playwright Workshop - Hands-on Exercises

## Workshop Overview

Duration: 2-3 hours  
Prerequisites: Completed environment setup (`npm run test:e2e:install`)  
Goal: Build confidence writing and debugging Playwright tests

---

## Exercise 1: Your First Test (15 minutes)

### Task

Write a test that verifies the homepage loads correctly.

### Starting Code

Create `tests/e2e/workshop/exercise-1.test.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('homepage loads successfully', async ({ page }) => {
	// TODO: Navigate to the homepage
	// TODO: Verify the page title contains "Epic Notes"
	// TODO: Check that the login link is visible
})
```

### Success Criteria

- [ ] Test passes when run with `npx playwright test exercise-1.test.ts`
- [ ] Uses proper assertions
- [ ] No hardcoded waits

<details>
<summary>💡 Hint</summary>

```typescript
await page.goto('/')
await expect(page).toHaveTitle(/Epic Notes/)
await expect(page.getByRole('link', { name: /log in/i })).toBeVisible()
```

</details>

---

## Exercise 2: Form Validation (20 minutes)

### Task

Test that the login form shows validation errors for empty fields.

### Starting Code

Create `tests/e2e/workshop/exercise-2.test.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('login form shows validation errors', async ({ page }) => {
	// TODO: Navigate to /login
	// TODO: Click submit without filling any fields
	// TODO: Verify error messages appear
})
```

### Bonus Challenge

- Test that errors disappear when fields are filled

<details>
<summary>💡 Hint</summary>

Look for error messages near the input fields or use `page.getByText()` to find
validation messages.

</details>

---

## Exercise 3: User Journey (30 minutes)

### Task

Create a complete user journey test: Login → Navigate to a page → Perform an
action → Logout

### Requirements

1. Login with credentials (kody/kodylovesyou)
2. Navigate to user settings
3. Verify settings page loads
4. Logout
5. Verify redirect to login page

### Starting Code

Create `tests/e2e/workshop/exercise-3.test.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Complete User Journey', () => {
	test('user can login, navigate, and logout', async ({ page }) => {
		// Your implementation here
	})
})
```

### Success Criteria

- [ ] All navigation steps work
- [ ] Proper waiting for page loads
- [ ] Clean test that could run repeatedly

---

## Exercise 4: Debugging Challenge (20 minutes)

### Task

Fix the broken test below:

```typescript
import { test, expect } from '@playwright/test'

test('broken test - fix me!', async ({ page }) => {
	await page.goto('/users')
	await page.click('.user-card')
	await page.fill('#search', 'kody')
	await page.waitForTimeout(5000)
	const results = page.locator('.results')
	expect(results).toHaveText('Found 1 user')
})
```

### Issues to Fix

1. Navigation might be to wrong URL
2. Selectors might not exist
3. Using hard-coded timeout
4. Assertion might be incorrect

### Debugging Tools to Use

- Playwright UI (`--ui` flag)
- `page.pause()` for debugging
- `page.screenshot()` for visual debugging
- Console logs

---

## Exercise 5: Advanced - Intercept Network Requests (30 minutes)

### Task

Write a test that intercepts and mocks API responses.

### Requirements

1. Intercept a search API call
2. Return mock data
3. Verify the UI displays the mocked data

### Starting Code

```typescript
import { test, expect } from '@playwright/test'

test('mock search results', async ({ page }) => {
	// Intercept API calls
	await page.route('**/user?search**', (route) => {
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				results: [
					{ id: 1, title: 'Mocked Result 1' },
					{ id: 2, title: 'Mocked Result 2' },
				],
			}),
		})
	})

	// TODO: Navigate to search page
	// TODO: Perform search
	// TODO: Verify mocked results appear
})
```

---

## Exercise 6: Page Object Model (30 minutes)

### Task

Refactor a test to use the Page Object Model pattern.

### Create Page Object

Create `tests/e2e/workshop/pages/login.page.ts`:

```typescript
import { Page, expect } from '@playwright/test'

export class LoginPage {
	constructor(private page: Page) {}

	async goto() {
		// TODO: Navigate to login page
	}

	async login(username: string, password: string) {
		// TODO: Fill in credentials and submit
	}

	async expectError(message: string) {
		// TODO: Verify error message appears
	}
}
```

### Use in Test

```typescript
import { test } from '@playwright/test'
import { LoginPage } from './pages/login.page'

test('login using page object', async ({ page }) => {
	const loginPage = new LoginPage(page)
	await loginPage.goto()
	await loginPage.login('kody', 'kodylovesyou')
	// Continue test...
})
```

---

## Exercise 7: Visual Testing (20 minutes)

### Task

Add visual regression testing to a page.

### Requirements

1. Take a screenshot of the homepage
2. Compare with baseline
3. Handle dynamic content

```typescript
test('visual regression - homepage', async ({ page }) => {
	await page.goto('/')

	// Hide dynamic content
	await page.addStyleTag({
		content: `
      .timestamp { visibility: hidden; }
      .user-avatar { visibility: hidden; }
    `,
	})

	await expect(page).toHaveScreenshot('homepage.png', {
		fullPage: true,
		animations: 'disabled',
	})
})
```

---

## Exercise 8: Test Organization (15 minutes)

### Task

Organize related tests using describe blocks and hooks.

### Requirements

Create a well-organized test suite with:

- `beforeEach` for common setup
- `afterEach` for cleanup
- Nested describe blocks
- Skipped tests for work in progress

```typescript
test.describe('User Management', () => {
	test.beforeEach(async ({ page }) => {
		// Common setup
	})

	test.describe('Profile Updates', () => {
		test('can update username', async ({ page }) => {
			// Test implementation
		})

		test.skip('can update avatar', async ({ page }) => {
			// Work in progress
		})
	})

	test.afterEach(async ({ page }) => {
		// Cleanup
	})
})
```

---

## Final Challenge: Build a Complete Test Suite (45 minutes)

### Task

Create a complete test suite for a feature of your choice.

### Requirements

1. At least 5 test cases
2. Use Page Object Model
3. Include both happy path and error cases
4. Add proper test organization
5. Include at least one advanced technique (mocking, visual testing, etc.)

### Suggested Features to Test

- User registration flow
- Note creation and management
- Search functionality
- User settings

### Evaluation Criteria

- Code organization
- Test reliability
- Proper use of assertions
- Good selector strategies
- Appropriate waits

---

## Workshop Wrap-up Checklist

### Skills Practiced

- [ ] Basic test writing
- [ ] Form interaction
- [ ] Navigation testing
- [ ] Debugging techniques
- [ ] Network interception
- [ ] Page Object Model
- [ ] Visual testing
- [ ] Test organization

### Next Steps

1. Review your test code with a teammate
2. Run tests in CI mode: `npm run test:e2e:run`
3. Explore Playwright documentation for advanced features
4. Start writing tests for your assigned features

### Resources

- [Playwright Docs](https://playwright.dev)
- [Selector Best Practices](https://playwright.dev/docs/selectors)
- [Debugging Guide](https://playwright.dev/docs/debug)
- Team Slack: #e2e-testing

### Getting Help

If you get stuck:

1. Check the solution hints
2. Use Playwright UI for debugging
3. Ask in #e2e-testing channel
4. Pair with a teammate who completed the exercise
