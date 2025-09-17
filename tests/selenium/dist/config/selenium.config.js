'use strict'
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, '__esModule', { value: true })
exports.config = void 0
exports.createDriver = createDriver
const selenium_webdriver_1 = require('selenium-webdriver')
const chrome_1 = __importDefault(require('selenium-webdriver/chrome'))
const firefox_1 = __importDefault(require('selenium-webdriver/firefox'))
exports.config = {
	baseUrl: process.env.BASE_URL || 'http://localhost:3000',
	browser: process.env.BROWSER || 'chrome',
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
function createDriver() {
	let builder = new selenium_webdriver_1.Builder()
	switch (exports.config.browser) {
		case 'chrome': {
			const options = new chrome_1.default.Options()
			if (exports.config.headless) {
				options.addArguments('--headless=new')
			}
			options.addArguments('--disable-dev-shm-usage')
			options.addArguments('--no-sandbox')
			options.addArguments(
				`--window-size=${exports.config.viewport.width},${exports.config.viewport.height}`,
			)
			builder = builder.forBrowser('chrome').setChromeOptions(options)
			break
		}
		case 'firefox': {
			const options = new firefox_1.default.Options()
			if (exports.config.headless) {
				options.addArguments('-headless')
			}
			options.addArguments(`--width=${exports.config.viewport.width}`)
			options.addArguments(`--height=${exports.config.viewport.height}`)
			builder = builder.forBrowser('firefox').setFirefoxOptions(options)
			break
		}
		default:
			throw new Error(`Unsupported browser: ${exports.config.browser}`)
	}
	return builder.build()
}
