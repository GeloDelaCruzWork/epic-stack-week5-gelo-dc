'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.PageHelpers = void 0
const selenium_webdriver_1 = require('selenium-webdriver')
const wait_helpers_1 = require('./wait-helpers')
class PageHelpers {
	constructor(driver) {
		this.driver = driver
		this.waitHelpers = new wait_helpers_1.WaitHelpers(driver)
	}
	async navigate(url) {
		await this.driver.get(url)
		await this.waitHelpers.waitForPageLoad()
	}
	async findElement(locator) {
		const element = await this.waitHelpers.waitForElementVisible(locator)
		return new wait_helpers_1.StableElement(
			this.driver,
			element,
			this.waitHelpers,
		)
	}
	async findElements(locator) {
		await this.waitHelpers.waitForElement(locator)
		return await this.driver.findElements(locator)
	}
	async clickElement(locator) {
		const element = await this.findElement(locator)
		await element.click()
	}
	async typeInElement(locator, text) {
		const element = await this.findElement(locator)
		await element.sendKeys(text)
	}
	async clearAndType(locator, text) {
		const element = await this.waitHelpers.waitForElementVisible(locator)
		await element.clear()
		await element.sendKeys(text)
	}
	async getElementText(locator) {
		const element = await this.findElement(locator)
		return await element.getText()
	}
	async isElementPresent(locator) {
		const elements = await this.driver.findElements(locator)
		return elements.length > 0
	}
	async isElementVisible(locator) {
		try {
			const element = await this.driver.findElement(locator)
			return await element.isDisplayed()
		} catch {
			return false
		}
	}
	async waitForText(text, timeout) {
		return await this.waitHelpers.waitForCondition(async () => {
			const pageText = await this.driver
				.findElement(selenium_webdriver_1.By.tagName('body'))
				.getText()
			return pageText.includes(text)
		}, timeout)
	}
	async selectDropdown(locator, value) {
		const select = await this.findElement(locator)
		const option = await select.element.findElement(
			selenium_webdriver_1.By.css(`option[value="${value}"]`),
		)
		await option.click()
	}
	async getTitle() {
		return await this.driver.getTitle()
	}
	async getCurrentUrl() {
		return await this.driver.getCurrentUrl()
	}
	async takeScreenshot() {
		return await this.driver.takeScreenshot()
	}
	async executeScript(script, ...args) {
		return await this.driver.executeScript(script, ...args)
	}
	async scrollToElement(locator) {
		const element = await this.driver.findElement(locator)
		await this.driver.executeScript(
			'arguments[0].scrollIntoView({block: "center"})',
			element,
		)
		await this.driver.sleep(300) // Small delay for scroll to complete
	}
	async doubleClick(locator) {
		const element = await this.waitHelpers.waitForElementClickable(locator)
		const actions = this.driver.actions()
		await actions.doubleClick(element).perform()
	}
	async rightClick(locator) {
		const element = await this.waitHelpers.waitForElementClickable(locator)
		const actions = this.driver.actions()
		await actions.contextClick(element).perform()
	}
	async hoverElement(locator) {
		const element = await this.waitHelpers.waitForElementVisible(locator)
		const actions = this.driver.actions()
		await actions.move({ origin: element }).perform()
	}
	async dragAndDrop(sourceLocator, targetLocator) {
		const source = await this.waitHelpers.waitForElementVisible(sourceLocator)
		const target = await this.waitHelpers.waitForElementVisible(targetLocator)
		const actions = this.driver.actions()
		await actions.dragAndDrop(source, target).perform()
	}
	async switchToFrame(frameLocator) {
		if (typeof frameLocator === 'number') {
			await this.driver.switchTo().frame(frameLocator)
		} else {
			const frame = await this.driver.findElement(frameLocator)
			await this.driver.switchTo().frame(frame)
		}
	}
	async switchToDefaultContent() {
		await this.driver.switchTo().defaultContent()
	}
	async acceptAlert() {
		await this.driver.switchTo().alert().accept()
	}
	async dismissAlert() {
		await this.driver.switchTo().alert().dismiss()
	}
	async getAlertText() {
		return await this.driver.switchTo().alert().getText()
	}
}
exports.PageHelpers = PageHelpers
