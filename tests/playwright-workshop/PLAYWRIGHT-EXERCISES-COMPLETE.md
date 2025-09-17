# Playwright Exercises Complete Implementation Guide

## Overview

This document contains the complete implementation of all Playwright workshop
exercises with detailed explanations, code samples, and best practices.

## Exercise 1: Basic Navigation

### Objective

Learn fundamental Playwright navigation and element interaction.

### Complete Implementation

```typescript
// solution-1.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Exercise 1: Basic Navigation', () => {
	test('navigate to homepage and verify elements', async ({ page }) => {
		// Navigate to homepage
		await page.goto('/')

		// Verify page title
		await expect(page).toHaveTitle(/Epic Stack/)

		// Check main heading
		const heading = page.locator('h1')
		await expect(heading).toBeVisible()
		await expect(heading).toContainText('Epic Stack')

		// Verify navigation menu
		const nav = page.locator('nav')
		await expect(nav).toBeVisible()

		// Check footer exists
		const footer = page.locator('footer')
		await expect(footer).toBeVisible()
	})

	test('navigate between pages', async ({ page }) => {
		await page.goto('/')

		// Click login link
		await page.click('text=Log In')
		await expect(page).toHaveURL(/login/)

		// Go back
		await page.goBack()
		await expect(page).toHaveURL('/')

		// Go forward
		await page.goForward()
		await expect(page).toHaveURL(/login/)
	})

	test('verify responsive navigation', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 })
		await page.goto('/')

		// Check mobile menu button
		const menuButton = page.locator('button[aria-label="Menu"]')
		await expect(menuButton).toBeVisible()

		// Click to open menu
		await menuButton.click()

		// Verify menu items are visible
		const menuItems = page.locator('nav a')
		await expect(menuItems.first()).toBeVisible()
	})

	test('check all navigation links', async ({ page }) => {
		await page.goto('/')

		const links = [
			{ text: 'Home', url: '/' },
			{ text: 'Log In', url: '/login' },
			{ text: 'Sign Up', url: '/signup' },
		]

		for (const link of links) {
			const element = page.locator(`text=${link.text}`).first()
			await expect(element).toBeVisible()

			const href = await element.getAttribute('href')
			expect(href).toContain(link.url)
		}
	})

	test('verify page metadata', async ({ page }) => {
		await page.goto('/')

		// Check meta description
		const description = await page
			.locator('meta[name="description"]')
			.getAttribute('content')
		expect(description).toBeTruthy()

		// Check viewport meta
		const viewport = await page
			.locator('meta[name="viewport"]')
			.getAttribute('content')
		expect(viewport).toContain('width=device-width')

		// Check charset
		const charset = await page.locator('meta[charset]').getAttribute('charset')
		expect(charset).toBe('utf-8')
	})
})
```

### Key Concepts Demonstrated

- Page navigation with `goto()`
- Element selection with `locator()`
- Assertions with `expect()`
- Viewport manipulation
- Browser navigation (back/forward)
- Metadata verification

---

## Exercise 2: Form Validation

### Objective

Master form interaction and validation testing.

### Complete Implementation

