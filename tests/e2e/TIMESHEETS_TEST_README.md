# Timesheet Tests Documentation

## Overview

This directory contains comprehensive Playwright end-to-end tests for the
timesheet management system. The tests cover the 4-level hierarchy (Timesheet →
DTR → TimeLog → ClockEvent) and all CRUD operations.

## Test Files

### `timesheets.test.ts`

Basic timesheet functionality tests including:

- Viewing the timesheets grid
- Expanding rows to view details
- Editing entities at all levels
- Theme switching with AG-Grid
- Single expansion policy
- Data persistence without page refresh

### `timesheets-advanced.test.ts`

Advanced scenarios including:

- Complex hierarchy navigation
- Bulk edit operations
- Theme persistence
- Data validation
- Concurrent edit handling
- Performance testing with large datasets
- Keyboard navigation
- Error recovery

### `timesheets-helper.ts`

Utility functions and classes for:

- Creating test data hierarchies
- Grid interaction helpers
- Data cleanup utilities

## Running the Tests

### Prerequisites

1. Ensure the database is set up:

   ```bash
   npm run setup
   ```

2. Install Playwright browsers if not already installed:

   ```bash
   npm run test:e2e:install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Available Commands

Run basic timesheet tests with UI:

```bash
npm run test:timesheets
```

Run basic timesheet tests headlessly:

```bash
npm run test:timesheets:run
```

Run advanced timesheet tests with UI:

```bash
npm run test:timesheets:advanced
```

Run all timesheet tests with UI:

```bash
npm run test:timesheets:all
```

Run specific test:

```bash
npx playwright test tests/e2e/timesheets.test.ts -g "Users can edit timesheet details"
```

## Test Structure

### Data Hierarchy

The tests work with a 4-level hierarchy:

1. **Timesheet** - Top level, contains employee info and totals
2. **DTR (Daily Time Record)** - Daily records with hours worked
3. **TimeLog** - Individual time in/out entries
4. **ClockEvent** - Actual clock punch times

### Helper Utilities

The `TimesheetGridHelper` class provides methods for:

- `waitForGrid()` - Wait for AG-Grid to load
- `expandTimesheet(name)` - Expand a timesheet row
- `expandDTR(date)` - Expand a DTR row
- `expandTimeLog(mode)` - Expand a TimeLog row
- `editTimesheet(name)` - Open edit dialog for timesheet
- `editDTR(date)` - Open edit dialog for DTR
- `editTimeLog(mode)` - Open edit dialog for TimeLog
- `editClockEvent(time)` - Open edit dialog for ClockEvent
- `saveDialog()` - Save and close dialog
- `cancelDialog()` - Cancel and close dialog
- `verifyValueInGrid(value)` - Check if value exists in grid
- `getCurrentTheme()` - Get current theme (light/dark)
- `toggleTheme()` - Switch theme

### Test Data Creation

Use helper functions to create test data:

```typescript
// Create complete hierarchy
const { timesheet, dtrs, timelogs, clockEvents } =
	await createTimesheetHierarchy()

// Create multiple timesheets
const timesheets = await createMultipleTimesheets(10)

// Clean up after tests
await cleanupTestData()
```

## Common Test Patterns

### Basic Navigation Test

```typescript
test('Navigate hierarchy', async ({ page, login }) => {
	await login()
	const { timesheet, dtrs } = await createTimesheetHierarchy()
	await page.goto('/timesheets')

	const gridHelper = new TimesheetGridHelper(page)
	await gridHelper.waitForGrid()
	await gridHelper.expandTimesheet(timesheet.employeeName)
	await gridHelper.expandDTR(dtrs[0].date)
})
```

### Edit Test

```typescript
test('Edit timesheet', async ({ page, login }) => {
	await login()
	const { timesheet } = await createTimesheetHierarchy()
	await page.goto('/timesheets')

	const gridHelper = new TimesheetGridHelper(page)
	await gridHelper.waitForGrid()
	await gridHelper.editTimesheet(timesheet.employeeName)

	await page.getByLabel('Regular Hours').fill('160')
	await gridHelper.saveDialog()
	await gridHelper.verifyValueInGrid('160')
})
```

## Debugging Tips

1. **Use UI Mode** - Run tests with `--ui` flag to see what's happening
2. **Add Screenshots** - Use `await page.screenshot({ path: 'debug.png' })` to
   capture state
3. **Slow Down Tests** - Add `--slowMo=1000` to see actions in real-time
4. **Debug Mode** - Use `--debug` flag to pause at breakpoints
5. **Headed Mode** - Use `--headed` to see the browser

## Known Issues and Limitations

1. Theme switching test may need adjustment based on your theme implementation
2. Large dataset tests may need timeout adjustments on slower machines
3. Concurrent edit tests require proper backend implementation
4. Export functionality test is skipped if not implemented

## Best Practices

1. Always clean up test data after tests
2. Use helper utilities for common operations
3. Wait for animations and transitions to complete
4. Use specific selectors for AG-Grid elements
5. Test both success and error scenarios
6. Verify data persistence across operations

## Troubleshooting

### Tests Failing to Find Elements

- Ensure AG-Grid is fully loaded with `waitForGrid()`
- Add appropriate timeouts for animations
- Check if selectors match your actual DOM structure

### Database Connection Issues

- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Run `npm run setup` to ensure migrations are applied

### Theme Tests Failing

- Verify theme classes match your implementation
- Check if theme switcher button selector is correct
- Ensure cookies are enabled for theme persistence

## Contributing

When adding new tests:

1. Use the existing helper utilities
2. Follow the naming convention
3. Clean up test data
4. Document complex scenarios
5. Add to appropriate test file (basic vs advanced)
