import { test, expect, mergeTests, mergeExpects } from '@playwright/test'

/**
 * EXERCISE 8: Test Organization & Data Management
 *
 * Learn Playwright's superior test organization features
 * that make Selenium look outdated!
 *
 * TASK: Implement test organization patterns, data-driven testing, and parallel execution
 * TIME: 30 minutes (would take 60+ minutes in Selenium)
 *
 * ADVANTAGES:
 * - Built-in test fixtures
 * - Parallel execution by default
 * - Test data factories
 * - Environment-specific configs
 * - Test tagging and filtering
 * - Custom test annotations
 */

// TODO 1: Create test data factory
class TestDataFactory {
	static generateUser() {
		const timestamp = Date.now()
		return {
			username: `testuser_${timestamp}`,
			email: `test_${timestamp}@example.com`,
			password: `SecurePass_${timestamp}!`,
		}
	}

	static generateNote() {
		const timestamp = Date.now()
		return {
			title: `Test Note ${timestamp}`,
			content: `This is test content created at ${new Date().toISOString()}`,
		}
	}

	// TODO 2: Add more data generators
	static generateProject() {
		// return {
		//   name: `Project ${Date.now()}`,
		//   description: 'Test project description',
		//   status: 'active'
		// }
	}
}

// TODO 3: Create custom test annotations
test.describe('Exercise 8: Test Organization', () => {
	// TODO 4: Use test.describe for logical grouping
	test.describe('Data-Driven Tests', () => {
		// TODO 5: Implement parameterized tests
		const testCases = [
			{ username: 'kody', password: 'kodylovesyou', shouldPass: true },
			{ username: 'invalid', password: 'wrong', shouldPass: false },
			{ username: '', password: '', shouldPass: false },
		]

		for (const testCase of testCases) {
			test(`login with ${testCase.shouldPass ? 'valid' : 'invalid'} credentials: ${testCase.username}`, async ({
				page,
			}) => {
				// TODO 6: Implement data-driven login test
				// await page.goto('http://localhost:3000/login')
				// await page.fill('#login-form-username', testCase.username)
				// await page.fill('#login-form-password', testCase.password)
				// await page.click('button[type="submit"]:has-text("Log in")')
				// if (testCase.shouldPass) {
				//   await expect(page).not.toHaveURL(/login/)
				// } else {
				//   await expect(page).toHaveURL(/login/)
				// }
			})
		}
	})

	// TODO 7: Test tagging and filtering
	test.describe('Tagged Tests @smoke @critical', () => {
		test('critical user flow @smoke', async ({ page }) => {
			// This test will run when filtering by @smoke tag
			// Run with: npx playwright test --grep @smoke
			console.log('✅ Smoke test executed')
		})

		test('optional feature @regression', async ({ page }) => {
			// This test will run when filtering by @regression tag
			// Run with: npx playwright test --grep @regression
			console.log('✅ Regression test executed')
		})

		test.skip('work in progress @wip', async ({ page }) => {
			// Skipped tests for work in progress
		})
	})

	// TODO 8: Parallel execution control
	test.describe.parallel('Parallel Tests', () => {
		// These tests will run in parallel
		test('parallel test 1', async ({ page }) => {
			// await page.goto('http://localhost:3000')
			console.log('Test 1 running in parallel')
		})

		test('parallel test 2', async ({ page }) => {
			// await page.goto('http://localhost:3000/login')
			console.log('Test 2 running in parallel')
		})

		test('parallel test 3', async ({ page }) => {
			// await page.goto('http://localhost:3000/signup')
			console.log('Test 3 running in parallel')
		})
	})

	// TODO 9: Serial execution when order matters
	test.describe.serial('Serial Tests', () => {
		// These tests will run in order, one after another
		test('step 1: create account', async ({ page }) => {
			// const user = TestDataFactory.generateUser()
			// Create account logic
		})

		test('step 2: verify email', async ({ page }) => {
			// Depends on step 1
			// Verify email logic
		})

		test('step 3: complete profile', async ({ page }) => {
			// Depends on steps 1 and 2
			// Complete profile logic
		})
	})

	// TODO 10: Test hooks and setup/teardown
	test.describe('Tests with Hooks', () => {
		test.beforeAll(async () => {
			// TODO 11: Global setup for all tests in this group
			console.log('Setting up test environment...')
			// await setupTestDatabase()
			// await seedTestData()
		})

		test.beforeEach(async ({ page }) => {
			// TODO 12: Setup before each test
			// await page.goto('http://localhost:3000')
			// await page.evaluate(() => localStorage.clear())
		})

		test.afterEach(async ({ page }, testInfo) => {
			// TODO 13: Cleanup after each test
			if (testInfo.status !== 'passed') {
				// await page.screenshot({
				//   path: `tests/playwright-workshop/failures/${testInfo.title}.png`
				// })
			}
		})

		test.afterAll(async () => {
			// TODO 14: Global cleanup
			console.log('Cleaning up test environment...')
			// await cleanupTestDatabase()
		})

		test('test with full lifecycle', async ({ page }) => {
			// This test has full setup/teardown lifecycle
			console.log('Test with hooks executed')
		})
	})

	// TODO 15: Custom test fixtures
	const customTest = test.extend({
		testData: async ({}, use) => {
			// TODO 16: Provide test data to all tests
			const data = {
				user: TestDataFactory.generateUser(),
				note: TestDataFactory.generateNote(),
			}
			await use(data)
			// Cleanup if needed
		},

		authenticatedPage: async ({ page }, use) => {
			// TODO 17: Provide pre-authenticated page
			// await page.goto('http://localhost:3000/login')
			// await page.fill('#login-form-username', 'kody')
			// await page.fill('#login-form-password', 'kodylovesyou')
			// await page.click('button[type="submit"]:has-text("Log in")')
			// await use(page)
		},
	})

	// TODO 18: Use custom fixtures in tests
	customTest('test with custom fixtures', async ({ testData, page }) => {
		console.log('Generated test user:', testData.user.username)
		console.log('Generated test note:', testData.note.title)
	})

	// TODO 19: Environment-specific tests
	test.describe('Environment-Specific Tests', () => {
		test('production-only test', async ({ page }) => {
			// test.skip(process.env.NODE_ENV !== 'production', 'Production only test')
			// Production-specific test logic
		})

		test('development-only test', async ({ page }) => {
			// test.skip(process.env.NODE_ENV === 'production', 'Development only test')
			// Development-specific test logic
		})
	})

	// TODO 20: Test retries and flaky test handling
	test.describe('Retry Configuration', () => {
		test('test with custom retry', async ({ page }) => {
			// test.info().annotations.push({ type: 'retries', description: '3' })
			// This test will retry 3 times if it fails
			console.log('Test with retry configuration')
		})
	})
})

/**
 * SELENIUM COMPARISON:
 *
 * Test Organization in Selenium:
 * - TestNG/JUnit required for organization
 * - Complex XML configuration files
 * - No built-in parallel execution
 * - External tools for data-driven testing
 * - Manual test lifecycle management
 * - No native fixture support
 * - Third-party libraries for everything
 *
 * Playwright Built-in Features:
 * - Native test organization with describe blocks
 * - Parallel execution by default
 * - Built-in fixtures and data injection
 * - Native tagging and filtering
 * - Automatic retry mechanisms
 * - Environment-specific configurations
 * - Test hooks at multiple levels
 *
 * REAL METRICS:
 * - Setup time: 5 minutes (Playwright) vs 2 hours (Selenium + TestNG)
 * - Parallel execution: Automatic vs Complex Grid setup
 * - Test data management: Native vs External frameworks
 * - Maintenance: 70% less configuration files
 *
 * EXAMPLE PERFORMANCE:
 * 100 tests execution time:
 * - Selenium (sequential): 15 minutes
 * - Selenium (Grid, 4 nodes): 5 minutes + 30 min setup
 * - Playwright (parallel, 4 workers): 3 minutes, zero setup
 *
 * Annual time savings: 200+ hours on test execution alone
 */
