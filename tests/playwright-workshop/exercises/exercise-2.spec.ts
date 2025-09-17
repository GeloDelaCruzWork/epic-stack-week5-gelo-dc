import { test, expect } from '@playwright/test'

/**
 * EXERCISE 2: Form Validation
 *
 * Playwright equivalent of Selenium's Exercise 2
 * Test login form validation with Playwright's superior form handling
 *
 * TASK: Complete the login form validation tests
 * TIME: 20 minutes (vs 45 minutes for Selenium)
 *
 * ADVANTAGES:
 * - Built-in form helpers
 * - Better validation checking
 * - Automatic retry on assertions
 * - Cleaner error handling
 */

test.describe('Exercise 2: Form Validation', () => {
	test.beforeEach(async ({ page }) => {
		// TODO 1: Navigate to the login page before each test
		// HINT: await page.goto('http://localhost:3000/login')
	})

	test('should show error for empty form submission', async ({ page }) => {
		// TODO 2: Click submit without filling any fields
		// HINT: await page.click('button[type="submit"]')
		// TODO 3: Check for validation messages
		// HINT: Check if required field validation appears
		// const usernameInput = page.locator('input[name="username"]')
		// await expect(usernameInput).toHaveAttribute('required', '')
	})

	test('should show error for invalid credentials', async ({ page }) => {
		// TODO 4: Fill in invalid credentials
		// HINT:
		// await page.fill('input[name="username"]', 'invalid')
		// await page.fill('input[name="password"]', 'wrong')
		// TODO 5: Submit the form
		// TODO 6: Check for error message
		// HINT: await expect(page.locator('text=/invalid/i')).toBeVisible()
	})

	test('should successfully login with valid credentials', async ({ page }) => {
		// TODO 7: Fill in valid credentials
		// Username: kody
		// Password: kodylovesyou
		// TODO 8: Submit and verify redirect
		// HINT: await page.waitForURL(url => !url.includes('/login'))
	})

	// BONUS: Test remember me checkbox
	test.skip('should handle remember me checkbox', async ({ page }) => {
		// TODO: Test the remember me functionality
	})
})

/**
 * COMPARISON WITH SELENIUM:
 *
 * Form filling:
 * Selenium: driver.findElement(By.name('username')).sendKeys('test')
 * Playwright: await page.fill('input[name="username"]', 'test')
 *
 * Validation checking:
 * Selenium: Complex JavaScript execution to check validation
 * Playwright: await expect(input).toHaveAttribute('required')
 *
 * Error messages:
 * Selenium: Manual wait + getText() + assert
 * Playwright: await expect(page.locator('text=error')).toBeVisible()
 */