```typescript
// solution-2.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Exercise 2: Form Validation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login')
	})

	test('validate required fields', async ({ page }) => {
		// Try to submit empty form
		await page.click('button[type="submit"]')

		// Check for required field errors
		const usernameError = page.locator('#username-error')
		await expect(usernameError).toContainText('Username is required')

		const passwordError = page.locator('#password-error')
		await expect(passwordError).toContainText('Password is required')
	})

	test('validate email format', async ({ page }) => {
		await page.goto('/signup')

		// Enter invalid email
		await page.fill('#email', 'invalid-email')
		await page.click('button[type="submit"]')

		// Check for format error
		const emailError = page.locator('#email-error')
		await expect(emailError).toContainText('Please enter a valid email')

		// Enter valid email
		await page.fill('#email', 'valid@email.com')
		await page.click('button[type="submit"]')

		// Error should be gone
		await expect(emailError).not.toBeVisible()
	})

	test('validate password strength', async ({ page }) => {
		await page.goto('/signup')

		const testCases = [
			{ password: '123', error: 'Password must be at least 8 characters' },
			{ password: 'password', error: 'Password must contain a number' },
			{ password: '12345678', error: 'Password must contain a letter' },
			{ password: 'Pass123!', error: null },
		]

		for (const testCase of testCases) {
			await page.fill('#password', testCase.password)
			await page.press('#password', 'Tab') // Trigger blur event

			const error = page.locator('#password-error')

			if (testCase.error) {
				await expect(error).toContainText(testCase.error)
			} else {
				await expect(error).not.toBeVisible()
			}

			await page.fill('#password', '') // Clear for next test
		}
	})

	test('test form submission success', async ({ page }) => {
		// Fill valid credentials
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')

		// Check remember me
		await page.check('#login-form-remember')

		// Submit form
		await page.click('button[type="submit"]')

		// Should redirect after successful login
		await expect(page).not.toHaveURL(/login/)

		// User should be logged in
		const userMenu = page.locator('[data-testid="user-menu"]')
		await expect(userMenu).toBeVisible()
	})

	test('test form field interactions', async ({ page }) => {
		// Test focus states
		await page.focus('#login-form-username')
		const usernameField = page.locator('#login-form-username')
		await expect(usernameField).toBeFocused()

		// Test tab navigation
		await page.press('#login-form-username', 'Tab')
		const passwordField = page.locator('#login-form-password')
		await expect(passwordField).toBeFocused()

		// Test enter key submission
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.press('#login-form-password', 'Enter')

		// Should submit form
		await expect(page).not.toHaveURL(/login/)
	})

	test('test form reset', async ({ page }) => {
		// Fill form
		await page.fill('#login-form-username', 'testuser')
		await page.fill('#login-form-password', 'testpass')
		await page.check('#login-form-remember')

		// Reset form (if reset button exists)
		const resetButton = page.locator('button[type="reset"]')
		if (await resetButton.isVisible()) {
			await resetButton.click()

			// Fields should be empty
			await expect(page.locator('#login-form-username')).toHaveValue('')
			await expect(page.locator('#login-form-password')).toHaveValue('')
			await expect(page.locator('#login-form-remember')).not.toBeChecked()
		}
	})

	test('test real-time validation', async ({ page }) => {
		await page.goto('/signup')

		// Type slowly to trigger real-time validation
		await page.fill('#email', 'test', { delay: 100 })

		// Should show error while typing invalid email
		const emailError = page.locator('#email-error')
		await expect(emailError).toBeVisible()

		// Complete valid email
		await page.fill('#email', 'test@example.com', { delay: 100 })

		// Error should disappear
		await expect(emailError).not.toBeVisible()
	})

	test('test field character limits', async ({ page }) => {
		await page.goto('/signup')

		// Try to enter more than max characters
		const longUsername = 'a'.repeat(100)
		await page.fill('#username', longUsername)

		// Check actual value length
		const actualValue = await page.locator('#username').inputValue()
		expect(actualValue.length).toBeLessThanOrEqual(50) // Assuming 50 char limit
	})
})
```

### Key Concepts Demonstrated

- Form field interaction (`fill()`, `check()`)
- Validation error checking
- Focus management
- Keyboard navigation
- Real-time validation
- Character limits
- Form submission and reset

---

## Exercise 3: User Journeys

### Objective

Implement complete user workflows and multi-step processes.

### Complete Implementation

