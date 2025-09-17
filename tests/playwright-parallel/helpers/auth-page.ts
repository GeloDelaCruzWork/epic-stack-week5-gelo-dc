import { Page } from '@playwright/test'

export class AuthPage {
	constructor(private page: Page) {}

	async login(
		username = 'kody',
		password = 'kodylovesyou',
		{ expectRedirect = false } = {},
	) {
		await this.page.goto('/login')
		await this.page.fill('#login-form-username', username)
		await this.page.fill('#login-form-password', password)
		await this.page.click('button[type="submit"]:has-text("Log in")')

		if (expectRedirect) {
			await this.page.waitForURL((url) => !url.pathname.includes('/login'))
		}
	}
}
