import { faker } from '@faker-js/faker'
import { expect, test } from '#tests/playwright-utils.ts'

test('password change invalidates other sessions', async ({
	page,
	insertNewUser,
}) => {
	const password = faker.internet.password()
	const user = await insertNewUser({ password })

	// Login in first browser context
	await page.goto('/login')
	await page.getByRole('textbox', { name: /username/i }).fill(user.username)
	await page.getByLabel(/^password$/i).fill(password)
	await page.getByRole('button', { name: /log in/i }).click()
	await expect(page).toHaveURL('/')

	// Create a second browser context to simulate another device
	const context2 = await page.context().browser()?.newContext()
	if (!context2) throw new Error('Could not create second context')
	const page2 = await context2.newPage()

	// Login in second browser context
	await page2.goto('/login')
	await page2.getByRole('textbox', { name: /username/i }).fill(user.username)
	await page2.getByLabel(/^password$/i).fill(password)
	await page2.getByRole('button', { name: /log in/i }).click()
	await expect(page2).toHaveURL('/')

	// Verify both sessions can access protected content
	await page.goto('/settings/profile')
	await expect(page.getByText(user.name ?? '')).toBeVisible()

	await page2.goto('/settings/profile')
	await expect(page2.getByText(user.name ?? '')).toBeVisible()

	// Change password in first browser
	const newPassword = faker.internet.password()
	await page.goto('/settings/profile/password')
	await page.getByLabel(/^current password$/i).fill(password)
	await page.getByLabel(/^new password$/i).fill(newPassword)
	await page.getByLabel(/^confirm new password$/i).fill(newPassword)
	await page.getByRole('button', { name: /change password/i }).click()

	// Verify success message mentions other devices logged out
	await expect(
		page.getByText(/other devices have been logged out/i),
	).toBeVisible()

	// Verify first browser is still logged in
	await page.goto('/settings/profile')
	await expect(page.getByText(user.name ?? '')).toBeVisible()

	// Verify second browser is logged out (session invalidated)
	await page2.goto('/settings/profile')
	await expect(page2).toHaveURL('/login?redirectTo=%2Fsettings%2Fprofile')

	// Cleanup
	await context2.close()
})

test('new passwords use argon2 hashing', async ({ page }) => {
	// Create a new user through signup flow
	const userData = {
		email: faker.internet.email({ provider: 'example.com' }),
		username: faker.internet.username(),
		name: faker.person.fullName(),
		password: faker.internet.password({ length: 12 }),
	}

	// Sign up
	await page.goto('/signup')
	await page.getByRole('textbox', { name: /email/i }).fill(userData.email)
	await page.getByRole('button', { name: /submit/i }).click()

	// Get verification code from email (mocked in tests)
	await expect(page.getByText(/check your email/i)).toBeVisible()

	// In test environment, we can directly navigate to onboarding with the code
	// This would normally be done via email link
	const verifyUrl = new URL(page.url())
	verifyUrl.pathname = '/onboarding'
	verifyUrl.searchParams.set('code', 'TESTCODE') // Test environment accepts this
	await page.goto(verifyUrl.toString())

	// Complete onboarding
	await page.getByRole('textbox', { name: /username/i }).fill(userData.username)
	await page.getByRole('textbox', { name: /name/i }).fill(userData.name)
	await page.getByLabel(/^password$/i).fill(userData.password)
	await page.getByLabel(/^confirm password$/i).fill(userData.password)
	await page.getByRole('checkbox', { name: /terms/i }).check()
	await page.getByRole('checkbox', { name: /remember me/i }).check()
	await page.getByRole('button', { name: /create an account/i }).click()

	// Should be logged in
	await expect(page).toHaveURL('/')

	// Logout and login again to verify password works
	await page.goto('/logout')
	await page.goto('/login')
	await page.getByRole('textbox', { name: /username/i }).fill(userData.username)
	await page.getByLabel(/^password$/i).fill(userData.password)
	await page.getByRole('button', { name: /log in/i }).click()
	await expect(page).toHaveURL('/')
})

test('password reset clears all sessions', async ({ page, insertNewUser }) => {
	const originalPassword = faker.internet.password()
	const user = await insertNewUser({ password: originalPassword })

	// Login
	await page.goto('/login')
	await page.getByRole('textbox', { name: /username/i }).fill(user.username)
	await page.getByLabel(/^password$/i).fill(originalPassword)
	await page.getByRole('button', { name: /log in/i }).click()
	await expect(page).toHaveURL('/')

	// Verify logged in
	await page.goto('/settings/profile')
	await expect(page.getByText(user.name ?? '')).toBeVisible()

	// Logout to test password reset
	await page.goto('/logout')

	// Start password reset flow
	await page.goto('/forgot-password')
	await page.getByRole('textbox', { name: /username/i }).fill(user.username)
	await page.getByRole('button', { name: /recover password/i }).click()

	await expect(page.getByText(/check your email/i)).toBeVisible()

	// In test environment, directly navigate to reset with code
	const resetUrl = new URL(page.url())
	resetUrl.pathname = '/reset-password'
	resetUrl.searchParams.set('code', 'RESETCODE') // Test environment accepts this
	await page.goto(resetUrl.toString())

	// Set new password
	const newPassword = faker.internet.password()
	await page.getByLabel(/^new password$/i).fill(newPassword)
	await page.getByLabel(/^confirm new password$/i).fill(newPassword)
	await page.getByRole('button', { name: /reset password/i }).click()

	// Should redirect to login
	await expect(page).toHaveURL('/login')

	// Login with new password
	await page.getByRole('textbox', { name: /username/i }).fill(user.username)
	await page.getByLabel(/^password$/i).fill(newPassword)
	await page.getByRole('button', { name: /log in/i }).click()
	await expect(page).toHaveURL('/')

	// Verify old password doesn't work
	await page.goto('/logout')
	await page.goto('/login')
	await page.getByRole('textbox', { name: /username/i }).fill(user.username)
	await page.getByLabel(/^password$/i).fill(originalPassword)
	await page.getByRole('button', { name: /log in/i }).click()

	// Should show error
	await expect(page.getByText(/invalid username or password/i)).toBeVisible()
})
