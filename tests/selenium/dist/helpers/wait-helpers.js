'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.StableElement = exports.WaitHelpers = void 0
const selenium_webdriver_1 = require('selenium-webdriver')
class WaitHelpers {
	constructor(driver, defaultTimeout = 10000) {
		this.driver = driver
		this.defaultTimeout = defaultTimeout
	}
	async waitForElement(locator, timeout) {
		const wait = timeout || this.defaultTimeout
		return await this.driver.wait(
			selenium_webdriver_1.until.elementLocated(locator),
			wait,
		)
	}
	async waitForElementVisible(locator, timeout) {
		const wait = timeout || this.defaultTimeout
		const element = await this.waitForElement(locator, wait)
		await this.driver.wait(
			selenium_webdriver_1.until.elementIsVisible(element),
			wait,
		)
		return element
	}
	async waitForElementClickable(locator, timeout) {
		const wait = timeout || this.defaultTimeout
		const element = await this.waitForElementVisible(locator, wait)
		await this.driver.wait(
			selenium_webdriver_1.until.elementIsEnabled(element),
			wait,
		)
		return element
	}
	async waitForText(locator, text, timeout) {
		// If locator is a string, search for it in the page body
		if (typeof locator === 'string') {
			const wait = timeout || this.defaultTimeout
			return await this.driver.wait(async () => {
				const pageText = await this.driver
					.findElement(selenium_webdriver_1.By.tagName('body'))
					.getText()
				return pageText.includes(locator)
			}, wait)
		}
		const wait = timeout || this.defaultTimeout
		return await this.driver.wait(async () => {
			try {
				const element = await this.driver.findElement(locator)
				const actualText = await element.getText()
				return actualText.includes(text)
			} catch {
				return false
			}
		}, wait)
	}
	async waitForUrl(urlPattern, timeout) {
		const wait = timeout || this.defaultTimeout
		return await this.driver.wait(async () => {
			const currentUrl = await this.driver.getCurrentUrl()
			if (typeof urlPattern === 'string') {
				return currentUrl.includes(urlPattern)
			}
			return urlPattern.test(currentUrl)
		}, wait)
	}
	async waitForElementToDisappear(locator, timeout) {
		const wait = timeout || this.defaultTimeout
		return await this.driver.wait(async () => {
			const elements = await this.driver.findElements(locator)
			return elements.length === 0
		}, wait)
	}
	async waitForCondition(condition, timeout, message) {
		const wait = timeout || this.defaultTimeout
		return await this.driver.wait(condition, wait, message)
	}
	async waitForPageLoad(timeout) {
		const wait = timeout || this.defaultTimeout
		await this.driver.wait(async () => {
			const readyState = await this.driver.executeScript(
				'return document.readyState',
			)
			return readyState === 'complete'
		}, wait)
	}
	async waitForAjax(timeout) {
		const wait = timeout || this.defaultTimeout
		await this.driver
			.wait(async () => {
				const jQueryActive = await this.driver.executeScript(
					'return typeof jQuery !== "undefined" ? jQuery.active === 0 : true',
				)
				const fetchActive = await this.driver.executeScript(
					'return window.fetch ? window.fetch.active === 0 : true',
				)
				return jQueryActive && fetchActive
			}, wait)
			.catch(() => {
				// If jQuery or fetch is not defined, continue
			})
	}
	async retryAction(action, maxRetries = 3, delayMs = 1000) {
		let lastError
		for (let i = 0; i < maxRetries; i++) {
			try {
				return await action()
			} catch (error) {
				lastError = error
				if (i < maxRetries - 1) {
					await this.driver.sleep(delayMs)
				}
			}
		}
		throw lastError || new Error('Action failed after retries')
	}
}
exports.WaitHelpers = WaitHelpers
class StableElement {
	constructor(driver, element, waitHelpers) {
		this.driver = driver
		this.element = element
		this.waitHelpers = waitHelpers
	}
	async click() {
		await this.waitHelpers.retryAction(async () => {
			await this.driver.wait(
				selenium_webdriver_1.until.elementIsVisible(this.element),
				5000,
			)
			await this.driver.wait(
				selenium_webdriver_1.until.elementIsEnabled(this.element),
				5000,
			)
			// Scroll element into view
			await this.driver.executeScript(
				'arguments[0].scrollIntoView({block: "center"})',
				this.element,
			)
			await this.driver.sleep(100)
			// Try JavaScript click if regular click fails
			try {
				await this.element.click()
			} catch (error) {
				await this.driver.executeScript('arguments[0].click()', this.element)
			}
		})
	}
	async sendKeys(text) {
		await this.waitHelpers.retryAction(async () => {
			await this.element.clear()
			await this.element.sendKeys(text)
		})
	}
	async getText() {
		return await this.waitHelpers.retryAction(async () => {
			return await this.element.getText()
		})
	}
	async getAttribute(attribute) {
		return await this.waitHelpers.retryAction(async () => {
			return await this.element.getAttribute(attribute)
		})
	}
	async isDisplayed() {
		try {
			return await this.element.isDisplayed()
		} catch {
			return false
		}
	}
	async isEnabled() {
		try {
			return await this.element.isEnabled()
		} catch {
			return false
		}
	}
}
exports.StableElement = StableElement
