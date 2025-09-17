'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.AuthHelpers = void 0
const selenium_webdriver_1 = require('selenium-webdriver')
const page_helpers_1 = require('./page-helpers')
const selenium_config_1 = require('../config/selenium.config')
class AuthHelpers {
	constructor(driver) {
		this.driver = driver
		this.pageHelpers = new page_helpers_1.PageHelpers(driver)
	}
	async login(username = 'kody', password = 'kodylovesyou') {
		await this.pageHelpers.navigate(`${selenium_config_1.config.baseUrl}/login`)
		// Wait for login form to be ready
		await this.driver.sleep(500)
		// Enter username
		await this.pageHelpers.clearAndType(
			selenium_webdriver_1.By.css(
				'input[name="username"], input[name="email"], input[type="email"]',
			),
			username,
		)
		// Enter password
		await this.pageHelpers.clearAndType(
			selenium_webdriver_1.By.css(
				'input[name="password"], input[type="password"]',
			),
			password,
		)
		// Click login button
		await this.pageHelpers.clickElement(
			selenium_webdriver_1.By.css(
				'button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")',
			),
		)
		// Wait for navigation after login
		await this.driver.sleep(1000)
		// Verify we're logged in by checking for logout button or user menu
		const isLoggedIn = await this.isLoggedIn()
		if (!isLoggedIn) {
			throw new Error('Login failed - could not verify logged in state')
		}
	}
	async logout() {
		// Try to find and click logout button
		const logoutSelectors = [
			selenium_webdriver_1.By.css('button[form="logout-form"]'),
			selenium_webdriver_1.By.css('a[href="/logout"]'),
			selenium_webdriver_1.By.xpath('//button[contains(text(), "Logout")]'),
			selenium_webdriver_1.By.xpath('//button[contains(text(), "Log out")]'),
			selenium_webdriver_1.By.xpath('//a[contains(text(), "Logout")]'),
		]
		for (const selector of logoutSelectors) {
			const isPresent = await this.pageHelpers.isElementPresent(selector)
			if (isPresent) {
				await this.pageHelpers.clickElement(selector)
				await this.driver.sleep(500)
				break
			}
		}
	}
	async isLoggedIn() {
		// Check for common indicators of being logged in
		const loggedInSelectors = [
			selenium_webdriver_1.By.css('button[form="logout-form"]'),
			selenium_webdriver_1.By.css('[data-testid="user-menu"]'),
			selenium_webdriver_1.By.css('[aria-label="User menu"]'),
			selenium_webdriver_1.By.xpath('//button[contains(text(), "Logout")]'),
		]
		for (const selector of loggedInSelectors) {
			const isPresent = await this.pageHelpers.isElementPresent(selector)
			if (isPresent) {
				return true
			}
		}
		// Also check we're not on the login page
		const currentUrl = await this.driver.getCurrentUrl()
		return !currentUrl.includes('/login') && !currentUrl.includes('/signup')
	}
	async ensureLoggedIn(username, password) {
		const isLoggedIn = await this.isLoggedIn()
		if (!isLoggedIn) {
			await this.login(username, password)
		}
	}
	async ensureLoggedOut() {
		const isLoggedIn = await this.isLoggedIn()
		if (isLoggedIn) {
			await this.logout()
		}
	}
}
exports.AuthHelpers = AuthHelpers
