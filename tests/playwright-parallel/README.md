# Playwright Parallel Tests

This directory contains Playwright tests that run in parallel with the existing
Selenium tests. These tests are designed to be faster, more reliable, and easier
to maintain than traditional Selenium tests.

## Structure

```
playwright-parallel/
├── fixtures/          # Test fixtures and setup helpers
│   └── auth.fixture.ts   # Authentication fixture for logged-in state
├── helpers/           # Helper functions and utilities
│   └── auth-helpers.ts   # Authentication helper methods
├── specs/             # Test specifications
│   ├── auth.test.ts      # Authentication tests
│   ├── notes.test.ts     # Notes management tests
│   └── projects.test.ts  # Projects management tests
└── playwright.config.ts  # Playwright configuration

```

## Running Tests

### All Tests

```bash
# Run all tests headlessly
npm run test:playwright-parallel

# Run with UI mode (interactive)
npm run test:playwright-parallel:ui

# Run in headed mode (see browser)
npm run test:playwright-parallel:headed

# Debug mode with inspector
npm run test:playwright-parallel:debug
```

### Specific Test Suites

```bash
# Run authentication tests only
npm run test:playwright-parallel:auth

# Run notes tests only
npm run test:playwright-parallel:notes

# Run projects tests only
npm run test:playwright-parallel:projects
```

### Specific Browsers

```bash
# Chrome/Chromium only
npm run test:playwright-parallel:chrome

# Firefox only
npm run test:playwright-parallel:firefox

# Safari/WebKit only
npm run test:playwright-parallel:webkit
```

## Key Features

### Superior Performance

- **Parallel Execution**: Tests run in parallel by default (4 workers locally)
- **Auto-waiting**: Playwright automatically waits for elements to be ready
- **Network Idle**: Smart waiting for network requests to complete
- **Fast Selectors**: Modern CSS and text selectors for quick element location

### Better Reliability

- **Auto-retry**: Failed tests retry automatically on CI
- **Smart Assertions**: Built-in retry logic for assertions
- **Stable Selectors**: Multiple fallback selectors for resilient tests
- **Isolation**: Each test runs in a fresh browser context

### Enhanced Debugging

- **Screenshots**: Automatic screenshots on failure
- **Videos**: Video recording for failed tests
- **Traces**: Full execution traces for debugging
- **HTML Reports**: Rich HTML reports with all artifacts

### Cross-browser Testing

- Chromium (Chrome, Edge)
- Firefox
- WebKit (Safari)
- Mobile viewports (iPhone, Android)

## Comparison with Selenium

| Feature         | Playwright                        | Selenium                             |
| --------------- | --------------------------------- | ------------------------------------ |
| Speed           | ⚡ Fast (parallel, auto-wait)     | 🐢 Slower (sequential, manual waits) |
| Reliability     | ✅ High (auto-retry, smart waits) | ⚠️ Moderate (manual error handling)  |
| Setup           | 🎯 Simple (single command)        | 🔧 Complex (drivers, configs)        |
| Debugging       | 🔍 Excellent (traces, videos)     | 📝 Basic (logs, screenshots)         |
| API             | 🎨 Modern (async/await, chaining) | 📚 Traditional (promises, callbacks) |
| Browser Support | 🌐 Modern browsers                | 🌍 All browsers                      |
| Maintenance     | 💚 Low (auto-updates)             | 🟨 High (driver updates)             |

## Test Patterns

### Authentication

Tests use a shared authentication fixture that logs in once and reuses the
session:

```typescript
import { test, expect } from '../fixtures/auth.fixture'

test('authenticated test', async ({ authenticatedPage }) => {
	// Already logged in
	await authenticatedPage.goto('/protected-route')
	// ... test logic
})
```

### Assertions

Playwright's expect API has built-in retry logic:

```typescript
// Waits up to 5 seconds for element to be visible
await expect(page.locator('.element')).toBeVisible()

// Waits for text to appear
await expect(page.locator('h1')).toHaveText('Expected Title')
```

### Selectors

Multiple selector strategies for reliability:

```typescript
// Text selector
await page.click('text=Click me')

// CSS selector
await page.click('.button-class')

// Role selector
await page.click('button[role="submit"]')

// Chained selectors
await page.locator('form').locator('button').click()
```

## Configuration

The `playwright.config.ts` file controls:

- Test directory and file patterns
- Parallel execution settings
- Browser configurations
- Timeouts and retries
- Reporter settings
- Web server configuration

## Tips for Success

1. **Use the UI Mode**: `npm run test:playwright-parallel:ui` for interactive
   debugging
2. **Check Reports**: HTML reports in `playwright-report/` folder after test
   runs
3. **Update Selectors**: Use Playwright's selector playground in UI mode
4. **Leverage Auto-waiting**: Don't add manual waits unless absolutely necessary
5. **Use Fixtures**: Share common setup between tests with fixtures

## Migrating from Selenium

When migrating Selenium tests to Playwright:

1. Replace WebDriver with Page object
2. Remove explicit waits (Playwright auto-waits)
3. Update selectors to use Playwright's syntax
4. Use expect() instead of assert/chai
5. Leverage parallel execution
6. Add proper error messages to assertions

## Troubleshooting

### Tests Failing Locally

- Ensure dev server is running: `npm run dev`
- Check if database is seeded with test data
- Verify Playwright browsers are installed: `npx playwright install`

### Flaky Tests

- Use `waitForLoadState('networkidle')` for dynamic content
- Add more specific selectors
- Check for race conditions in the application
- Use `test.slow()` for tests that need more time

### Debugging Failed Tests

1. Run with `--debug` flag for step-by-step debugging
2. Check screenshots in test results
3. Review video recordings
4. Examine trace files with `npx playwright show-trace`
