import { test, expect, Page } from '@playwright/test'

/**
 * SOLUTION 4: Page Object Model
 *
 * Complete implementation of Page Object Model pattern
 */

// LoginPage class
class LoginPage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto('http://localhost:3000/login')
	}

	async login(username: string, password: string) {
		await this.page.fill('#login-form-username', username)
		await this.page.fill('#login-form-password', password)
		await this.page.click('button[type="submit"]:has-text("Log in")')
	}

	async isLoggedIn() {
		return !this.page.url().includes('/login')
	}
}

// NotesPage class
class NotesPage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto('http://localhost:3000/users/kody/notes')
	}

	async createNote(title: string, content: string) {
		await this.page.goto('http://localhost:3000/users/kody/notes')
		await this.page.click('a[href*="new"]')
		await this.page.fill('input[name="title"]', title)
		await this.page.fill('textarea[name="content"]', content)
		await this.page.click('button[type="submit"][form="note-editor"]')
		await this.page.waitForTimeout(1000)
	}

	async deleteNote(title: string) {
		await this.page.click(`a:has-text("${title}")`)
		const deleteBtn = this.page
			.locator(
				'button:has-text("Delete"), button[name="intent"][value="delete"]',
			)
			.first()
		if (await deleteBtn.isVisible()) {
			await deleteBtn.click()
		}
	}

	async getNoteCount() {
		return await this.page
			.locator('a[href*="/notes/"]:not([href*="new"])')
			.count()
	}

	async noteExists(title: string) {
		return await this.page.locator(`a:has-text("${title}")`).isVisible()
	}
}

test.describe('Solution 4: Page Object Model', () => {
	test('should use page objects for login', async ({ page }) => {
		const loginPage = new LoginPage(page)

		await loginPage.goto()
		await loginPage.login('kody', 'kodylovesyou')

		// Wait for navigation
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		expect(await loginPage.isLoggedIn()).toBe(true)
		console.log('✅ Login with page object successful!')
	})

	test('should use page objects for notes', async ({ page }) => {
		const loginPage = new LoginPage(page)
		const notesPage = new NotesPage(page)

		// Login first
		await loginPage.goto()
		await loginPage.login('kody', 'kodylovesyou')
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		// Create a note using page object
		const timestamp = Date.now()
		const noteTitle = `POM Test Note ${timestamp}`
		const noteContent = `Content created with Page Object Model`

		await notesPage.createNote(noteTitle, noteContent)

		// Verify note was created by checking if we can see it
		await notesPage.goto()
		expect(await notesPage.noteExists(noteTitle)).toBe(true)

		// The Page Object Model pattern is working!
		console.log('✅ Notes management with page objects successful!')
	})

	test('complete flow with page objects', async ({ page }) => {
		const loginPage = new LoginPage(page)
		const notesPage = new NotesPage(page)

		// Complete flow using page objects
		await loginPage.goto()
		await loginPage.login('kody', 'kodylovesyou')
		await page.waitForURL((url) => !url.pathname.includes('/login'))

		// Create multiple notes
		const noteCount = 3
		const notes = []

		for (let i = 1; i <= noteCount; i++) {
			const title = `POM Note ${i} - ${Date.now()}`
			await notesPage.createNote(title, `Content ${i}`)
			notes.push(title)
		}

		// Verify all notes exist
		await notesPage.goto()
		for (const title of notes) {
			expect(await notesPage.noteExists(title)).toBe(true)
		}

		// Clean up
		for (const title of notes) {
			await notesPage.deleteNote(title)
			await notesPage.goto()
		}

		console.log('✅ Complete flow with page objects successful!')
	})
})