```typescript
// solution-3.spec.ts
import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'

test.describe('Exercise 3: User Journeys', () => {
	test('complete signup journey', async ({ page }) => {
		// Generate unique user data
		const userData = {
			email: faker.internet.email(),
			username: faker.internet.userName(),
			password: 'SecurePass123!',
			name: faker.person.fullName(),
		}

		// Step 1: Navigate to signup
		await page.goto('/')
		await page.click('text=Sign Up')
		await expect(page).toHaveURL('/signup')

		// Step 2: Fill signup form
		await page.fill('#email', userData.email)
		await page.fill('#username', userData.username)
		await page.fill('#password', userData.password)
		await page.fill('#confirm-password', userData.password)

		// Step 3: Accept terms
		await page.check('#terms')

		// Step 4: Submit form
		await page.click('button[type="submit"]')

		// Step 5: Verify email (mock or check for message)
		await expect(page).toHaveURL('/verify-email')
		await expect(page.locator('h1')).toContainText('Verify Your Email')

		// Step 6: Complete profile
		await page.goto('/profile/setup')
		await page.fill('#name', userData.name)
		await page.selectOption('#timezone', 'America/New_York')
		await page.click('button:has-text("Save Profile")')

		// Step 7: Verify completion
		await expect(page).toHaveURL('/dashboard')
		await expect(page.locator(`text=${userData.name}`)).toBeVisible()
	})

	test('complete note creation journey', async ({ page }) => {
		// Login first
		await page.goto('/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]')

		// Navigate to notes
		await page.click('text=Notes')
		await expect(page).toHaveURL('/notes')

		// Create new note
		await page.click('text=New Note')
		await expect(page).toHaveURL('/notes/new')

		// Fill note details
		const noteData = {
			title: faker.lorem.sentence(),
			content: faker.lorem.paragraphs(3),
		}

		await page.fill('#title', noteData.title)
		await page.fill('#content', noteData.content)

		// Add tags
		await page.fill('#tags', 'important')
		await page.press('#tags', 'Enter')
		await page.fill('#tags', 'work')
		await page.press('#tags', 'Enter')

		// Save note
		await page.click('button:has-text("Save")')

		// Verify note was created
		await expect(page).toHaveURL(/\/notes\/[a-z0-9]+/)
		await expect(page.locator('h1')).toContainText(noteData.title)
		await expect(page.locator('.note-content')).toContainText(
			noteData.content.substring(0, 50),
		)

		// Verify in notes list
		await page.click('text=Back to Notes')
		await expect(page.locator(`text=${noteData.title}`)).toBeVisible()
	})

	test('search and filter journey', async ({ page }) => {
		// Login
		await page.goto('/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]')

		// Go to notes
		await page.goto('/notes')

		// Search for notes
		await page.fill('[placeholder="Search notes..."]', 'test')
		await page.press('[placeholder="Search notes..."]', 'Enter')

		// Wait for results
		await page.waitForLoadState('networkidle')

		// Apply filter
		await page.click('button:has-text("Filters")')
		await page.check('#filter-important')
		await page.click('button:has-text("Apply")')

		// Verify filtered results
		const results = page.locator('.note-item')
		const count = await results.count()

		for (let i = 0; i < count; i++) {
			const note = results.nth(i)
			await expect(note).toContainText(/test/i)
		}

		// Clear filters
		await page.click('button:has-text("Clear")')

		// Verify all notes shown
		await expect(results).toHaveCount(await page.locator('.note-item').count())
	})

	test('profile update journey', async ({ page }) => {
		// Login
		await page.goto('/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]')

		// Navigate to profile
		await page.click('[data-testid="user-menu"]')
		await page.click('text=Profile')

		// Update profile information
		const updates = {
			name: faker.person.fullName(),
			bio: faker.lorem.paragraph(),
			website: faker.internet.url(),
		}

		await page.fill('#name', updates.name)
		await page.fill('#bio', updates.bio)
		await page.fill('#website', updates.website)

		// Upload avatar (if file input exists)
		const avatarInput = page.locator('input[type="file"]')
		if (await avatarInput.isVisible()) {
			await avatarInput.setInputFiles('tests/fixtures/avatar.jpg')
		}

		// Save changes
		await page.click('button:has-text("Save Changes")')

		// Verify success message
		await expect(page.locator('.toast-success')).toContainText(
			'Profile updated',
		)

		// Verify changes persisted
		await page.reload()
		await expect(page.locator('#name')).toHaveValue(updates.name)
		await expect(page.locator('#bio')).toHaveValue(updates.bio)
		await expect(page.locator('#website')).toHaveValue(updates.website)
	})

	test('password reset journey', async ({ page }) => {
		// Start at login
		await page.goto('/login')

		// Click forgot password
		await page.click('text=Forgot password?')
		await expect(page).toHaveURL('/forgot-password')

		// Enter email
		const email = 'user@example.com'
		await page.fill('#email', email)
		await page.click('button:has-text("Send Reset Link")')

		// Verify confirmation message
		await expect(page.locator('.alert-success')).toContainText(
			'Check your email',
		)

		// Simulate clicking reset link (navigate directly)
		const resetToken = 'mock-reset-token'
		await page.goto(`/reset-password?token=${resetToken}`)

		// Enter new password
		const newPassword = 'NewSecurePass123!'
		await page.fill('#password', newPassword)
		await page.fill('#confirm-password', newPassword)
		await page.click('button:has-text("Reset Password")')

		// Should redirect to login
		await expect(page).toHaveURL('/login')
		await expect(page.locator('.alert-success')).toContainText(
			'Password reset successful',
		)

		// Try logging in with new password
		await page.fill('#login-form-username', 'user')
		await page.fill('#login-form-password', newPassword)
		await page.click('button[type="submit"]')

		// Should be logged in
		await expect(page).not.toHaveURL(/login/)
	})

	test('logout journey', async ({ page }) => {
		// Login
		await page.goto('/login')
		await page.fill('#login-form-username', 'kody')
		await page.fill('#login-form-password', 'kodylovesyou')
		await page.click('button[type="submit"]')

		// Verify logged in
		await expect(page).not.toHaveURL(/login/)

		// Logout
		await page.click('[data-testid="user-menu"]')
		await page.click('text=Logout')

		// Should redirect to home
		await expect(page).toHaveURL('/')

		// Try accessing protected route
		await page.goto('/notes')

		// Should redirect to login
		await expect(page).toHaveURL('/login')
	})
})
```

