import { test, expect } from '@playwright/test';

test.describe('Employee Directory Page', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
    await expect(page.locator('.ag-root-wrapper')).toBeVisible();
  });

  test('should load the employee list and display the grid', async ({ page }) => {
    await expect(page.getByText('Employee Directory')).toBeVisible();
    await expect(page.locator('.ag-body-viewport .ag-row')).toHaveCount(10);
    await expect(page.getByText(/Page 1 of/)).toBeVisible();
  });

test('should expand an employee row to show assignments', async ({ page }) => {
  const firstRow = page.locator('.ag-center-cols-container .ag-row').first();

  // expand
  await firstRow.locator('.ag-icon-tree-closed').click();
  await expect(firstRow).toHaveAttribute('aria-expanded', 'true');

  // collapse again
  await firstRow.locator('.ag-icon-tree-open').click();
  await expect(firstRow).toHaveAttribute('aria-expanded', 'false');
});



  test('should filter employees by quick search', async ({ page }) => {
    const quickSearchInput = page.getByPlaceholder(/Quick search/);
    await quickSearchInput.fill('Patience');
    await page.getByRole('button', { name: 'Apply' }).click();
    const firstRow = page.locator('.ag-center-cols-container .ag-row').first();
    await expect(firstRow).toContainText('Patience');
  });

 test('should filter employees by department', async ({ page }) => {
  // open the Department dropdown
  await page.getByRole('combobox').nth(0).click(); // first combobox = Department

  // select "Engineering" from options
  await page.getByRole('option', { name: 'Engineering' }).click();

  await page.getByRole('button', { name: 'Apply' }).click();

  // verify grid updated
  const firstRow = page.locator('.ag-center-cols-container .ag-row').first();
  await expect(firstRow).toContainText('Engineering');
});


  test('should navigate through pages', async ({ page }) => {
    const next = page.getByRole('button', { name: 'Go to next page' });
    const prev = page.getByRole('button', { name: 'Go to previous page' });

    await expect(prev).toBeDisabled();

    await next.click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/Page 2 of/)).toBeVisible();
    await expect(prev).toBeEnabled();

    await prev.click();
    await expect(page).toHaveURL(/page=1/);
    await expect(page.getByText(/Page 1 of/)).toBeVisible();
    await expect(prev).toBeDisabled();
  });

test('should sort employees by Full Name when column header is clicked', async ({ page }) => {
  const fullNameHeader = page.locator('.ag-header-cell[col-id="fullName"]');

  // Click the header to trigger sorting
  await fullNameHeader.click();

  // Assert that the grid updated — e.g. first row is still visible
  const firstRow = page.locator('.ag-center-cols-container .ag-row').first();
  await expect(firstRow).toBeVisible();

  // Optionally, check that the header has *some* sort state applied
  await expect(fullNameHeader).toHaveAttribute('aria-sort', /ascending|descending/);
});



test('should change page size', async ({ page }) => {
  // Target the "Rows per page" combobox by nearby text
  const pageSizeDropdown = page.locator('text=Rows per page:').locator('..').getByRole('combobox');
  await pageSizeDropdown.click();

  // Select "20"
  await page.getByRole('option', { name: '20' }).click();

  // Verify URL and row count updated
  await expect(page).toHaveURL(/pageSize=20/);
  await expect(page.locator('.ag-body-viewport .ag-row')).toHaveCount(20);
});

  test('should reset filters when Reset button is clicked', async ({ page }) => {
    // First, apply a filter
    const quickSearchInput = page.getByPlaceholder(/Quick search/);
    await quickSearchInput.fill('Patience');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Wait for the grid to update and verify the filtered result
    const firstRow = page.locator('.ag-center-cols-container .ag-row').first();
    await expect(firstRow).toContainText('Patience');

    // Now, click the Reset button
    await page.getByRole('button', { name: 'Reset' }).click();

    // Verify the search input is cleared
    await expect(quickSearchInput).toHaveValue('');

    // Verify the grid is back to its original state (e.g. 10 rows)
    await expect(page.locator('.ag-body-viewport .ag-row')).toHaveCount(10);
  });


});
