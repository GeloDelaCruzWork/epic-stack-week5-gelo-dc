import { WebDriver, WebElement, By, until, Condition } from 'selenium-webdriver'

export class WaitHelpers {
	constructor(
		private driver: WebDriver,
		private defaultTimeout: number = 10000,
	) {}

	async waitForElement(locator: By, timeout?: number): Promise<WebElement> {
		const wait = timeout || this.defaultTimeout
		return await this.driver.wait(until.elementLocated(locator), wait)
	}

	async waitForElementVisible(
		locator: By,
		timeout?: number,
	): Promise<WebElement> {
		const wait = timeout || this.defaultTimeout
		const element = await this.waitForElement(locator, wait)
		await this.driver.wait(until.elementIsVisible(element), wait)
		return element
	}

	async waitForElementClickable(
		locator: By,
		timeout?: number,
	): Promise<WebElement> {
		const wait = timeout || this.defaultTimeout
		const element = await this.waitForElementVisible(locator, wait)
		await this.driver.wait(until.elementIsEnabled(element), wait)
		return element
	}

	async waitForText(
		locator: By | string,
		text: string,
		timeout?: number,
	): Promise<boolean> {
		// If locator is a string, search for it in the page body
		if (typeof locator === 'string') {
			const wait = timeout || this.defaultTimeout
			return await this.driver.wait(async () => {
				const pageText = await this.driver
					.findElement(By.tagName('body'))
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

	async waitForUrl(
		urlPattern: string | RegExp,
		timeout?: number,
	): Promise<boolean> {
		const wait = timeout || this.defaultTimeout
		return await this.driver.wait(async () => {
			const currentUrl = await this.driver.getCurrentUrl()
			if (typeof urlPattern === 'string') {
				return currentUrl.includes(urlPattern)
			}
			return urlPattern.test(currentUrl)
		}, wait)
	}

	async waitForElementToDisappear(
		locator: By,
		timeout?: number,
	): Promise<boolean> {
		const wait = timeout || this.defaultTimeout
		return await this.driver.wait(async () => {
			const elements = await this.driver.findElements(locator)
			return elements.length === 0
		}, wait)
	}

	async waitForCondition(
		condition: () => Promise<boolean>,
		timeout?: number,
		message?: string,
	): Promise<boolean> {
		const wait = timeout || this.defaultTimeout
		return await this.driver.wait(condition, wait, message)
	}

	async waitForPageLoad(timeout?: number): Promise<void> {
		const wait = timeout || this.defaultTimeout
		await this.driver.wait(async () => {
			const readyState = await this.driver.executeScript(
				'return document.readyState',
			)
			return readyState === 'complete'
		}, wait)
	}

	async waitForAjax(timeout?: number): Promise<void> {
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

	async retryAction<T>(
		action: () => Promise<T>,
		maxRetries: number = 3,
		delayMs: number = 1000,
	): Promise<T> {
		let lastError: Error | undefined

		for (let i = 0; i < maxRetries; i++) {
			try {
				return await action()
			} catch (error) {
				lastError = error as Error
				if (i < maxRetries - 1) {
					await this.driver.sleep(delayMs)
				}
			}
		}

		throw lastError || new Error('Action failed after retries')
	}
}

export class StableElement {
	constructor(
		private driver: WebDriver,
		public element: WebElement,
		private waitHelpers: WaitHelpers,
	) {}

	async click(): Promise<void> {
		await this.waitHelpers.retryAction(async () => {
			await this.driver.wait(until.elementIsVisible(this.element), 5000)
			await this.driver.wait(until.elementIsEnabled(this.element), 5000)

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

	async sendKeys(text: string): Promise<void> {
		await this.waitHelpers.retryAction(async () => {
			await this.element.clear()
			await this.element.sendKeys(text)
		})
	}

	async getText(): Promise<string> {
		return await this.waitHelpers.retryAction(async () => {
			return await this.element.getText()
		})
	}

	async getAttribute(attribute: string): Promise<string> {
		return await this.waitHelpers.retryAction(async () => {
			return await this.element.getAttribute(attribute)
		})
	}

	async isDisplayed(): Promise<boolean> {
		try {
			return await this.element.isDisplayed()
		} catch {
			return false
		}
	}

	async isEnabled(): Promise<boolean> {
		try {
			return await this.element.isEnabled()
		} catch {
			return false
		}
	}
}
