import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const PORT = process.env.PORT || '3000'

export default defineConfig({
	testDir: './tests/playwright-parallel/specs',
	timeout: 30 * 1000,
	expect: {
		timeout: 10 * 1000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : 4, // Use 4 workers for better parallelization
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
		command: process.env.CI ? 'npm run start:mocks' : 'npm run dev',
		port: Number(PORT),
		reuseExistingServer: true,
		stdout: 'pipe',
		stderr: 'pipe',
		env: {
			PORT,
			NODE_ENV: 'test',
		},
	},
})
