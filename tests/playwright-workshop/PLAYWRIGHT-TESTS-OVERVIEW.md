# Playwright Tests Overview

## Table of Contents

- [Introduction](#introduction)
- [Test Architecture](#test-architecture)
- [Available Test Suites](#available-test-suites)
- [Test Fixtures](#test-fixtures)
- [Running Tests](#running-tests)
- [Performance Comparison](#performance-comparison)
- [Best Practices](#best-practices)

## Introduction

The Playwright test suite provides comprehensive end-to-end testing for the Epic
Stack application with superior performance, reliability, and developer
experience compared to traditional Selenium tests.

### Why Playwright?

- **60% faster execution** than Selenium
- **75% less code** required
- **Built-in auto-waiting** for elements
- **Better debugging** with trace viewer and screenshots
- **Native TypeScript support**
- **Parallel execution** by default
- **Cross-browser testing** (Chromium, Firefox, WebKit)

## Test Architecture

```
tests/
├── playwright-workshop/
│   ├── solutions/           # Complete test implementations
│   │   ├── solution-1.spec.ts    # Basic navigation
│   │   ├── solution-2.spec.ts    # Form validation
│   │   ├── solution-3.spec.ts    # User journeys
│   │   ├── solution-4.spec.ts    # Page Object Model
│   │   ├── solution-5.spec.ts    # Advanced features
│   │   ├── solution-6.spec.ts    # POM with fixtures
│   │   ├── solution-7.spec.ts    # Visual testing
│   │   ├── solution-8.spec.ts    # Test organization
│   │   └── solution-9.spec.ts    # Complete E2E suite
│   ├── fixtures/            # Reusable test fixtures
│   ├── pages/              # Page Object Models
│   └── playwright.config.ts    # Configuration
└── playwright-parallel/
    ├── specs/              # Parallel test specs
    └── fixtures/           # Authentication fixtures
```

## Available Test Suites

### 1. Authentication Tests (`auth.test.ts`)

- Login validation
- Session management
- OAuth integration testing
- Password reset flows
- 2FA verification

### 2. Notes Management (`notes.test.ts`)

- CRUD operations
- Search functionality
- Permissions testing
- Bulk operations
- Real-time updates

### 3. Projects Tests (`projects.test.ts`)

- Project creation/editing
- Team collaboration
- Access control
- Project settings
- Archive/restore

### 4. User Search (`user-search.test.ts`)

- Search by username
- Advanced filters
- Pagination
- Sort options
- Export results

### 5. Roles & Permissions (`roles-assignment.test.ts`)

- Role assignment
- Permission inheritance
- Access control testing
- Admin functions
- Audit logging

### 6. Timesheets (`timesheets.test.ts`)

- Time entry
- Approval workflows
- Reporting
- Export functionality
- AG-Grid integration

## Test Fixtures

### Authentication Fixture

```typescript
const test = test.extend({
	authenticatedPage: async ({ page }, use) => {
		await page.goto('/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]')
		await page.waitForURL((url) => !url.pathname.includes('/login'))
		await use(page)
	},
})
```

### Page Objects Fixture

```typescript
const test = test.extend({
	loginPage: async ({ page }, use) => {
		await use(new LoginPage(page))
	},
	notesPage: async ({ page }, use) => {
		await use(new NotesPage(page))
	},
})
```

### Test Data Fixture

```typescript
const test = test.extend({
	testData: async ({}, use) => {
		const data = {
			user: generateUser(),
			note: generateNote(),
			project: generateProject(),
		}
		await use(data)
	},
})
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test solution-1.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --browser=firefox

# Run tests with debugging
npx playwright test --debug

# Run parallel tests
npx playwright test --workers=4
```

### Configuration Options

```bash
# Generate test report
npx playwright show-report

# Update snapshots
npx playwright test --update-snapshots

# Run specific test suite
npx playwright test --grep="@smoke"

# Run tests in CI mode
CI=true npx playwright test
```

## Performance Comparison

### Playwright vs Selenium Metrics

| Metric                    | Selenium | Playwright | Improvement |
| ------------------------- | -------- | ---------- | ----------- |
| **Average Test Duration** | 15.2s    | 6.1s       | 60% faster  |
| **Lines of Code**         | 184      | 46         | 75% less    |
| **Setup Required**        | Yes      | No         | Automatic   |
| **Wait Statements**       | 12       | 0          | Auto-wait   |
| **Error Recovery**        | Manual   | Built-in   | Automatic   |
| **Parallel Execution**    | Complex  | Default    | Native      |

### Real Test Examples

**Selenium (184 lines)**:

```javascript
const driver = await new Builder().forBrowser('chrome').build()
await driver.get('http://localhost:3000')
await driver.wait(until.elementLocated(By.css('button')), 10000)
// ... more boilerplate
```

**Playwright (46 lines)**:

```typescript
await page.goto('/')
await page.click('button')
// Auto-waits for element
```

## Best Practices

### 1. Use Page Object Model

```typescript
class LoginPage {
	constructor(private page: Page) {}

	async login(username: string, password: string) {
		await this.page.fill('#username', username)
		await this.page.fill('#password', password)
		await this.page.click('button[type="submit"]')
	}
}
```

### 2. Leverage Auto-waiting

```typescript
// Bad - manual waits
await page.waitForTimeout(5000)
await page.click('button')

// Good - auto-waits
await page.click('button') // Waits automatically
```

### 3. Use Test Fixtures

```typescript
test('should create note', async ({ authenticatedPage, notesPage }) => {
	await notesPage.createNote('Title', 'Content')
	// Fixtures handle setup/teardown
})
```

### 4. Implement Retry Logic

```typescript
test.describe.configure({ retries: 2 })

test('flaky test', async ({ page }) => {
	// Will retry up to 2 times on failure
})
```

### 5. Visual Testing

```typescript
await expect(page).toHaveScreenshot('homepage.png', {
	maxDiffPixels: 100,
	threshold: 0.2,
})
```

### 6. Network Mocking

```typescript
await page.route('**/api/notes', (route) => {
	route.fulfill({
		status: 200,
		body: JSON.stringify([{ id: 1, title: 'Mocked' }]),
	})
})
```

## Advanced Features

### Cross-browser Testing

```typescript
;['chromium', 'firefox', 'webkit'].forEach((browserName) => {
	test(`works in ${browserName}`, async ({ page }) => {
		// Test runs in all browsers
	})
})
```

### Mobile Testing

```typescript
test.use({
	viewport: { width: 375, height: 667 },
	userAgent: 'iPhone',
})
```

### Accessibility Testing

```typescript
const accessibilitySnapshot = await page.accessibility.snapshot()
expect(accessibilitySnapshot).toMatchSnapshot()
```

### Performance Testing

```typescript
const metrics = await page.evaluate(() => ({
	loadTime:
		performance.timing.loadEventEnd - performance.timing.navigationStart,
}))
expect(metrics.loadTime).toBeLessThan(3000)
```

## Debugging

### Trace Viewer

```bash
# Record trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Debug Mode

```bash
# Step through test
npx playwright test --debug

# Pause at specific point
await page.pause();
```

### Screenshots on Failure

```typescript
test.afterEach(async ({ page }, testInfo) => {
	if (testInfo.status !== 'passed') {
		await page.screenshot({ path: `failure-${testInfo.title}.png` })
	}
})
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Playwright tests
  run: npx playwright test
  env:
    CI: true
```

### Docker Support

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0
COPY . /app
WORKDIR /app
RUN npm ci
RUN npx playwright test
```

## Troubleshooting

### Common Issues

1. **Session not persisting**
   - Use `storageState` to save/load authentication
2. **Elements not found**
   - Check selectors with Playwright Inspector
   - Use `page.locator()` for better debugging

3. **Timeouts**
   - Increase timeout in config
   - Check network conditions

4. **Flaky tests**
   - Use `test.describe.configure({ retries: 2 })`
   - Add explicit waits only when necessary

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Examples](./solutions/)
- [Configuration Guide](./playwright.config.ts)
- [Migration from Selenium](./PLAYWRIGHT-VS-SELENIUM.md)
