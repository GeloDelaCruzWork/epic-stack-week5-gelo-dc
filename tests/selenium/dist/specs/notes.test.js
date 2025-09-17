'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const selenium_webdriver_1 = require('selenium-webdriver')
const chai_1 = require('chai')
const selenium_config_1 = require('../config/selenium.config')
const page_helpers_1 = require('../helpers/page-helpers')
const auth_helpers_1 = require('../helpers/auth-helpers')
const wait_helpers_1 = require('../helpers/wait-helpers')
describe('Notes Management', function () {
	this.timeout(30000) // Set default timeout for all tests
	let driver
	let pageHelpers
	let authHelpers
	let waitHelpers
	before(async function () {
		driver = await (0, selenium_config_1.createDriver)()
		pageHelpers = new page_helpers_1.PageHelpers(driver)
		authHelpers = new auth_helpers_1.AuthHelpers(driver)
		waitHelpers = new wait_helpers_1.WaitHelpers(driver)
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
		await pageHelpers.navigate(
			`${selenium_config_1.config.baseUrl}/users/kody/notes`,
		)
		// Wait for page to load
		await driver.sleep(1000)
		// Click on new note button/link
		const newNoteSelectors = [
			selenium_webdriver_1.By.css('a[href*="new"]'),
			selenium_webdriver_1.By.xpath('//a[contains(text(), "New")]'),
			selenium_webdriver_1.By.css('button:has-text("New Note")'),
			selenium_webdriver_1.By.css('[data-testid="new-note"]'),
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
			await pageHelpers.navigate(
				`${selenium_config_1.config.baseUrl}/users/kody/notes/new`,
			)
		}
		await driver.sleep(1000)
		// Fill in note title
		const titleInput = await waitHelpers.waitForElementVisible(
			selenium_webdriver_1.By.css('input[name="title"], input[type="text"]'),
			5000,
		)
		await titleInput.clear()
		await titleInput.sendKeys('Test Note from Selenium')
		// Fill in note content
		const contentSelectors = [
			selenium_webdriver_1.By.css('textarea[name="content"]'),
			selenium_webdriver_1.By.css('textarea'),
			selenium_webdriver_1.By.css('[contenteditable="true"]'),
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
		await pageHelpers.clickElement(
			selenium_webdriver_1.By.css('button[type="submit"]'),
		)
		// Wait for navigation
		await driver.sleep(2000)
		// Verify note was created
		const noteCreated = await pageHelpers.waitForText(
			'Test Note from Selenium',
			5000,
		)
		;(0, chai_1.expect)(noteCreated).to.be.true
	})
	it('should allow users to edit notes', async function () {
		// First create a note
		await pageHelpers.navigate(
			`${selenium_config_1.config.baseUrl}/users/kody/notes`,
		)
		await driver.sleep(1000)
		// Find and click on an existing note or create one first
		const noteLinks = await driver.findElements(
			selenium_webdriver_1.By.css('a[href*="/notes/"]'),
		)
		if (noteLinks.length > 0) {
			// Click on the first note
			await noteLinks[0].click()
			await driver.sleep(1000)
			// Click edit button
			const editSelectors = [
				selenium_webdriver_1.By.css('a[href*="edit"]'),
				selenium_webdriver_1.By.css('button:has-text("Edit")'),
				selenium_webdriver_1.By.xpath('//button[contains(text(), "Edit")]'),
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
				selenium_webdriver_1.By.css('input[name="title"], input[type="text"]'),
				5000,
			)
			await titleInput.clear()
			await titleInput.sendKeys('Updated Note Title - Selenium')
			// Update content
			const contentElement = await driver.findElement(
				selenium_webdriver_1.By.css('textarea'),
			)
			await contentElement.clear()
			await contentElement.sendKeys('Updated content from Selenium test')
			// Save changes
			await pageHelpers.clickElement(
				selenium_webdriver_1.By.css('button[type="submit"]'),
			)
			await driver.sleep(2000)
			// Verify update
			const updated = await pageHelpers.waitForText(
				'Updated Note Title - Selenium',
				5000,
			)
			;(0, chai_1.expect)(updated).to.be.true
		}
	})
	it('should allow users to delete notes', async function () {
		// Navigate to notes
		await pageHelpers.navigate(
			`${selenium_config_1.config.baseUrl}/users/kody/notes`,
		)
		await driver.sleep(1000)
		// Find a note to delete
		const noteLinks = await driver.findElements(
			selenium_webdriver_1.By.css('a[href*="/notes/"]'),
		)
		if (noteLinks.length > 0) {
			// Remember the note count
			const initialCount = noteLinks.length
			// Click on the first note
			await noteLinks[0].click()
			await driver.sleep(1000)
			// Find and click delete button
			const deleteSelectors = [
				selenium_webdriver_1.By.css('button[name="intent"][value="delete"]'),
				selenium_webdriver_1.By.css('button:has-text("Delete")'),
				selenium_webdriver_1.By.xpath('//button[contains(text(), "Delete")]'),
				selenium_webdriver_1.By.css(
					'form[action*="delete"] button[type="submit"]',
				),
			]
			for (const selector of deleteSelectors) {
				const isPresent = await pageHelpers.isElementPresent(selector)
				if (isPresent) {
					await pageHelpers.clickElement(selector)
					// Handle confirmation if present
					try {
						await driver.sleep(500)
						const confirmButton = await driver.findElement(
							selenium_webdriver_1.By.xpath(
								'//button[contains(text(), "Confirm")]',
							),
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
			;(0, chai_1.expect)(currentUrl).to.include('/notes')
			// Verify note count decreased (optional check)
			const newNoteLinks = await driver.findElements(
				selenium_webdriver_1.By.css('a[href*="/notes/"]'),
			)
			;(0, chai_1.expect)(newNoteLinks.length).to.be.lessThan(initialCount)
		}
	})
})
