import { Builder, Capabilities } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import firefox from 'selenium-webdriver/firefox'

export interface TestConfig {
	baseUrl: string
	browser: 'chrome' | 'firefox' | 'edge'
	headless: boolean
	timeout: {
		implicit: number
		pageLoad: number
		script: number
	}
	viewport: {
		width: number
		height: number
	}
}

export const config: TestConfig = {
	baseUrl: process.env.BASE_URL || 'http://localhost:3000',
	browser: (process.env.BROWSER || 'chrome') as 'chrome' | 'firefox' | 'edge',
	headless: process.env.HEADLESS === 'true',
	timeout: {
		implicit: 10000,
		pageLoad: 30000,
		script: 30000,
	},
	viewport: {
		width: 1280,
		height: 720,
	},
}

export function createDriver() {
	let builder = new Builder()

	switch (config.browser) {
		case 'chrome': {
			const options = new chrome.Options()
			if (config.headless) {
				options.addArguments('--headless=new')
			}
			options.addArguments('--disable-dev-shm-usage')
			options.addArguments('--no-sandbox')
			options.addArguments(
				`--window-size=${config.viewport.width},${config.viewport.height}`,
			)
			builder = builder.forBrowser('chrome').setChromeOptions(options)
			break
		}
		case 'firefox': {
			const options = new firefox.Options()
			if (config.headless) {
				options.addArguments('-headless')
			}
			options.addArguments(`--width=${config.viewport.width}`)
			options.addArguments(`--height=${config.viewport.height}`)
			builder = builder.forBrowser('firefox').setFirefoxOptions(options)
			break
		}
		default:
			throw new Error(`Unsupported browser: ${config.browser}`)
	}

	return builder.build()
}