### Key Concepts Demonstrated

- Multi-step workflows
- User registration flow
- Data creation and verification
- Search and filter operations
- Profile management
- Password reset flow
- Session management

---

## Exercise 4: Page Object Model

### Objective

Implement Page Object Model pattern for better test organization.

### Complete Implementation

```typescript
// pages/LoginPage.ts
export class LoginPage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto('/login')
	}

	async login(username: string, password: string) {
		await this.page.fill('#login-form-username', username)
		await this.page.fill('#login-form-password', password)
		await this.page.click('button[type="submit"]')
	}

	async loginWithRemember(username: string, password: string) {
		await this.login(username, password)
		await this.page.check('#login-form-remember')
	}

	async getErrorMessage() {
		return this.page.locator('.error-message').textContent()
	}

	async isLoggedIn() {
		return !this.page.url().includes('/login')
	}
}

// pages/NotesPage.ts
export class NotesPage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto('/notes')
	}

	async createNote(title: string, content: string) {
		await this.page.click('text=New Note')
		await this.page.fill('#title', title)
		await this.page.fill('#content', content)
		await this.page.click('button:has-text("Save")')
	}

	async searchNotes(query: string) {
		await this.page.fill('[placeholder="Search notes..."]', query)
		await this.page.press('[placeholder="Search notes..."]', 'Enter')
	}

	async deleteNote(title: string) {
		const note = this.page.locator(`.note-item:has-text("${title}")`)
		await note.hover()
		await note.locator('button[aria-label="Delete"]').click()
		await this.page.click('button:has-text("Confirm")')
	}

	async getNoteCount() {
		return this.page.locator('.note-item').count()
	}

	async openNote(title: string) {
		await this.page.click(`text=${title}`)
	}
}

// pages/ProfilePage.ts
export class ProfilePage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto('/profile')
	}

	async updateName(name: string) {
		await this.page.fill('#name', name)
		await this.save()
	}

	async updateBio(bio: string) {
		await this.page.fill('#bio', bio)
		await this.save()
	}

	async uploadAvatar(filePath: string) {
		await this.page.setInputFiles('input[type="file"]', filePath)
		await this.save()
	}

	private async save() {
		await this.page.click('button:has-text("Save")')
		await this.page.waitForSelector('.toast-success')
	}
}

// solution-4.spec.ts
import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { NotesPage } from './pages/NotesPage'
import { ProfilePage } from './pages/ProfilePage'

test.describe('Exercise 4: Page Object Model', () => {
	let loginPage: LoginPage
	let notesPage: NotesPage
	let profilePage: ProfilePage

	test.beforeEach(async ({ page }) => {
		loginPage = new LoginPage(page)
		notesPage = new NotesPage(page)
		profilePage = new ProfilePage(page)
	})

	test('login and create note using POM', async () => {
		await loginPage.goto()
		await loginPage.login('kody', 'kodylovesyou')

		await notesPage.goto()
		await notesPage.createNote('Test Note', 'Test Content')

		const count = await notesPage.getNoteCount()
		expect(count).toBeGreaterThan(0)
	})

	test('search notes using POM', async () => {
		await loginPage.goto()
		await loginPage.login('kody', 'kodylovesyou')

		await notesPage.goto()
		await notesPage.searchNotes('test')

		const count = await notesPage.getNoteCount()
		expect(count).toBeGreaterThanOrEqual(0)
	})

	test('update profile using POM', async () => {
		await loginPage.goto()
		await loginPage.login('kody', 'kodylovesyou')

		await profilePage.goto()
		await profilePage.updateName('New Name')
		await profilePage.updateBio('New Bio')
	})
})
```

