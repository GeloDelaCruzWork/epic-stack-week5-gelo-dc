import { WebDriver, By } from 'selenium-webdriver'
import { expect } from 'chai'
import { createDriver, config } from '../config/selenium.config'
import { PageHelpers } from '../helpers/page-helpers'
import { AuthHelpers } from '../helpers/auth-helpers'
import { WaitHelpers } from '../helpers/wait-helpers'

describe('Notes Management', function () {
	this.timeout(30000) // Set default timeout for all tests

	let driver: WebDriver
	let pageHelpers: PageHelpers
	let authHelpers: AuthHelpers
	let waitHelpers: WaitHelpers

	before(async function () {
		driver = await createDriver()
		pageHelpers = new PageHelpers(driver)
		authHelpers = new AuthHelpers(driver)
		waitHelpers = new WaitHelpers(driver)
	})

	after(async function () {
		if (driver) {
			await driver.quit()
		}
	})

	beforeEach(async function () {
		// Ensure we're logged in before each test
		await authHelpers.ensureLoggedIn()
	})

	it('should allow users to create notes', async function () {
		// Navigate to notes page
		await pageHelpers.navigate(`${config.baseUrl}/users/kody/notes`)

		// Wait for page to load
		await driver.sleep(1000)

		// Click on new note button/link
		const newNoteSelectors = [
			By.css('a[href*="new"]'),
			By.xpath('//a[contains(text(), "New")]'),
			By.css('button:has-text("New Note")'),
			By.css('[data-testid="new-note"]'),
		]

		let clicked = false
		for (const selector of newNoteSelectors) {
			const isPresent = await pageHelpers.isElementPresent(selector)
			if (isPresent) {
				await pageHelpers.clickElement(selector)
				clicked = true
				break
			}
		}

		if (!clicked) {
			// If no new note button found, navigate directly
			await pageHelpers.navigate(`${config.baseUrl}/users/kody/notes/new`)
		}

		await driver.sleep(1000)

		// Fill in note title
		const titleInput = await waitHelpers.waitForElementVisible(
			By.css('input[name="title"], input[type="text"]'),
			5000,
		)
		await titleInput.clear()
		await titleInput.sendKeys('Test Note from Selenium')

		// Fill in note content
		const contentSelectors = [
			By.css('textarea[name="content"]'),
			By.css('textarea'),
			By.css('[contenteditable="true"]'),
		]

		for (const selector of contentSelectors) {
			const isPresent = await pageHelpers.isElementPresent(selector)
			if (isPresent) {
				await pageHelpers.clearAndType(
					selector,
					'This is a test note created by Selenium WebDriver with better wait strategies.',
				)
				break
			}
		}

		// Submit the form
		await pageHelpers.clickElement(By.css('button[type="submit"]'))

		// Wait for navigation
		await driver.sleep(2000)

		// Verify note was created
		const noteCreated = await pageHelpers.waitForText(
			'Test Note from Selenium',
			5000,
		)
		expect(noteCreated).to.be.true
	})

	it('should allow users to edit notes', async function () {
		// First create a note
		await pageHelpers.navigate(`${config.baseUrl}/users/kody/notes`)
		await driver.sleep(1000)

		// Find and click on an existing note or create one first
		const noteLinks = await driver.findElements(By.css('a[href*="/notes/"]'))

		if (noteLinks.length > 0) {
			// Click on the first note
			await noteLinks[0].click()
			await driver.sleep(1000)

			// Click edit button
			const editSelectors = [
				By.css('a[href*="edit"]'),
				By.css('button:has-text("Edit")'),
				By.xpath('//button[contains(text(), "Edit")]'),
			]

			for (const selector of editSelectors) {
				const isPresent = await pageHelpers.isElementPresent(selector)
				if (isPresent) {
					await pageHelpers.clickElement(selector)
					break
				}
			}

			await driver.sleep(1000)

			// Update title
			const titleInput = await waitHelpers.waitForElementVisible(
				By.css('input[name="title"], input[type="text"]'),
				5000,
			)
			await titleInput.clear()
			await titleInput.sendKeys('Updated Note Title - Selenium')

			// Update content
			const contentElement = await driver.findElement(By.css('textarea'))
			await contentElement.clear()
			await contentElement.sendKeys('Updated content from Selenium test')

			// Save changes
			await pageHelpers.clickElement(By.css('button[type="submit"]'))

			await driver.sleep(2000)

			// Verify update
			const updated = await pageHelpers.waitForText(
				'Updated Note Title - Selenium',
				5000,
			)
			expect(updated).to.be.true
		}
	})

	it('should allow users to delete notes', async function () {
		// Navigate to notes
		await pageHelpers.navigate(`${config.baseUrl}/users/kody/notes`)
		await driver.sleep(1000)

		// Find a note to delete
		const noteLinks = await driver.findElements(By.css('a[href*="/notes/"]'))

		if (noteLinks.length > 0) {
			// Remember the note count
			const initialCount = noteLinks.length

			// Click on the first note
			await noteLinks[0].click()
			await driver.sleep(1000)

			// Find and click delete button
			const deleteSelectors = [
				By.css('button[name="intent"][value="delete"]'),
				By.css('button:has-text("Delete")'),
				By.xpath('//button[contains(text(), "Delete")]'),
				By.css('form[action*="delete"] button[type="submit"]'),
			]

			for (const selector of deleteSelectors) {
				const isPresent = await pageHelpers.isElementPresent(selector)
				if (isPresent) {
					await pageHelpers.clickElement(selector)

					// Handle confirmation if present
					try {
						await driver.sleep(500)
						const confirmButton = await driver.findElement(
							By.xpath('//button[contains(text(), "Confirm")]'),
						)
						if (confirmButton) {
							await confirmButton.click()
						}
					} catch {
						// No confirmation needed
					}

					break
				}
			}

			await driver.sleep(2000)

			// Verify we're back on notes list
			const currentUrl = await driver.getCurrentUrl()
			expect(currentUrl).to.include('/notes')

			// Verify note count decreased (optional check)
			const newNoteLinks = await driver.findElements(
				By.css('a[href*="/notes/"]'),
			)
			expect(newNoteLinks.length).to.be.lessThan(initialCount)
		}
	})
})
