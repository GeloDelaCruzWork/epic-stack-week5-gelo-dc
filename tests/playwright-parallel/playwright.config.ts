import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for parallel tests with Selenium
 */
export default defineConfig({
	testDir: './specs',

	// Run tests in parallel
	fullyParallel: true,

	// Fail the build on CI if you accidentally left test.only in the source code
	forbidOnly: !!process.env.CI,

	// Retry on CI only
	retries: process.env.CI ? 2 : 0,

	// Number of workers
	workers: process.env.CI ? 1 : 4,

	// Reporter to use
	reporter: [
		['html', { outputFolder: 'playwright-report' }],
		['list'],
		['junit', { outputFile: 'test-results/junit.xml' }],
	],

	// Shared settings for all projects
	use: {
		// Base URL for all tests
		baseURL: process.env.BASE_URL || 'http://localhost:3000',

		// Collect trace when retrying the failed test
		trace: 'on-first-retry',

		// Screenshot on failure
		screenshot: 'only-on-failure',

		// Video on failure
		video: 'retain-on-failure',

		// Timeout for each action
		actionTimeout: 10000,

		// Navigation timeout
		navigationTimeout: 30000,
	},

	// Configure projects for major browsers
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				// Custom viewport for consistent testing
				viewport: { width: 1280, height: 720 },
			},
		},

		{
			name: 'firefox',
			use: {
				...devices['Desktop Firefox'],
				viewport: { width: 1280, height: 720 },
			},
		},

		{
			name: 'webkit',
			use: {
				...devices['Desktop Safari'],
				viewport: { width: 1280, height: 720 },
			},
		},

		// Mobile viewports
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},

		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] },
		},
	],

	// Run your local dev server before starting the tests
	webServer: {
		command: 'npm run dev',
		port: 3000,
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},

	// Global timeout for the whole test run
	globalTimeout: 60 * 60 * 1000, // 1 hour

	// Timeout for each test
	timeout: 30 * 1000, // 30 seconds

	// Expect timeout
	expect: {
		timeout: 5000,
	},
})
