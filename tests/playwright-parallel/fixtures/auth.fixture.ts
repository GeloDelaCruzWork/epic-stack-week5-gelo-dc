import { test as base, Page } from '@playwright/test'
import { AuthPage } from '../helpers/auth-page'

export type AuthFixtures = {
	authPage: AuthPage
	authenticatedPage: Page
}

export const test = base.extend<AuthFixtures>({
	authPage: async ({ page }, use) => {
		await use(new AuthPage(page))
	},
	authenticatedPage: async ({ page, authPage }, use) => {
		await authPage.login('kody', 'kodylovesyou', { expectRedirect: true })
		await use(page)
	},
})

export { expect } from '@playwright/test'
