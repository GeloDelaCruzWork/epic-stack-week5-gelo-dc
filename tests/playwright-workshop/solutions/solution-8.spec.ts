import { test, expect } from '@playwright/test'

/**
 * SOLUTION 8: Test Organization & Data Management
 *
 * Complete implementation of test organization patterns
 */

// Test data factory
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

	static generateProject() {
		return {
			name: `Project ${Date.now()}`,
			description: 'Test project description',
			status: 'active',
		}
	}
}

test.describe('Solution 8: Test Organization', () => {
	test.describe('Data-Driven Tests', () => {
		const testCases = [
			{ username: 'kody', password: 'kodylovesyou', shouldPass: true },
			{ username: 'invalid', password: 'wrong', shouldPass: false },
			{ username: '', password: '', shouldPass: false },
		]

		for (const testCase of testCases) {
			test(`login with ${testCase.shouldPass ? 'valid' : 'invalid'} credentials: ${testCase.username}`, async ({
				page,
			}) => {
				await page.goto('http://localhost:3000/login')
				await page.fill('#login-form-username', testCase.username)
				await page.fill('#login-form-password', testCase.password)
				await page.click('button[type="submit"]:has-text("Log in")')

				if (testCase.shouldPass) {
					await expect(page).not.toHaveURL(/login/)
				} else {
					await expect(page).toHaveURL(/login/)
				}
			})
		}
	})

	test.describe('Tagged Tests @smoke @critical', () => {
		test('critical user flow @smoke', async ({ page }) => {
			await page.goto('http://localhost:3000')
			await expect(page).toHaveTitle(/Epic Notes/)
			console.log('✅ Smoke test executed')
		})

		test('optional feature @regression', async ({ page }) => {
			await page.goto('http://localhost:3000/login')
			await expect(page.locator('#login-form')).toBeVisible()
			console.log('✅ Regression test executed')
		})
	})

	test.describe.parallel('Parallel Tests', () => {
		test('parallel test 1', async ({ page }) => {
			await page.goto('http://localhost:3000')
			console.log('Test 1 running in parallel')
		})

		test('parallel test 2', async ({ page }) => {
			await page.goto('http://localhost:3000/login')
			console.log('Test 2 running in parallel')
		})

		test('parallel test 3', async ({ page }) => {
			await page.goto('http://localhost:3000/signup')
			console.log('Test 3 running in parallel')
		})
	})

	test.describe.serial('Serial Tests', () => {
		let testUser: ReturnType<typeof TestDataFactory.generateUser>

		test('step 1: create account', async ({ page }) => {
			testUser = TestDataFactory.generateUser()
			// Note: Account creation might not be available in this app
			// This demonstrates the serial test pattern
			console.log('Would create account for:', testUser.username)
		})

		test('step 2: verify login', async ({ page }) => {
			// This would normally test the created account
			// For demo, we'll use existing credentials
			await page.goto('http://localhost:3000/login')
			await page.fill('#login-form-username', 'kody')
			await page.fill('#login-form-password', 'kodylovesyou')
			await page.click('button[type="submit"]:has-text("Log in")')
			await expect(page).not.toHaveURL(/login/)
		})
	})

	test.describe('Tests with Hooks', () => {
		test.beforeAll(async () => {
			console.log('Setting up test environment...')
		})

		test.beforeEach(async ({ page }) => {
			await page.goto('http://localhost:3000')
			await page.evaluate(() => localStorage.clear())
		})

		test.afterEach(async ({ page }, testInfo) => {
			if (testInfo.status !== 'passed') {
				await page.screenshot({
					path: `tests/playwright-workshop/failures/${testInfo.title}.png`,
				})
			}
		})

		test.afterAll(async () => {
			console.log('Cleaning up test environment...')
		})

		test('test with full lifecycle', async ({ page }) => {
			await expect(page).toHaveTitle(/Epic Notes/)
			console.log('Test with hooks executed')
		})
	})

	// Custom test fixtures
	const customTest = test.extend({
		testData: async ({}, use) => {
			const data = {
				user: TestDataFactory.generateUser(),
				note: TestDataFactory.generateNote(),
			}
			await use(data)
		},

		authenticatedPage: async ({ page }, use) => {
			await page.goto('http://localhost:3000/login')
			await page.fill('#login-form-username', 'kody')
			await page.fill('#login-form-password', 'kodylovesyou')
			await page.click('button[type="submit"]:has-text("Log in")')
			await page.waitForURL((url) => !url.pathname.includes('/login'))
			await use(page)
		},
	})

	customTest(
		'test with custom fixtures',
		async ({ testData, authenticatedPage }) => {
			console.log('Generated test user:', testData.user.username)
			console.log('Generated test note:', testData.note.title)
			// The authenticated page fixture provides a logged-in page
			// The URL might be the homepage after login
			const url = authenticatedPage.url()
			expect(url).not.toContain('/login')
			console.log('✅ Custom fixtures working!')
		},
	)

	test.describe('Environment-Specific Tests', () => {
		test('production-only test', async ({ page }) => {
			test.skip(process.env.NODE_ENV !== 'production', 'Production only test')
			// Production-specific test logic
		})

		test('development-only test', async ({ page }) => {
			test.skip(process.env.NODE_ENV === 'production', 'Development only test')
			await page.goto('http://localhost:3000')
			console.log('Development test executed')
		})
	})
})
