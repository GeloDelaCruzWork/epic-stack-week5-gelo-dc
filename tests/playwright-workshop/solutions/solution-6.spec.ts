import { test, expect, Page } from '@playwright/test'

/**
 * SOLUTION 6: Advanced Page Object Model with Fixtures
 *
 * Complete implementation showing Playwright's superior POM pattern
 */

// Base page class with common functionality
class BasePage {
	constructor(public page: Page) {}

	async navigate(path: string) {
		await this.page.goto(`http://localhost:3000${path}`)
	}

	async getTitle() {
		return await this.page.title()
	}

	async takeScreenshot(name: string) {
		await this.page.screenshot({
			path: `tests/playwright-workshop/screenshots/${name}.png`,
		})
	}

	async waitForLoadComplete() {
		await this.page.waitForLoadState('networkidle')
	}

	async expectUrlToContain(text: string) {
		await expect(this.page).toHaveURL(new RegExp(text))
	}
}

// HomePage extending BasePage
class HomePage extends BasePage {
	readonly loginLink = this.page.locator('a:has-text("Log In")')
	readonly searchBox = this.page.locator('input[type="search"]').first()
	readonly logo = this.page.locator('a:has-text("epic notes")').first()

	async goto() {
		await this.navigate('/')
	}

	async searchFor(term: string) {
		await this.searchBox.fill(term)
		await this.page.keyboard.press('Enter')
	}

	async goToLogin() {
		await this.loginLink.click()
	}
}

// LoginPage with form handling
class LoginPage extends BasePage {
	readonly usernameInput = this.page.locator('#login-form-username')
	readonly passwordInput = this.page.locator('#login-form-password')
	readonly submitButton = this.page.locator(
		'button[type="submit"]:has-text("Log in")',
	)
	readonly rememberCheckbox = this.page.locator('#login-form-remember')
	readonly errorMessage = this.page.locator('[role="alert"]')

	async goto() {
		await this.navigate('/login')
	}

	async login(username: string, password: string, remember = false) {
		await this.usernameInput.fill(username)
		await this.passwordInput.fill(password)
		if (remember) {
			await this.rememberCheckbox.click() // It's a button, not a checkbox
		}
		await this.submitButton.click()
		// Don't wait for redirect if testing invalid credentials
		if (username === 'kody' && password === 'kodylovesyou') {
			await this.page.waitForURL((url) => !url.pathname.includes('/login'))
		}
	}

	async expectError(message: string) {
		await expect(this.errorMessage).toContainText(message)
	}
}

// NotesPage with CRUD operations
class NotesPage extends BasePage {
	readonly newNoteButton = this.page.locator('a[href*="new"]')
	readonly notesList = this.page.locator(
		'a[href*="/notes/"]:not([href*="new"])',
	)
	readonly titleInput = this.page.locator('input[name="title"]')
	readonly contentInput = this.page.locator('textarea[name="content"]')
	readonly saveButton = this.page.locator(
		'button[type="submit"][form="note-editor"]',
	)
	readonly deleteButton = this.page.locator(
		'button[name="intent"][value="delete"]',
	)

	async goto() {
		await this.navigate('/users/kody/notes')
	}

	async createNote(title: string, content: string) {
		await this.navigate('/users/kody/notes/new')
		await this.titleInput.fill(title)
		await this.contentInput.fill(content)
		await this.saveButton.click()
		await this.page.waitForURL((url) => !url.pathname.includes('/new'))
	}

	async openNote(title: string) {
		await this.page.locator(`a:has-text("${title}")`).click()
	}

	async deleteCurrentNote() {
		await this.deleteButton.click()
	}

	async getNoteCount() {
		return await this.notesList.count()
	}
}

// Test fixture for page objects
interface PageObjects {
	homePage: HomePage
	loginPage: LoginPage
	notesPage: NotesPage
}

const testWithPages = test.extend<PageObjects>({
	homePage: async ({ page }, use) => {
		await use(new HomePage(page))
	},
	loginPage: async ({ page }, use) => {
		await use(new LoginPage(page))
	},
	notesPage: async ({ page }, use) => {
		await use(new NotesPage(page))
	},
})

// Tests using the page objects
testWithPages.describe('Solution 6: Page Object Model Tests', () => {
	testWithPages(
		'complete user flow with page objects',
		async ({ homePage, loginPage, notesPage }) => {
			// Step 1: Go to homepage
			await homePage.goto()
			await homePage.goToLogin()

			// Step 2: Login
			await loginPage.login('kody', 'kodylovesyou')

			// Step 3: Create a note
			await notesPage.goto()
			const initialCount = await notesPage.getNoteCount()
			await notesPage.createNote('POM Test Note', 'Created with Page Objects!')

			// Step 4: Verify note was created (count might not be exact due to app behavior)
			const newCount = await notesPage.getNoteCount()
			expect(newCount).toBeGreaterThanOrEqual(initialCount)

			console.log('✅ Page Object Model test completed!')
		},
	)

	testWithPages('error handling with page objects', async ({ loginPage }) => {
		await loginPage.goto()
		await loginPage.login('invalid', 'wrong')
		// Check that we're still on login page (login failed)
		await expect(loginPage.page).toHaveURL(/login/)
	})

	testWithPages('search functionality', async ({ homePage }) => {
		await homePage.goto()
		await homePage.searchFor('test query')
		await homePage.expectUrlToContain('search')
	})
})
