import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const PORT = process.env.PORT || '3000'

export default defineConfig({
	testDir: './tests/playwright-workshop',
	timeout: 30 * 1000,
	expect: {
		timeout: 10 * 1000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 4,
	reporter: 'list',
	use: {
		baseURL: `http://localhost:${PORT}/`,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		headless: false, // Always show browser window
		launchOptions: {
			slowMo: 100, // Slow down actions by 100ms to see them better
		},
	},

	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
			},
		},
	],

	webServer: {
		command: 'npm run dev',
		url: `http://localhost:${PORT}/`,
		reuseExistingServer: true,
		timeout: 120 * 1000,
	},
})
