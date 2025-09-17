const { By, until } = require('selenium-webdriver')

/**
 * Page Object Model for Login Page
 *
 * This class encapsulates all login page interactions and locators
 */
class LoginPage {
	constructor(driver) {
		this.driver = driver
		this.url = 'http://localhost:3000/login'

		// Define locators
		this.locators = {
			usernameInput: By.id('login-form-username'),
			usernameInputAlt: By.css('input[name="username"]'),
			passwordInput: By.id('login-form-password'),
			passwordInputAlt: By.css('input[type="password"]'),
			submitButton: By.xpath('//button[contains(text(), "Log in")]'),
			submitButtonAlt: By.css('button[type="submit"]'),
			errorMessage: By.css('[role="alert"], .error-message, .text-red-600'),
			rememberCheckbox: By.css('input[name="remember"]'),
			forgotPasswordLink: By.linkText('Forgot password?'),
			createAccountLink: By.linkText('Create an account'),
			githubButton: By.xpath('//button[contains(text(), "GitHub")]'),
			googleButton: By.xpath('//button[contains(text(), "Google")]'),
		}
	}

	// Navigation methods
	async goto() {
		await this.driver.get(this.url)
		await this.driver.wait(
			until.elementLocated(this.locators.passwordInput),
			5000,
		)
		return this
	}

	async isOnLoginPage() {
		const currentUrl = await this.driver.getCurrentUrl()
		return currentUrl.includes('/login')
	}

	// Input methods
	async enterUsername(username) {
		const field = await this.findUsernameField()
		await field.clear()
		await field.sendKeys(username)
		return this
	}

	async enterPassword(password) {
		const field = await this.findPasswordField()
		await field.clear()
		await field.sendKeys(password)
		return this
	}

	async findUsernameField() {
		try {
			return await this.driver.findElement(this.locators.usernameInput)
		} catch (e) {
			return await this.driver.findElement(this.locators.usernameInputAlt)
		}
	}

	async findPasswordField() {
		try {
			return await this.driver.findElement(this.locators.passwordInput)
		} catch (e) {
			return await this.driver.findElement(this.locators.passwordInputAlt)
		}
	}

	// Action methods
	async login(username, password) {
		await this.enterUsername(username)
		await this.enterPassword(password)
		await this.submit()
		return this
	}

	async submit() {
		let button
		try {
			button = await this.driver.findElement(this.locators.submitButton)
		} catch (e) {
			button = await this.driver.findElement(this.locators.submitButtonAlt)
		}
		await button.click()
		return this
	}

	async checkRememberMe() {
		try {
			const checkbox = await this.driver.findElement(
				this.locators.rememberCheckbox,
			)
			const isChecked = await checkbox.isSelected()
			if (!isChecked) {
				await checkbox.click()
			}
		} catch (e) {
			// Checkbox might not exist
		}
		return this
	}

	// Validation methods
	async getErrorMessage() {
		try {
			await this.driver.wait(
				until.elementLocated(this.locators.errorMessage),
				3000,
			)
			const element = await this.driver.findElement(this.locators.errorMessage)
			return await element.getText()
		} catch (e) {
			return null
		}
	}

	async hasError() {
		try {
			const element = await this.driver.findElement(this.locators.errorMessage)
			return await element.isDisplayed()
		} catch (e) {
			return false
		}
	}

	async getValidationMessage(field) {
		let element
		if (field === 'username') {
			element = await this.findUsernameField()
		} else if (field === 'password') {
			element = await this.findPasswordField()
		}

		return await this.driver.executeScript(
			'return arguments[0].validationMessage',
			element,
		)
	}

	async isFieldRequired(field) {
		let element
		if (field === 'username') {
			element = await this.findUsernameField()
		} else if (field === 'password') {
			element = await this.findPasswordField()
		}

		const required = await element.getAttribute('required')
		return required !== null
	}

	// OAuth methods
	async loginWithGitHub() {
		try {
			const button = await this.driver.findElement(this.locators.githubButton)
			await button.click()
		} catch (e) {
			throw new Error('GitHub login button not found')
		}
		return this
	}

	async loginWithGoogle() {
		try {
			const button = await this.driver.findElement(this.locators.googleButton)
			await button.click()
		} catch (e) {
			throw new Error('Google login button not found')
		}
		return this
	}

	// Navigation methods
	async goToForgotPassword() {
		try {
			const link = await this.driver.findElement(
				this.locators.forgotPasswordLink,
			)
			await link.click()
		} catch (e) {
			throw new Error('Forgot password link not found')
		}
		return this
	}

	async goToCreateAccount() {
		try {
			const link = await this.driver.findElement(
				this.locators.createAccountLink,
			)
			await link.click()
		} catch (e) {
			throw new Error('Create account link not found')
		}
		return this
	}

	// Wait methods
	async waitForRedirect(timeout = 5000) {
		await this.driver.wait(
			async () => {
				const url = await this.driver.getCurrentUrl()
				return !url.includes('/login')
			},
			timeout,
			'Login redirect timeout',
		)
		return this
	}

	async waitForError(timeout = 3000) {
		await this.driver.wait(
			until.elementLocated(this.locators.errorMessage),
			timeout,
			'Error message did not appear',
		)
		return this
	}

	// Utility methods
	async isLoggedIn() {
		const currentUrl = await this.driver.getCurrentUrl()
		return !currentUrl.includes('/login') && currentUrl.includes('/users')
	}

	async getPageTitle() {
		return await this.driver.getTitle()
	}

	async takeScreenshot() {
		return await this.driver.takeScreenshot()
	}
}

module.exports = LoginPage
