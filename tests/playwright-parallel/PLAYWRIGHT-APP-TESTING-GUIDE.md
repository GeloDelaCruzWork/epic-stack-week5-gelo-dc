# 🎭 Playwright App Testing Guide - Epic Stack

## 📊 Test Results Overview

### ✅ Fully Passing Test Suites (100% Success)

- **Authentication** (`auth.test.ts`): 6/6 tests passing
- **Notes Management** (`notes.test.ts`): 6/6 tests passing
- **Notes Comprehensive** (`notes-comprehensive.test.ts`): 10/10 tests passing
- **Notes Debug** (`notes-debug.test.ts`): 1/1 test passing
- **Notes Simple** (`notes-simple.test.ts`): 6/6 tests passing
- **Projects Fixed** (`projects-fixed.test.ts`): 5/5 tests passing
- **Projects Simple** (`projects-simple.test.ts`): 8/8 tests passing
- **Roles Assignment Basic** (`roles-assignment-basic.test.ts`): 10/10 tests
  passing
- **Timesheets** (`timesheets.test.ts`): 13/13 tests passing
- **Timesheets Basic** (`timesheets-basic.test.ts`): 5/5 tests passing
- **Timesheets Fixed** (`timesheets-fixed.test.ts`): 8/8 tests passing
- **User Search** (`user-search.test.ts`): 12/12 tests passing

### ⚠️ Partially Passing Test Suites

- **Projects** (`projects.test.ts`): 7/9 tests passing (77%)
- **Roles Assignment Fixed** (`roles-assignment-fixed.test.ts`): 8/12 tests
  passing (67%)
- **Roles Permissions** (`roles-permissions.test.ts`): 4/12 tests passing (33%)

## 🔧 Common Fixes Applied

### 1. Button Selector Updates

```typescript
// ❌ Old - Generic selectors
await page.click('button[type="submit"]')

// ✅ Fixed - Specific button text
await page.click('button[type="submit"]:has-text("Submit")')
await page.click('button[type="submit"]:has-text("Create Project")')
await page.click('button[type="submit"]:has-text("Save Changes")')
```

### 2. Authentication Route Corrections

```typescript
// ❌ Old - Assumed all notes routes require auth
const protectedRoutes = ['/users/kody/notes']

// ✅ Fixed - Only creation requires auth
const protectedRoutes = ['/users/kody/notes/new']
// Note: /users/kody/notes is PUBLIC in Epic Stack
```

### 3. Grid Element Selection (AG-Grid)

```typescript
// ❌ Old - Strict mode violation
const grid = page.locator('.ag-root, [role="grid"]')

// ✅ Fixed - Use first matching element
const grid = page.locator('.ag-root, [role="grid"]').first()
```

### 4. Form Navigation Expectations

```typescript
// ❌ Old - Expected to stay on same page
await page.click('button[type="submit"]')
expect(page.url()).toContain('/edit')

// ✅ Fixed - Epic Stack redirects after save
await page.click('button[type="submit"]')
await page.waitForURL('/projects', { timeout: 5000 })
```

## 🏗️ Feature-Specific Testing Patterns

### Authentication Testing

```typescript
test('should handle login flow', async ({ page }) => {
	await page.goto('/login')
	await page.fill('#login-form-username', 'kody')
	await page.fill('#login-form-password', 'kodylovesyou')
	await page.click('button[type="submit"]:has-text("Log in")')

	// Epic Stack redirects to home after login, not to previous page
	await page.waitForURL((url) => !url.pathname.includes('/login'))
	expect(page.url()).not.toContain('/login')
})
```

### Notes CRUD Operations

```typescript
test('should create a note', async ({ page }) => {
	await page.goto('/users/kody/notes/new')
	await page.fill('input[name="title"]', 'Test Note')
	await page.fill('textarea[name="content"]', 'Test content')

	// Use the StatusButton with "Submit" text
	await page.click('button[type="submit"]:has-text("Submit")')

	// Verify redirect to note view
	await page.waitForURL((url) => !url.pathname.includes('/new'))
	await expect(page.locator('h2').first()).toContainText('Test Note')
})
```

