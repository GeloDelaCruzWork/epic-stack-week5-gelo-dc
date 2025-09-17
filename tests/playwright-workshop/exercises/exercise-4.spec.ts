import { test, expect, Page } from '@playwright/test'

/**
 * EXERCISE 4: Page Object Model
 *
 * Implement Page Object Model pattern with Playwright
 * Much cleaner than Selenium's POM implementation!
 *
 * TASK: Create page objects for better test organization
 * TIME: 25 minutes (vs 45 minutes for Selenium)
 */

// TODO 1: Create LoginPage class
class LoginPage {
	constructor(private page: Page) {}

	// TODO 2: Add navigation method
	async goto() {
		// await this.page.goto('http://localhost:3000/login')
	}

	// TODO 3: Add login method
	async login(username: string, password: string) {
		// await this.page.fill('#login-form-username', username)
		// await this.page.fill('#login-form-password', password)
		// await this.page.click('button:has-text("Log in")')
	}

	// TODO 4: Add validation methods
	async isLoggedIn() {
		// return !this.page.url().includes('/login')
	}
}

// TODO 5: Create NotesPage class
class NotesPage {
	constructor(private page: Page) {}

	async goto() {
		// Navigate to notes
	}

	async createNote(title: string, content: string) {
		// Create a new note
	}

	async deleteNote(title: string) {
		// Delete a note by title
	}
}

test.describe('Exercise 4: Page Object Model', () => {
	test('should use page objects for login', async ({ page }) => {
		// TODO 6: Use the LoginPage class
		// const loginPage = new LoginPage(page)
		// await loginPage.goto()
		// await loginPage.login('kody', 'kodylovesyou')
		// expect(await loginPage.isLoggedIn()).toBe(true)
	})

	test('should use page objects for notes', async ({ page }) => {
		// TODO 7: Use both page objects together
		// const loginPage = new LoginPage(page)
		// const notesPage = new NotesPage(page)
		// Login first
		// Then create a note using page object
	})
})

/**
 * ADVANTAGES OVER SELENIUM:
 * - TypeScript support out of the box
 * - Better encapsulation with private members
 * - Async/await throughout
 * - No need for PageFactory pattern
 */
