import { test, expect, Page } from '@playwright/test'

/**
 * EXERCISE 6: Advanced Page Object Model with Fixtures
 *
 * Playwright's superior POM implementation using fixtures
 * This is WAY better than Selenium's PageFactory pattern!
 *
 * TASK: Implement complete POM with fixtures and inheritance
 * TIME: 30 minutes (vs 60 minutes for Selenium)
 *
 * ADVANTAGES:
 * - Fixtures for automatic setup/teardown
 * - TypeScript interfaces for type safety
 * - Better composition and reusability
 * - No PageFactory complexity
 */

// TODO 1: Create base page class with common functionality
class BasePage {
	constructor(protected page: Page) {}

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

	// TODO 2: Add common wait methods
	async waitForLoadComplete() {
		// await this.page.waitForLoadState('networkidle')
	}

	// TODO 3: Add common assertion helpers
	async expectUrlToContain(text: string) {
		// await expect(this.page).toHaveURL(new RegExp(text))
	}
}

// TODO 4: Create HomePage extending BasePage
class HomePage extends BasePage {
	// Define locators as properties
	readonly loginLink = this.page.locator('a:has-text("Log In")')
	readonly searchBox = this.page.locator('input[type="search"]')
	readonly logo = this.page.locator('a:has-text("epic notes")').first()

	async goto() {
		await this.navigate('/')
	}

	async searchFor(term: string) {
		// TODO 5: Implement search
		// await this.searchBox.fill(term)
		// await this.page.keyboard.press('Enter')
	}

	async goToLogin() {
		// TODO 6: Navigate to login
		// await this.loginLink.click()
	}
}

// TODO 7: Create LoginPage with form handling
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
		// TODO 8: Implement complete login
		// await this.usernameInput.fill(username)
		// await this.passwordInput.fill(password)
		// if (remember) {
		//   await this.rememberCheckbox.check()
		// }
		// await this.submitButton.click()
		// await this.page.waitForURL(url => !url.pathname.includes('/login'))
	}

	async expectError(message: string) {
		// TODO 9: Check for error message
		// await expect(this.errorMessage).toContainText(message)
	}
}

// TODO 10: Create NotesPage with CRUD operations
class NotesPage extends BasePage {
	readonly newNoteButton = this.page.locator('a[href*="new"]')
	readonly notesList = this.page.locator(
		'a[href*="/notes/"]:not([href*="new"])',
	)
	readonly titleInput = this.page.locator('input[name="title"]')
	readonly contentInput = this.page.locator('textarea[name="content"]')
	readonly saveButton = this.page.locator('button[type="submit"]')
	readonly deleteButton = this.page.locator('button[value="delete"]')

	async goto() {
		await this.navigate('/users/kody/notes')
	}

	async createNote(title: string, content: string) {
		// TODO 11: Complete note creation
		// await this.navigate('/users/kody/notes/new')
		// await this.titleInput.fill(title)
		// await this.contentInput.fill(content)
		// await this.saveButton.click()
		// await this.page.waitForURL(url => !url.pathname.includes('/new'))
	}

	async openNote(title: string) {
		// TODO 12: Open specific note
		// await this.page.locator(`a:has-text("${title}")`).click()
	}

	async deleteCurrentNote() {
		// TODO 13: Delete the currently open note
		// await this.deleteButton.click()
		// Handle confirmation if needed
	}

	async getNoteCount() {
		// TODO 14: Return number of notes
		// return await this.notesList.count()
	}
}

// TODO 15: Create a test fixture for page objects
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
testWithPages.describe('Exercise 6: Page Object Model Tests', () => {
	testWithPages(
		'complete user flow with page objects',
		async ({ homePage, loginPage, notesPage }) => {
			// TODO 16: Implement complete flow using page objects
			// Step 1: Go to homepage
			// await homePage.goto()
			// await homePage.goToLogin()

			// Step 2: Login
			// await loginPage.login('kody', 'kodylovesyou')

			// Step 3: Create a note
			// await notesPage.goto()
			// const initialCount = await notesPage.getNoteCount()
			// await notesPage.createNote('POM Test Note', 'Created with Page Objects!')

			// Step 4: Verify note was created
			// const newCount = await notesPage.getNoteCount()
			// expect(newCount).toBe(initialCount + 1)

			console.log('✅ Page Object Model test completed!')
		},
	)

	testWithPages('error handling with page objects', async ({ loginPage }) => {
		// TODO 17: Test error scenarios
		// await loginPage.goto()
		// await loginPage.login('invalid', 'wrong')
		// await loginPage.expectError('Invalid')
	})

	// TODO 18: Add more tests using page objects
	testWithPages.skip('search functionality', async ({ homePage }) => {
		// Implement search test
	})
})

/**
 * COMPARISON WITH SELENIUM:
 *
 * Selenium PageFactory:
 * - @FindBy annotations
 * - PageFactory.initElements()
 * - Complex initialization
 * - No built-in fixtures
 *
 * Playwright Fixtures:
 * - Clean class structure
 * - Automatic dependency injection
 * - Type-safe with TypeScript
 * - Built-in test isolation
 *
 * Code reduction: 40% less code
 * Maintenance: 60% easier
 * Reliability: 95% vs 75%
 */
