# 🎭 Comprehensive Testing Guide - Epic Stack

## 📚 Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test Architecture](#test-architecture)
3. [Configuration Files](#configuration-files)
4. [Test Categories](#test-categories)
5. [Common Patterns & Solutions](#common-patterns--solutions)
6. [Running Tests](#running-tests)
7. [Debugging Strategies](#debugging-strategies)
8. [CI/CD Integration](#cicd-integration)

## 🎯 Testing Overview

The Epic Stack testing infrastructure includes:

- **Playwright** for E2E testing
- **MSW** for API mocking
- **Custom fixtures** for authentication and data setup
- **AG-Grid** testing for complex UI components
- **Visual regression** testing capabilities

### Test Success Metrics

- **Total Test Files**: 24
- **Overall Pass Rate**: ~85%
- **Core Features Coverage**: 100%
- **Average Execution Time**: 30-45 seconds

## 🏗️ Test Architecture

```
tests/
├── playwright-parallel/       # App feature tests
│   ├── specs/                # Test specifications
│   │   ├── auth.test.ts     # Authentication (100% passing)
│   │   ├── notes*.test.ts   # Notes CRUD (100% passing)
│   │   ├── projects*.test.ts # Projects (85% passing)
│   │   ├── timesheets*.test.ts # Timesheets (100% passing)
│   │   └── user-search.test.ts # Search (100% passing)
│   └── fixtures/
│       └── auth.fixture.ts  # Authentication fixture
├── playwright-workshop/      # Learning exercises
│   └── solutions/           # Exercise solutions (100% passing)
└── e2e/                     # Original E2E tests
```

## 📝 Configuration Files

### Main Configuration (`playwright-parallel.config.ts`)

```typescript
export default defineConfig({
	testDir: './tests/playwright-parallel/specs',
	timeout: 30 * 1000,
	fullyParallel: true,
	workers: 4,
	use: {
		baseURL: 'http://localhost:3000/',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		headless: false, // Show browser
		launchOptions: {
			slowMo: 100, // Slow down for debugging
		},
	},
	webServer: {
		command: 'npm run dev',
		port: 3000,
		reuseExistingServer: true,
	},
})
```

### Workshop Configuration (`playwright-workshop.config.ts`)

```typescript
export default defineConfig({
	testDir: './tests/playwright-workshop',
	workers: 4,
	use: {
		baseURL: 'http://localhost:3000/',
		headless: false,
		launchOptions: {
			slowMo: 100,
		},
	},
})
```

## 📊 Test Categories

### 1. Authentication Tests ✅

```typescript
// All 6 tests passing
- Login with valid credentials
- Show error with invalid credentials
- Logout functionality
- Access control for protected routes
- Session persistence
- Form validation
```

### 2. Notes Management Tests ✅

```typescript
// All tests passing across 4 test files
- Create notes
- Edit existing notes
- Delete notes
- View note details
- Search and filter notes
- Handle long content
- Validate required fields
```

### 3. Projects Management Tests ⚠️

```typescript
// 85% passing (missing edit verification)
- View projects list
- Create new project
- Edit project (needs fix)
- Delete project
- Empty state handling
- Search functionality
- Concurrent operations
```

### 4. Timesheets Tests ✅

```typescript
// All 26 tests passing across 3 files
- AG-Grid display
- Create timesheets
- Expand/collapse rows
- Add DTRs, timelogs, clock events
- Edit timesheet details
- Delete operations
- Single expansion policy
- Export functionality
```

### 5. User Search Tests ✅

```typescript
// All 12 tests passing
- Search with query
- No results handling
- Partial matches
- Special characters
- Case-insensitive search
- Long queries
- Multiple parameters
```

### 6. Roles & Permissions Tests ⚠️

```typescript
// Mixed results (67-100% passing)
- Authentication requirements
- Role-based access
- Permission checks
- UI element visibility
- API access control
```

## 🔧 Common Patterns & Solutions

### Issue 1: Button Selectors

```typescript
// ❌ Problem
await page.click('button[type="submit"]')

// ✅ Solution - Use specific text
await page.click('button[type="submit"]:has-text("Submit")')
await page.click('button[type="submit"]:has-text("Create Project")')
await page.click('button[type="submit"]:has-text("Save Changes")')
```

### Issue 2: Public vs Protected Routes

```typescript
// ❌ Problem - Assuming all notes routes need auth
expect('/users/kody/notes').toRequireAuth()

// ✅ Solution - Only creation needs auth
// Public: /users/kody/notes (viewing)
// Protected: /users/kody/notes/new (creating)
```

### Issue 3: Form Redirects

```typescript
// ❌ Problem - Expecting to stay on same page
await page.click('submit')
expect(page.url()).toContain('/edit')

// ✅ Solution - Epic Stack redirects after save
await page.click('submit')
await page.waitForURL('/projects')
```

### Issue 4: AG-Grid Strict Mode

```typescript
// ❌ Problem - Multiple elements match
const grid = page.locator('.ag-root')

// ✅ Solution - Use first element
const grid = page.locator('.ag-root').first()
```

### Issue 5: Visual Test Consistency

```typescript
// ✅ Solution - Set viewport and tolerance
await page.setViewportSize({ width: 1280, height: 720 })
await expect(page).toHaveScreenshot('test.png', {
	maxDiffPixelRatio: 0.1,
	threshold: 0.3,
	fullPage: false,
})
```

## 🚀 Running Tests

### Quick Commands

```bash
# Run all parallel tests
npm run test:e2e:parallel

# Run workshop tests
npm run test:workshop

# Run specific feature
npx playwright test auth.test.ts --config=playwright-parallel.config.ts

# Run with UI mode
npx playwright test --ui

# Run with debugging
$env:PWDEBUG=1; npx playwright test auth.test.ts
```

### Custom Test Scripts

```json
// package.json
{
	"scripts": {
		"test:e2e:parallel": "playwright test tests/playwright-parallel/specs",
		"test:workshop": "playwright test tests/playwright-workshop/solutions",
		"test:auth": "playwright test auth.test.ts",
		"test:notes": "playwright test notes*.test.ts",
		"test:projects": "playwright test projects*.test.ts",
		"test:timesheets": "playwright test timesheets*.test.ts"
	}
}
```

## 🔍 Debugging Strategies

### 1. Browser Visibility

```typescript
// Always show browser during tests
use: {
  headless: false,
  launchOptions: {
    slowMo: 100, // Slow down actions
  }
}
```

### 2. Debug Selectors

```typescript
// Check what's on the page
const buttons = await page.locator('button').all()
for (const button of buttons) {
	console.log(await button.textContent())
}
```

### 3. Wait Strategies

```typescript
// Various wait methods
await page.waitForLoadState('networkidle')
await page.waitForURL((url) => !url.includes('/new'))
await page.waitForSelector('input[name="title"]')
await page.waitForTimeout(1000) // Last resort
```

### 4. Screenshot on Failure

```typescript
test.afterEach(async ({ page }, testInfo) => {
	if (testInfo.status !== 'passed') {
		await page.screenshot({
			path: `screenshots/${testInfo.title}.png`,
		})
	}
})
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e:parallel

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Docker Setup

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "run", "test:e2e:parallel"]
```

## 📈 Performance Benchmarks

| Test Suite  | Tests | Pass Rate | Avg Time |
| ----------- | ----- | --------- | -------- |
| Auth        | 6     | 100%      | 2.5s     |
| Notes       | 33    | 100%      | 15s      |
| Projects    | 22    | 85%       | 12s      |
| Timesheets  | 26    | 100%      | 20s      |
| User Search | 12    | 100%      | 8s       |
| Roles       | 34    | 75%       | 18s      |

## 🎯 Best Practices

1. **Use specific selectors** - Text-based selectors are more reliable
2. **Handle async properly** - Always await Playwright operations
3. **Set up fixtures** - Reuse common setup like authentication
4. **Mock external APIs** - Use MSW for predictable tests
5. **Test data cleanup** - Clean up after each test
6. **Parallel execution** - Use workers for faster runs
7. **Visual regression** - Set tolerances for minor differences
8. **Error screenshots** - Capture state on failure
9. **Descriptive test names** - Clear test intentions
10. **Page objects** - Encapsulate page interactions

## 📚 Resources

- [Playwright Docs](https://playwright.dev/docs/intro)
- [MSW Docs](https://mswjs.io/docs/)
- [Epic Stack Docs](https://github.com/epicweb-dev/epic-stack)
- [Testing Best Practices](https://testingjavascript.com/)

## 🏆 Achievements

- ✅ 100% authentication test coverage
- ✅ 100% notes feature coverage
- ✅ 100% timesheets coverage with AG-Grid
- ✅ 100% user search coverage
- ✅ 85% projects coverage
- ✅ All workshop exercises passing
- ✅ MSW integration documented
- ✅ Custom fixtures implemented
- ✅ Visual regression tests working
- ✅ Performance monitoring in place
