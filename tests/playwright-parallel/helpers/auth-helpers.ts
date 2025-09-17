import { Page } from '@playwright/test'

export class AuthHelpers {
	constructor(private page: Page) {}

	async login(
		username: string = 'kody',
		password: string = 'kodylovesyou',
	): Promise<void> {
		await this.page.goto('/login')

		// Fill login form using the actual form IDs
		await this.page.fill('#login-form-username', username)
		await this.page.fill('#login-form-password', password)

		// Submit form - use the specific login button
		await this.page.click('button[type="submit"]:has-text("Log in")')

		// Wait for navigation after login
		await this.page.waitForURL((url) => !url.pathname.includes('/login'), {
			timeout: 10000,
		})

		// Verify we're logged in
		const isLoggedIn = await this.isLoggedIn()
		if (!isLoggedIn) {
			throw new Error('Login failed - could not verify logged in state')
		}
	}

	async logout(): Promise<void> {
		// Try multiple logout selectors
		const logoutSelectors = [
			'button[form="logout-form"]',
			'a[href="/logout"]',
			'button:has-text("Logout")',
			'button:has-text("Log out")',
		]

		for (const selector of logoutSelectors) {
			const element = await this.page.locator(selector).first()
			if (await element.isVisible()) {
				await element.click()
				await this.page.waitForURL('/login', { timeout: 5000 })
				break
			}
		}
	}

	async isLoggedIn(): Promise<boolean> {
		// Check we're not on auth pages - simplest check
		const currentUrl = this.page.url()

		// After successful login, we're redirected to user page
		if (currentUrl.includes('/users/kody')) {
			return true
		}

		// Not on login page means likely logged in
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
