import { test, expect, type Page } from '@playwright/test';

test.describe('Employee Directory Page', () => {
  test.describe.configure({ mode: 'serial' });

  // --- Helpers ---
  async function waitForGridStable(page: Page, timeout = 10000) {
    await expect(page.locator('.ag-root-wrapper')).toBeVisible();

    // Wait for either rows to be visible or the "no rows" overlay to be visible.
    await Promise.race([
      expect(page.locator('.ag-body-viewport .ag-row').first()).toBeVisible({ timeout }),
      expect(page.locator('.ag-overlay-no-rows-wrapper')).toBeVisible({ timeout }),
    ]);

    // Also ensure the grid's specific loading overlay is gone.
    await expect(page.locator('.ag-overlay-loading-wrapper')).toBeHidden({ timeout });
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
    await waitForGridStable(page);
  });

  test('should load the employee list and display the grid', async ({ page }) => {
    await expect(page.getByText('Employee Directory')).toBeVisible();
    await expect(page.locator('.ag-body-viewport .ag-row')).toHaveCount(10);
    await expect(page.getByText(/Page 1 of/)).toBeVisible();
  });

  test('should expand an employee row to show assignments', async ({ page }) => {
    const expandToggle = page
      .locator('.ag-center-cols-container .ag-row .ag-group-contracted')
      .first();
    await expandToggle.click();

    const detailContent = page
      .locator('.ag-center-cols-container .ag-row')
      .filter({ hasText: /Department|Position|202/ });

    await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter employees by quick search', async ({ page }) => {
    const quickSearchInput = page.getByPlaceholder(/Quick search/);
    await quickSearchInput.fill('Patience');
    await page.waitForURL(/search=Patience/);
    await waitForGridStable(page);

    await expect(
      page.locator('.ag-center-cols-container .ag-row').first(),
    ).toContainText('Patience');
  });

  test('should filter employees by department', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Department' }).click();
    await page.getByRole('option', { name: 'Engineering' }).click();
    await waitForGridStable(page);

    await expect(
      page.locator('.ag-center-cols-container .ag-row').first(),
    ).toContainText('Engineering');
  });

  test('should navigate through pages', async ({ page }) => {
    const next = page.getByRole('button', { name: 'Go to next page' });
    const prev = page.getByRole('button', { name: 'Go to previous page' });

    await expect(prev).toBeDisabled();
    await expect(next).toBeEnabled();

    // Perform the click and wait for the URL to change simultaneously
    await Promise.all([
      page.waitForURL(/page=2/),
      next.click(),
    ]);

    // The URL is now page=2. Wait for the grid to update with the new data.
    await waitForGridStable(page);

    // Now that the grid is stable, the rest of the UI should be too.
    await expect(page.getByText(/Page 2 of/)).toBeVisible();
    await expect(prev).toBeEnabled();
    await expect(page.locator('.ag-body-viewport .ag-row')).toHaveCount(10);
  });
test('should sort employees by Full Name when column header is clicked', async ({ page }) => {
  // Click column header to trigger sort
  await page.getByRole('columnheader', { name: 'Full Name' }).click();
  await waitForGridStable(page);

  // Grab the first 10 names from the grid
  const names = await page
    .locator('.ag-center-cols-container .ag-row [col-id="fullName"]')
    .allTextContents();

  // Expect correct lexicographic order
  expect(names).toEqual([
    'Abbott, Paxton',
    'Abbott, Ryder',
    'Abernathy, Christine',
    'Abernathy, Xavier',
    'Adams, Randy',
    'Anderson, Clint',
    'Ankunding, Talia',
    'Armstrong, Schuyler',
    'Auer, Bradley',
    'Auer, Herbert',
  ]);
});


  test('should change page size', async ({ page }) => {
    const combobox = page.getByRole('combobox', { name: 'Rows per page:' });
    await combobox.click();
    await page.keyboard.press('ArrowDown'); // 10 → 20
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/pageSize=20/);
    await waitForGridStable(page);

    await expect(page.locator('.ag-body-viewport .ag-row')).toHaveCount(20);
  });

  test('should reset filters when Reset button is clicked', async ({ page }) => {
    const quickSearchInput = page.getByPlaceholder(/Quick search/);
    await quickSearchInput.fill('Patience');
    await page.waitForURL(/search=Patience/);
    await waitForGridStable(page);

    const initialRowCount = await page.locator('.ag-body-viewport .ag-row').count();
    expect(initialRowCount).toBeLessThan(10);

    await page.getByRole('button', { name: 'Reset' }).click();
    await page.waitForURL(url => !url.search.includes('search='));
    await waitForGridStable(page);

    await expect(quickSearchInput).toHaveValue('');
    await expect(page.locator('.ag-body-viewport .ag-row')).toHaveCount(10);
  });
});
