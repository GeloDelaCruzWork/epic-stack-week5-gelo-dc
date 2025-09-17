const { By, until, Key } = require('selenium-webdriver')

/**
 * Page Object for Notes functionality
 */
class NotesPage {
	constructor(driver, username = 'kody') {
		this.driver = driver
		this.username = username
		this.baseUrl = 'http://localhost:3000'
		this.url = `${this.baseUrl}/users/${username}/notes`

		// Locators
		this.locators = {
			newNoteButton: By.xpath(
				'//a[contains(text(), "+") or contains(@aria-label, "add") or contains(@aria-label, "new") or contains(@aria-label, "create") or contains(@class, "fixed")]',
			),
			newNoteButtonAlt: By.css(
				'[aria-label*="add"], [aria-label*="new"], [aria-label*="create"], .fab, .floating-action-button, button[class*="fixed"], a[class*="fixed"]',
			),
			notesList: By.css(
				'[data-testid*="note"], .note-item, article, a[href*="/notes/"]',
			),
			searchInput: By.css('input[type="search"], input[name="search"]'),
			titleInput: By.css('input[name="title"], input[id*="title"]'),
			contentTextarea: By.css(
				'textarea[name="content"], textarea[id*="content"]',
			),
			saveButton: By.css('button[type="submit"]'),
			deleteButton: By.xpath(
				'//button[contains(@aria-label, "Delete") or contains(text(), "Delete")]',
			),
			editLink: By.xpath('//a[contains(text(), "Edit")]'),
			noteTitle: By.css('h1, h2, [data-testid="note-title"]'),
			noteContent: By.css(
				'.note-content, article p, [data-testid="note-content"]',
			),
			errorMessage: By.css('[role="alert"], .error-message'),
			emptyState: By.xpath(
				'//*[contains(text(), "No notes") or contains(text(), "no notes")]',
			),
		}
	}

	// Navigation
	async goto() {
		await this.driver.get(this.url)
		await this.driver.sleep(2000)
		return this
	}

	async gotoNewNote() {
		try {
			// Try primary selector
			const button = await this.driver.findElement(this.locators.newNoteButton)
			await button.click()
		} catch (e) {
			try {
				// Try alternate selector
				const button = await this.driver.findElement(
					this.locators.newNoteButtonAlt,
				)
				await button.click()
			} catch (e2) {
				// Try direct navigation as fallback
				await this.driver.get(
					`${this.baseUrl}/users/${this.username}/notes/new`,
				)
			}
		}

		await this.driver.sleep(2000)

		// Check if we made it to the new note page
		const currentUrl = await this.driver.getCurrentUrl()
		if (!currentUrl.includes('/new')) {
			throw new Error('Could not navigate to new note page')
		}

		return this
	}

	async gotoNote(index = 0) {
		const notes = await this.driver.findElements(this.locators.notesList)
		if (notes.length > index) {
			await notes[index].click()
			await this.driver.sleep(1000)
		}
		return this
	}

	// CRUD Operations
	async createNote(title, content) {
		await this.gotoNewNote()

		// Find and fill title
		try {
			const titleInput = await this.driver.findElement(this.locators.titleInput)
			await titleInput.sendKeys(title)
		} catch (e) {
			throw new Error('Could not find title input field')
		}

		// Find and fill content
		try {
			const contentInput = await this.driver.findElement(
				this.locators.contentTextarea,
			)
			await contentInput.sendKeys(content)
		} catch (e) {
			throw new Error('Could not find content textarea')
		}

		// Save the note
		try {
			const saveButton = await this.driver.findElement(this.locators.saveButton)
			await saveButton.click()
		} catch (e) {
			throw new Error('Could not find save button')
		}

		await this.driver.sleep(3000)

		// Check if note was created (URL should change)
		const currentUrl = await this.driver.getCurrentUrl()
		if (currentUrl.includes('/login')) {
			throw new Error('Not authenticated - redirected to login')
		}

		return this
	}

	async editNote(newTitle = null, newContent = null) {
		const editLink = await this.driver.findElement(this.locators.editLink)
		await editLink.click()

		await this.driver.wait(until.urlContains('/edit'), 5000)

		if (newTitle) {
			const titleInput = await this.driver.findElement(this.locators.titleInput)
			await titleInput.clear()
			await titleInput.sendKeys(newTitle)
		}

		if (newContent) {
			const contentInput = await this.driver.findElement(
				this.locators.contentTextarea,
			)
			await contentInput.clear()
			await contentInput.sendKeys(newContent)
		}

		const saveButton = await this.driver.findElement(this.locators.saveButton)
		await saveButton.click()

		await this.driver.sleep(2000)
		return this
	}

	async deleteNote() {
		try {
			const deleteButton = await this.driver.findElement(
				this.locators.deleteButton,
			)
			await deleteButton.click()

			// Handle confirmation if needed
			await this.driver.sleep(1000)
			try {
				const confirmButton = await this.driver.findElement(
					By.css('button[type="submit"]'),
				)
				await confirmButton.click()
			} catch (e) {
				// No confirmation needed
			}

			await this.driver.sleep(2000)
		} catch (e) {
			throw new Error('Delete button not found')
		}
		return this
	}

	// Search
	async searchNotes(query) {
		const searchInput = await this.driver.findElement(this.locators.searchInput)
		await searchInput.clear()
		await searchInput.sendKeys(query)
		await searchInput.sendKeys(Key.ENTER)
		await this.driver.sleep(2000)
		return this
	}

	// Getters
	async getNoteCount() {
		const notes = await this.driver.findElements(this.locators.notesList)
		return notes.length
	}

	async getNoteTitle() {
		try {
			const title = await this.driver.findElement(this.locators.noteTitle)
			return await title.getText()
		} catch (e) {
			return null
		}
	}

	async getNoteContent() {
		try {
			const content = await this.driver.findElement(this.locators.noteContent)
			return await content.getText()
		} catch (e) {
			return null
		}
	}

	async getNoteTitles() {
		const notes = await this.driver.findElements(this.locators.notesList)
		const titles = []
		for (const note of notes) {
			try {
				const text = await note.getText()
				titles.push(text.split('\n')[0]) // First line is usually title
			} catch (e) {
				// Skip if can't get text
			}
		}
		return titles
	}

	// Validation
	async hasError() {
		try {
			const error = await this.driver.findElement(this.locators.errorMessage)
			return await error.isDisplayed()
		} catch (e) {
			return false
		}
	}

	async isEmpty() {
		try {
			const emptyState = await this.driver.findElement(this.locators.emptyState)
			return await emptyState.isDisplayed()
		} catch (e) {
			return false
		}
	}

	async isOnNotesPage() {
		const url = await this.driver.getCurrentUrl()
		return url.includes('/notes')
	}

	async isOnNoteDetail() {
		const url = await this.driver.getCurrentUrl()
		return url.match(/\/notes\/[a-z0-9]+$/) !== null
	}

	// Utilities
	async waitForNoteCreation(timeout = 10000) {
		await this.driver.wait(
			until.urlMatches(/\/notes\/[a-z0-9]+$/),
			timeout,
			'Note creation timeout',
		)
		return this
	}

	async waitForNotesLoad(timeout = 5000) {
		await this.driver.wait(
			async () => {
				const notes = await this.driver.findElements(this.locators.notesList)
				return notes.length > 0 || (await this.isEmpty())
			},
			timeout,
			'Notes load timeout',
		)
		return this
	}

	async takeScreenshot() {
		return await this.driver.takeScreenshot()
	}
}

module.exports = NotesPage