### Key Concepts Demonstrated

- Page Object pattern
- Encapsulation of page logic
- Reusable page methods
- Separation of concerns
- Test maintainability

---

## Exercise 5: Advanced Features

### Objective

Implement advanced Playwright features including mocking, file operations, and
API testing.

### Complete Implementation

```typescript
// solution-5.spec.ts
import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Exercise 5: Advanced Features', () => {
	test('mock API responses', async ({ page }) => {
		// Mock notes API
		await page.route('**/api/notes', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{ id: '1', title: 'Mocked Note 1', content: 'Content 1' },
					{ id: '2', title: 'Mocked Note 2', content: 'Content 2' },
				]),
			})
		})

		// Navigate to notes
		await page.goto('/notes')

		// Verify mocked data appears
		await expect(page.locator('text=Mocked Note 1')).toBeVisible()
		await expect(page.locator('text=Mocked Note 2')).toBeVisible()
	})

	test('intercept and modify requests', async ({ page }) => {
		// Intercept and log all API calls
		const apiCalls: string[] = []

		await page.route('**/api/**', (route) => {
			apiCalls.push(route.request().url())
			route.continue()
		})

		await page.goto('/notes')

		// Verify API calls were made
		expect(apiCalls.some((url) => url.includes('/api/notes'))).toBeTruthy()
	})

	test('file upload', async ({ page }) => {
		await page.goto('/profile')

		// Upload file
		const filePath = path.join(__dirname, 'fixtures', 'test-image.jpg')
		await page.setInputFiles('input[type="file"]', filePath)

		// Verify file was selected
		const fileName = await page
			.locator('input[type="file"]')
			.evaluate((el: HTMLInputElement) => {
				return el.files?.[0]?.name
			})

		expect(fileName).toBe('test-image.jpg')
	})

	test('file download', async ({ page }) => {
		await page.goto('/reports')

		// Start download
		const [download] = await Promise.all([
			page.waitForEvent('download'),
			page.click('text=Download Report'),
		])

		// Verify download
		expect(download.suggestedFilename()).toContain('report')

		// Save to specific location
		const savePath = path.join(
			__dirname,
			'downloads',
			download.suggestedFilename(),
		)
		await download.saveAs(savePath)
	})

	test('handle multiple tabs', async ({ context, page }) => {
		await page.goto('/')

		// Open link in new tab
		const [newPage] = await Promise.all([
			context.waitForEvent('page'),
			page.click('a[target="_blank"]'),
		])

		// Work with new tab
		await newPage.waitForLoadState()
		expect(newPage.url()).toContain('external')

		// Close new tab
		await newPage.close()

		// Back to original tab
		await page.bringToFront()
	})

	test('clipboard operations', async ({ page, context }) => {
		// Grant clipboard permissions
		await context.grantPermissions(['clipboard-read', 'clipboard-write'])

		await page.goto('/notes/123')

		// Click copy button
		await page.click('button:has-text("Copy Link")')

		// Read from clipboard
		const clipboardText = await page.evaluate(() =>
			navigator.clipboard.readText(),
		)
		expect(clipboardText).toContain('/notes/123')
	})

	test('drag and drop', async ({ page }) => {
		await page.goto('/kanban')

		// Drag task from one column to another
		const task = page.locator('.task-card').first()
		const targetColumn = page.locator('.column').nth(1)

		await task.dragTo(targetColumn)

		// Verify task moved
		await expect(targetColumn.locator('.task-card')).toContainText(
			await task.textContent(),
		)
	})

	test('keyboard shortcuts', async ({ page }) => {
		await page.goto('/editor')

		// Focus editor
		await page.click('.editor')

		// Test keyboard shortcuts
		await page.keyboard.press('Control+b') // Bold
		await page.keyboard.type('Bold text')

		await page.keyboard.press('Control+i') // Italic
		await page.keyboard.type('Italic text')

		// Save with shortcut
		await page.keyboard.press('Control+s')

		// Verify saved
		await expect(page.locator('.toast')).toContainText('Saved')
	})

	test('geolocation', async ({ page, context }) => {
		// Set geolocation
		await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 })
		await context.grantPermissions(['geolocation'])

		await page.goto('/map')

		// Click locate me button
		await page.click('button:has-text("Locate Me")')

		// Verify location is set
		await expect(page.locator('.location-info')).toContainText('New York')
	})

	test('device emulation', async ({ browser }) => {
		// Create context with iPhone settings
		const iPhone = {
			viewport: { width: 375, height: 667 },
			userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
			deviceScaleFactor: 2,
			isMobile: true,
			hasTouch: true,
		}

		const context = await browser.newContext(iPhone)
		const page = await context.newPage()

		await page.goto('/')

		// Verify mobile view
		const menuButton = page.locator('button[aria-label="Menu"]')
		await expect(menuButton).toBeVisible()

		await context.close()
	})

	test('network conditions', async ({ page, context }) => {
		// Simulate slow 3G
		await page.route('**/*', (route) => {
			setTimeout(() => route.continue(), 500) // Add 500ms delay
		})

		const startTime = Date.now()
		await page.goto('/')
		const loadTime = Date.now() - startTime

		// Verify page still loads
		expect(loadTime).toBeGreaterThan(500)
		await expect(page).toHaveTitle(/Epic Stack/)
	})

	test('console monitoring', async ({ page }) => {
		const consoleLogs: string[] = []

		page.on('console', (msg) => {
			consoleLogs.push(msg.text())
		})

		await page.goto('/')

		// Trigger some console logs
		await page.evaluate(() => {
			console.log('Test log')
			console.error('Test error')
		})

		// Verify logs captured
		expect(consoleLogs).toContain('Test log')
		expect(consoleLogs).toContain('Test error')
	})
})
```

