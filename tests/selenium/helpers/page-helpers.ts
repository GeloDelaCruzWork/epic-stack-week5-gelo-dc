import { WebDriver, By, WebElement } from 'selenium-webdriver'
import { WaitHelpers, StableElement } from './wait-helpers'

export class PageHelpers {
	private waitHelpers: WaitHelpers

	constructor(private driver: WebDriver) {
		this.waitHelpers = new WaitHelpers(driver)
	}

	async navigate(url: string): Promise<void> {
		await this.driver.get(url)
		await this.waitHelpers.waitForPageLoad()
	}

	async findElement(locator: By): Promise<StableElement> {
		const element = await this.waitHelpers.waitForElementVisible(locator)
		return new StableElement(this.driver, element, this.waitHelpers)
	}

	async findElements(locator: By): Promise<WebElement[]> {
		await this.waitHelpers.waitForElement(locator)
		return await this.driver.findElements(locator)
	}

	async clickElement(locator: By): Promise<void> {
		const element = await this.findElement(locator)
		await element.click()
	}

	async typeInElement(locator: By, text: string): Promise<void> {
		const element = await this.findElement(locator)
		await element.sendKeys(text)
	}

	async clearAndType(locator: By, text: string): Promise<void> {
		const element = await this.waitHelpers.waitForElementVisible(locator)
		await element.clear()
		await element.sendKeys(text)
	}

	async getElementText(locator: By): Promise<string> {
		const element = await this.findElement(locator)
		return await element.getText()
	}

	async isElementPresent(locator: By): Promise<boolean> {
		const elements = await this.driver.findElements(locator)
		return elements.length > 0
	}

	async isElementVisible(locator: By): Promise<boolean> {
		try {
			const element = await this.driver.findElement(locator)
			return await element.isDisplayed()
		} catch {
			return false
		}
	}

	async waitForText(text: string, timeout?: number): Promise<boolean> {
		return await this.waitHelpers.waitForCondition(async () => {
			const pageText = await this.driver
				.findElement(By.tagName('body'))
				.getText()
			return pageText.includes(text)
		}, timeout)
	}

	async selectDropdown(locator: By, value: string): Promise<void> {
		const select = await this.findElement(locator)
		const option = await select.element.findElement(
			By.css(`option[value="${value}"]`),
		)
		await option.click()
	}

	async getTitle(): Promise<string> {
		return await this.driver.getTitle()
	}

	async getCurrentUrl(): Promise<string> {
		return await this.driver.getCurrentUrl()
	}

	async takeScreenshot(): Promise<string> {
		return await this.driver.takeScreenshot()
	}

	async executeScript<T>(script: string, ...args: any[]): Promise<T> {
		return (await this.driver.executeScript(script, ...args)) as T
	}

	async scrollToElement(locator: By): Promise<void> {
		const element = await this.driver.findElement(locator)
		await this.driver.executeScript(
			'arguments[0].scrollIntoView({block: "center"})',
			element,
		)
		await this.driver.sleep(300) // Small delay for scroll to complete
	}

	async doubleClick(locator: By): Promise<void> {
		const element = await this.waitHelpers.waitForElementClickable(locator)
		const actions = this.driver.actions()
		await actions.doubleClick(element).perform()
	}

	async rightClick(locator: By): Promise<void> {
		const element = await this.waitHelpers.waitForElementClickable(locator)
		const actions = this.driver.actions()
		await actions.contextClick(element).perform()
	}

	async hoverElement(locator: By): Promise<void> {
		const element = await this.waitHelpers.waitForElementVisible(locator)
		const actions = this.driver.actions()
		await actions.move({ origin: element }).perform()
	}

	async dragAndDrop(sourceLocator: By, targetLocator: By): Promise<void> {
		const source = await this.waitHelpers.waitForElementVisible(sourceLocator)
		const target = await this.waitHelpers.waitForElementVisible(targetLocator)
		const actions = this.driver.actions()
		await actions.dragAndDrop(source, target).perform()
	}

	async switchToFrame(frameLocator: By | number): Promise<void> {
		if (typeof frameLocator === 'number') {
			await this.driver.switchTo().frame(frameLocator)
		} else {
			const frame = await this.driver.findElement(frameLocator)
			await this.driver.switchTo().frame(frame)
		}
	}

	async switchToDefaultContent(): Promise<void> {
		await this.driver.switchTo().defaultContent()
	}

	async acceptAlert(): Promise<void> {
		await this.driver.switchTo().alert().accept()
	}

	async dismissAlert(): Promise<void> {
		await this.driver.switchTo().alert().dismiss()
	}

	async getAlertText(): Promise<string> {
		return await this.driver.switchTo().alert().getText()
	}
}
