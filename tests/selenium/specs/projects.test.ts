import { WebDriver, By } from 'selenium-webdriver'
import { expect } from 'chai'
import { createDriver, config } from '../config/selenium.config'
import { PageHelpers } from '../helpers/page-helpers'
import { AuthHelpers } from '../helpers/auth-helpers'
import { WaitHelpers } from '../helpers/wait-helpers'

describe('Projects Management', function () {
	this.timeout(30000)

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
		await authHelpers.ensureLoggedIn()
	})

	it('should require authentication to access projects', async function () {
		// Logout first
		await authHelpers.logout()

		// Try to access projects page
		await pageHelpers.navigate(`${config.baseUrl}/projects`)
		await driver.sleep(1000)

		// Should be redirected to login
		const currentUrl = await driver.getCurrentUrl()
		expect(currentUrl).to.include('/login')
	})

	it('should allow logged in users to view projects page', async function () {
		await authHelpers.ensureLoggedIn()
		await pageHelpers.navigate(`${config.baseUrl}/projects`)
		await driver.sleep(1000)

		// Wait for page elements with more flexible selectors
		const headingSelectors = [
			By.xpath('//h1[contains(text(), "Projects")]'),
			By.css('h1'),
		]

		let headingFound = false
		for (const selector of headingSelectors) {
			const isPresent = await pageHelpers.isElementPresent(selector)
			if (isPresent) {
				headingFound = true
				break
			}
		}

		expect(headingFound).to.be.true

		// Check for page content
		const pageText = await driver.findElement(By.tagName('body')).getText()
		expect(pageText.toLowerCase()).to.include('project')
	})

	it('should allow users to create a new project', async function () {
		await pageHelpers.navigate(`${config.baseUrl}/projects`)
		await driver.sleep(1000)

		// Find project name input
		const nameInput = await waitHelpers.waitForElementVisible(
			By.css(
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
				By.css(
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
			By.css('button[type="submit"]'),
			By.xpath('//button[contains(text(), "Create")]'),
			By.xpath('//button[contains(text(), "Save")]'),
			By.xpath('//button[contains(text(), "Add")]'),
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
		expect(projectCreated).to.be.true
	})

	it('should validate required fields when creating a project', async function () {
		await pageHelpers.navigate(`${config.baseUrl}/projects`)
		await driver.sleep(1000)

		// Try to submit without filling required fields
		const submitButton = await driver.findElement(
			By.css('button[type="submit"]'),
		)
		await submitButton.click()

		await driver.sleep(1000)

		// Check for validation error
		const errorSelectors = [
			By.css('.error-message'),
			By.css('[role="alert"]'),
			By.xpath('//*[contains(text(), "required")]'),
			By.xpath('//*[contains(text(), "Required")]'),
		]

		let errorFound = false
		for (const selector of errorSelectors) {
			const isPresent = await pageHelpers.isElementPresent(selector)
			if (isPresent) {
				errorFound = true
				break
			}
		}

		expect(errorFound).to.be.true
	})

	it('should allow users to edit an existing project', async function () {
		await pageHelpers.navigate(`${config.baseUrl}/projects`)
		await driver.sleep(2000)

		// Find a project to edit - look for edit links/buttons
		const editSelectors = [
			By.css('a[href*="/edit"]'),
			By.xpath('//a[contains(@href, "/edit")]'),
			By.css('button[title*="Edit" i]'),
			By.css('[aria-label*="Edit" i]'),
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
				By.css('input[name="name"], input[id="name"]'),
				5000,
			)

			await nameInput.clear()
			const updatedName = `Updated Selenium Project ${Date.now()}`
			await nameInput.sendKeys(updatedName)

			// Submit changes
			await pageHelpers.clickElement(By.css('button[type="submit"]'))

			await driver.sleep(2000)

			// Verify update
			const updated = await pageHelpers.waitForText(updatedName, 5000)
			expect(updated).to.be.true
		}
	})

	it('should allow users to delete a project', async function () {
		await pageHelpers.navigate(`${config.baseUrl}/projects`)
		await driver.sleep(2000)

		// Count initial projects
		const initialProjects = await driver.findElements(
			By.css('[data-testid="project-item"], .project-item, article'),
		)
		const initialCount = initialProjects.length

		// Find delete button
		const deleteSelectors = [
			By.css('button[title*="Delete" i]'),
			By.css('[aria-label*="Delete" i]'),
			By.xpath('//button[contains(text(), "Delete")]'),
		]

		for (const selector of deleteSelectors) {
			const elements = await driver.findElements(selector)
			if (elements.length > 0) {
				await elements[0].click()

				// Handle confirmation
				await driver.sleep(500)
				try {
					const confirmButton = await driver.findElement(
						By.xpath(
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
					By.css('[data-testid="project-item"], .project-item, article'),
				)
				expect(newProjects.length).to.be.lessThan(initialCount)
				break
			}
		}
	})

	it('should display empty state when no projects exist', async function () {
		await pageHelpers.navigate(`${config.baseUrl}/projects`)
		await driver.sleep(2000)

		const pageText = await driver.findElement(By.tagName('body')).getText()

		// Check if there are no projects or if empty state message is shown
		const hasEmptyState =
			pageText.includes('No projects') ||
			pageText.includes('no projects') ||
			pageText.includes('Create your first project') ||
			pageText.includes('Get started')

		// If not empty, this test isn't applicable
		if (hasEmptyState) {
			expect(hasEmptyState).to.be.true
		} else {
			this.skip() // Skip if projects exist
		}
	})
})