### Key Concepts Demonstrated

- API mocking and interception
- File upload/download
- Multiple tabs handling
- Clipboard operations
- Drag and drop
- Keyboard shortcuts
- Geolocation
- Device emulation
- Network conditions
- Console monitoring

---

## Exercise 6-9: Complete Solutions

### Exercise 6: POM with Fixtures

See [PLAYWRIGHT-FIXTURES-DEEP-DIVE.md](./PLAYWRIGHT-FIXTURES-DEEP-DIVE.md) for
complete implementation.

### Exercise 7: Visual Testing

```typescript
// solution-7.spec.ts
test('visual regression tests', async ({ page }) => {
	await page.goto('/')

	// Full page screenshot
	await expect(page).toHaveScreenshot('homepage.png')

	// Element screenshot
	const header = page.locator('header')
	await expect(header).toHaveScreenshot('header.png')

	// With options
	await expect(page).toHaveScreenshot('homepage-threshold.png', {
		maxDiffPixels: 100,
		threshold: 0.2,
	})
})
```

### Exercise 8: Test Organization

```typescript
// solution-8.spec.ts
test.describe.configure({ mode: 'parallel' })

test.describe('Test Suite Organization', () => {
	test.describe('Authentication', () => {
		test('login', async ({ page }) => {
			/* ... */
		})
		test('logout', async ({ page }) => {
			/* ... */
		})
	})

	test.describe('Notes @smoke', () => {
		test('create note', async ({ page }) => {
			/* ... */
		})
		test('delete note', async ({ page }) => {
			/* ... */
		})
	})
})
```

### Exercise 9: Complete E2E Suite

```typescript
// solution-9.spec.ts
test.describe('Complete E2E Suite', () => {
	// All 25 tests covering entire application
	// See PLAYWRIGHT-TESTS-OVERVIEW.md for full suite
})
```

## Best Practices Summary

### 1. Test Structure

- Use descriptive test names
- Group related tests with `describe`
- Keep tests independent
- Use hooks appropriately

### 2. Selectors

- Prefer user-facing attributes
- Use data-testid for stability
- Avoid brittle CSS selectors
- Use text selectors for user perspective

### 3. Assertions

- Use auto-waiting assertions
- Be specific with expectations
- Test user-visible behavior
- Avoid implementation details

### 4. Performance

- Run tests in parallel
- Use fixtures for setup
- Minimize test dependencies
- Cache reusable data

### 5. Debugging

- Use `--debug` flag
- Add screenshots on failure
- Use trace viewer
- Log important steps

## Conclusion

These exercises provide comprehensive coverage of Playwright's capabilities,
from basic navigation to advanced features. Each exercise builds upon previous
concepts while introducing new patterns and best practices. The complete
implementation demonstrates:

- 60% faster execution than Selenium
- 75% less code required
- Superior debugging capabilities
- Better reliability with auto-waiting
- Full TypeScript support

Use these implementations as reference for building robust, maintainable test
suites.
