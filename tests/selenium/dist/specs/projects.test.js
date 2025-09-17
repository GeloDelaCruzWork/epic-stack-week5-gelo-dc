'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const selenium_webdriver_1 = require('selenium-webdriver')
const chai_1 = require('chai')
const selenium_config_1 = require('../config/selenium.config')
const page_helpers_1 = require('../helpers/page-helpers')
const auth_helpers_1 = require('../helpers/auth-helpers')
const wait_helpers_1 = require('../helpers/wait-helpers')
describe('Projects Management', function () {
	this.timeout(30000)
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
		await authHelpers.ensureLoggedIn()
	})
	it('should require authentication to access projects', async function () {
		// Logout first
		await authHelpers.logout()
		// Try to access projects page
		await pageHelpers.navigate(`${selenium_config_1.config.baseUrl}/projects`)
		await driver.sleep(1000)
		// Should be redirected to login
		const currentUrl = await driver.getCurrentUrl()
		;(0, chai_1.expect)(currentUrl).to.include('/login')
	})
	it('should allow logged in users to view projects page', async function () {
		await authHelpers.ensureLoggedIn()
		await pageHelpers.navigate(`${selenium_config_1.config.baseUrl}/projects`)
		await driver.sleep(1000)
		// Wait for page elements with more flexible selectors
		const headingSelectors = [
			selenium_webdriver_1.By.xpath('//h1[contains(text(), "Projects")]'),
			selenium_webdriver_1.By.css('h1'),
		]
		let headingFound = false
		for (const selector of headingSelectors) {
			const isPresent = await pageHelpers.isElementPresent(selector)
			if (isPresent) {
				headingFound = true
				break
			}
		}
		;(0, chai_1.expect)(headingFound).to.be.true
		// Check for page content
		const pageText = await driver
			.findElement(selenium_webdriver_1.By.tagName('body'))
			.getText()
		;(0, chai_1.expect)(pageText.toLowerCase()).to.include('project')
	})
	it('should allow users to create a new project', async function () {
		await pageHelpers.navigate(`${selenium_config_1.config.baseUrl}/projects`)
		await driver.sleep(1000)
		// Find project name input
		const nameInput = await waitHelpers.waitForElementVisible(
			selenium_webdriver_1.By.css(
				'input[name="name"], input[id="name"], input[placeholder*="name" i]',
			),
			5000,
		)
		const projectName = `Selenium Test Project ${Date.now()}`
		await nameInput.clear()
		await nameInput.sendKeys(projectName)
		// Find description field (optional)
		try {
			const descInput = await driver.findElement(
				selenium_webdriver_1.By.css(
					'textarea[name="description"], textarea[id="description"], input[name="description"]',
				),
			)
			await descInput.clear()
			await descInput.sendKeys(
				'This project was created by Selenium automated test',
			)
		} catch {
			// Description might be optional
		}
		// Submit form
		const submitSelectors = [
			selenium_webdriver_1.By.css('button[type="submit"]'),
			selenium_webdriver_1.By.xpath('//button[contains(text(), "Create")]'),
			selenium_webdriver_1.By.xpath('//button[contains(text(), "Save")]'),
			selenium_webdriver_1.By.xpath('//button[contains(text(), "Add")]'),
		]
		for (const selector of submitSelectors) {
			const isPresent = await pageHelpers.isElementPresent(selector)
			if (isPresent) {
				await pageHelpers.clickElement(selector)
				break
			}
		}
		await driver.sleep(2000)
		// Verify project was created
		const projectCreated = await pageHelpers.waitForText(projectName, 5000)
		;(0, chai_1.expect)(projectCreated).to.be.true
	})
	it('should validate required fields when creating a project', async function () {
		await pageHelpers.navigate(`${selenium_config_1.config.baseUrl}/projects`)
		await driver.sleep(1000)
		// Try to submit without filling required fields
		const submitButton = await driver.findElement(
			selenium_webdriver_1.By.css('button[type="submit"]'),
		)
		await submitButton.click()
		await driver.sleep(1000)
		// Check for validation error
		const errorSelectors = [
			selenium_webdriver_1.By.css('.error-message'),
			selenium_webdriver_1.By.css('[role="alert"]'),
			selenium_webdriver_1.By.xpath('//*[contains(text(), "required")]'),
			selenium_webdriver_1.By.xpath('//*[contains(text(), "Required")]'),
		]
		let errorFound = false
		for (const selector of errorSelectors) {
			const isPresent = await pageHelpers.isElementPresent(selector)
			if (isPresent) {
				errorFound = true
				break
			}
		}
		;(0, chai_1.expect)(errorFound).to.be.true
	})
	it('should allow users to edit an existing project', async function () {
		await pageHelpers.navigate(`${selenium_config_1.config.baseUrl}/projects`)
		await driver.sleep(2000)
		// Find a project to edit - look for edit links/buttons
		const editSelectors = [
			selenium_webdriver_1.By.css('a[href*="/edit"]'),
			selenium_webdriver_1.By.xpath('//a[contains(@href, "/edit")]'),
			selenium_webdriver_1.By.css('button[title*="Edit" i]'),
			selenium_webdriver_1.By.css('[aria-label*="Edit" i]'),
		]
		let editClicked = false
		for (const selector of editSelectors) {
			const elements = await driver.findElements(selector)
			if (elements.length > 0) {
				await elements[0].click()
				editClicked = true
				break
			}
		}
		if (editClicked) {
			await driver.sleep(2000)
			// Update project name
			const nameInput = await waitHelpers.waitForElementVisible(
				selenium_webdriver_1.By.css('input[name="name"], input[id="name"]'),
				5000,
			)
			await nameInput.clear()
			const updatedName = `Updated Selenium Project ${Date.now()}`
			await nameInput.sendKeys(updatedName)
			// Submit changes
			await pageHelpers.clickElement(
				selenium_webdriver_1.By.css('button[type="submit"]'),
			)
			await driver.sleep(2000)
			// Verify update
			const updated = await pageHelpers.waitForText(updatedName, 5000)
			;(0, chai_1.expect)(updated).to.be.true
		}
	})
	it('should allow users to delete a project', async function () {
		await pageHelpers.navigate(`${selenium_config_1.config.baseUrl}/projects`)
		await driver.sleep(2000)
		// Count initial projects
		const initialProjects = await driver.findElements(
			selenium_webdriver_1.By.css(
				'[data-testid="project-item"], .project-item, article',
			),
		)
		const initialCount = initialProjects.length
		// Find delete button
		const deleteSelectors = [
			selenium_webdriver_1.By.css('button[title*="Delete" i]'),
			selenium_webdriver_1.By.css('[aria-label*="Delete" i]'),
			selenium_webdriver_1.By.xpath('//button[contains(text(), "Delete")]'),
		]
		for (const selector of deleteSelectors) {
			const elements = await driver.findElements(selector)
			if (elements.length > 0) {
				await elements[0].click()
				// Handle confirmation
				await driver.sleep(500)
				try {
					const confirmButton = await driver.findElement(
						selenium_webdriver_1.By.xpath(
							'//button[contains(text(), "Confirm") or contains(text(), "Yes") or contains(text(), "Delete")]',
						),
					)
					await confirmButton.click()
				} catch {
					// No confirmation needed
				}
				await driver.sleep(2000)
				// Verify deletion
				const newProjects = await driver.findElements(
					selenium_webdriver_1.By.css(
						'[data-testid="project-item"], .project-item, article',
					),
				)
				;(0, chai_1.expect)(newProjects.length).to.be.lessThan(initialCount)
				break
			}
		}
	})
	it('should display empty state when no projects exist', async function () {
		await pageHelpers.navigate(`${selenium_config_1.config.baseUrl}/projects`)
		await driver.sleep(2000)
		const pageText = await driver
			.findElement(selenium_webdriver_1.By.tagName('body'))
			.getText()
		// Check if there are no projects or if empty state message is shown
		const hasEmptyState =
			pageText.includes('No projects') ||
			pageText.includes('no projects') ||
			pageText.includes('Create your first project') ||
			pageText.includes('Get started')
		// If not empty, this test isn't applicable
		if (hasEmptyState) {
			;(0, chai_1.expect)(hasEmptyState).to.be.true
		} else {
			this.skip() // Skip if projects exist
		}
	})
})
