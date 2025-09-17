import { WebDriver, By } from 'selenium-webdriver'
import { PageHelpers } from './page-helpers'
import { config } from '../config/selenium.config'

export class AuthHelpers {
	private pageHelpers: PageHelpers

	constructor(private driver: WebDriver) {
		this.pageHelpers = new PageHelpers(driver)
	}

	async login(
		username: string = 'kody',
		password: string = 'kodylovesyou',
	): Promise<void> {
		await this.pageHelpers.navigate(`${config.baseUrl}/login`)

		// Wait for login form to be ready
		await this.driver.sleep(500)

		// Enter username
		await this.pageHelpers.clearAndType(
			By.css(
				'input[name="username"], input[name="email"], input[type="email"]',
			),
			username,
		)

		// Enter password
		await this.pageHelpers.clearAndType(
			By.css('input[name="password"], input[type="password"]'),
			password,
		)

		// Click login button
		await this.pageHelpers.clickElement(
			By.css(
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

	async logout(): Promise<void> {
		// Try to find and click logout button
		const logoutSelectors = [
			By.css('button[form="logout-form"]'),
			By.css('a[href="/logout"]'),
			By.xpath('//button[contains(text(), "Logout")]'),
			By.xpath('//button[contains(text(), "Log out")]'),
			By.xpath('//a[contains(text(), "Logout")]'),
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

	async isLoggedIn(): Promise<boolean> {
		// Check for common indicators of being logged in
		const loggedInSelectors = [
			By.css('button[form="logout-form"]'),
			By.css('[data-testid="user-menu"]'),
			By.css('[aria-label="User menu"]'),
			By.xpath('//button[contains(text(), "Logout")]'),
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

	async ensureLoggedIn(username?: string, password?: string): Promise<void> {
		const isLoggedIn = await this.isLoggedIn()
		if (!isLoggedIn) {
			await this.login(username, password)
		}
	}

	async ensureLoggedOut(): Promise<void> {
		const isLoggedIn = await this.isLoggedIn()
		if (isLoggedIn) {
			await this.logout()
		}
	}
}