### Projects Management

```typescript
test('should handle project operations', async ({ page }) => {
	await page.goto('/projects')

	// Create project - use specific button text
	await page.fill('input[name="name"]', 'New Project')
	await page.click('button[type="submit"]:has-text("Create Project")')

	// Edit project - button says "Save Changes"
	await page.click('a[href*="edit"]').first()
	await page.fill('input[name="name"]', 'Updated Project')
	await page.click('button[type="submit"]:has-text("Save Changes")')

	// Redirects to projects list after save
	await page.waitForURL('/projects')
})
```

### Timesheets with AG-Grid

```typescript
test('should interact with timesheet grid', async ({ page }) => {
	await page.goto('/timesheets')

	// AG-Grid specific selectors
	const grid = page.locator('.ag-root').first()
	await expect(grid).toBeVisible()

	// Expand row for master-detail
	const expandButton = page.locator('.ag-row-group-leaf-indent')
	if (await expandButton.isVisible()) {
		await expandButton.first().click()
	}

	// Add new timesheet
	await page.click('button:has-text("Add Timesheet")')
})
```

## 🔍 Test Debugging Strategies

### 1. Visibility Configuration

```typescript
// In playwright-parallel.config.ts
use: {
  headless: false,  // Show browser window
  launchOptions: {
    slowMo: 100,  // Slow down actions by 100ms
  },
}
```

### 2. Debugging Failed Selectors

```typescript
// Check what's actually on the page
const buttons = await page.locator('button[type="submit"]').all()
for (const button of buttons) {
	console.log(await button.textContent())
}
```

### 3. Wait Strategies

```typescript
// Wait for specific conditions
await page.waitForLoadState('networkidle')
await page.waitForURL((url) => !url.pathname.includes('/new'))
await page.waitForSelector('input[name="title"]', { timeout: 5000 })
```

## 📝 Key Discoveries

### Public vs Protected Routes

- **Public**: `/users/kody/notes` (viewing notes)
- **Protected**: `/users/kody/notes/new` (creating notes)
- **Protected**: `/projects`, `/timesheets`, `/admin/role-assignments`

### Form Behavior

- Epic Stack uses StatusButton component for forms
- Forms typically redirect after successful submission
- Validation uses both HTML5 and server-side validation

### UI Components

- Notes use `form#note-editor` for editing
- Projects use specific button text for actions
- Timesheets use AG-Grid Enterprise with master-detail

## 🚀 Running Tests

### Run All App Tests

```bash
# Run all tests in parallel
npx playwright test tests/playwright-parallel/specs --config=playwright-parallel.config.ts

# Run specific feature tests
npx playwright test tests/playwright-parallel/specs/auth.test.ts
npx playwright test tests/playwright-parallel/specs/notes*.test.ts
npx playwright test tests/playwright-parallel/specs/projects*.test.ts
```

### Run with UI Mode

```bash
npx playwright test --ui --config=playwright-parallel.config.ts
```

### Run with Debugging

```bash
# Set PWDEBUG environment variable
$env:PWDEBUG=1; npx playwright test tests/playwright-parallel/specs/auth.test.ts
```

## 📈 Success Metrics

- **Total Test Files**: 15
- **Fully Passing**: 12 (80%)
- **Core Features Tested**: Authentication, Notes, Projects, Timesheets, User
  Search, Roles
- **Overall Test Success Rate**: ~85%

## 🎯 Best Practices

1. **Always use specific selectors** - Prefer text-based selectors for buttons
2. **Handle redirects properly** - Epic Stack often redirects after form
   submission
3. **Check for public routes** - Not all /users routes require authentication
4. **Use proper waits** - Wait for navigation, not just timeout
5. **Test data cleanup** - Create unique test data with timestamps
6. **Handle AG-Grid carefully** - Use `.first()` to avoid strict mode violations
