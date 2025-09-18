import { test, expect } from '@playwright/test';

test.describe('API: /api/employees', () => {
  test('should return a list of employees with default pagination', async ({ request }) => {
    const response = await request.get('/api/employees');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.employees).toBeInstanceOf(Array);
    // Check top-level pagination/filter props
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(10); // Default page size is now 10

    // Check nested pagination object
    expect(data.pagination).toBeDefined();
    expect(data.pagination.currentPage).toBe(1);
    expect(data.pagination.pageSize).toBe(10);

    // Check the shape of the first employee
    if (data.employees.length > 0) {
        const firstEmployee = data.employees[0];
        expect(typeof firstEmployee.fullName).toBe('string');
        expect(typeof firstEmployee.status).toBe('string');
        expect(firstEmployee.assignments).toBeInstanceOf(Array);
        // This is key: we only fetch one assignment for the list view
        expect(firstEmployee.assignments.length).toBeLessThanOrEqual(1);
    }
  });

  test('should return employees with specified pagination', async ({ request }) => {
    const response = await request.get('/api/employees?page=2&pageSize=5');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.employees).toBeInstanceOf(Array);
    expect(data.employees.length).toBe(5);
    expect(data.page).toBe(2);
    expect(data.pageSize).toBe(5);
    expect(data.pagination.currentPage).toBe(2);
  });

  test('should filter employees by a generic search term', async ({ request }) => {
    // This test assumes an employee with "Patience" in their name exists
    const response = await request.get('/api/employees?search=Patience');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.employees).toBeInstanceOf(Array);
    // Every returned employee should contain "Patience" in their full name
    expect(data.employees.every((emp: any) => emp.fullName.includes('Patience'))).toBeTruthy();
  });

  test('should filter employees by status', async ({ request }) => {
    const response = await request.get('/api/employees?status=Inactive');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.employees).toBeInstanceOf(Array);
    // Every returned employee should be Inactive
    expect(data.employees.every((emp: any) => emp.status === 'Inactive')).toBeTruthy();
  });

  test('should filter employees by department', async ({ request }) => {
    // This assumes 'Engineering' is a valid department in the test data
    const response = await request.get('/api/employees?department=Engineering');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.employees).toBeInstanceOf(Array);
    // Every returned employee should have a primary assignment in Engineering
    expect(data.employees.every((emp: any) => emp.assignments[0]?.department === 'Engineering')).toBeTruthy();
  });

  test('should return 400 for invalid page parameter', async ({ request }) => {
    const response = await request.get('/api/employees?page=invalid');
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.fieldErrors.page).toBeDefined();
  });

  test('should return 400 for invalid pageSize parameter', async ({ request }) => {
    const response = await request.get('/api/employees?pageSize=invalid');
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.fieldErrors.pageSize).toBeDefined();
  });

  test('should return empty array if no employees match filters', async ({ request }) => {
    const response = await request.get('/api/employees?search=NonExistentName123456789');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.employees).toBeInstanceOf(Array);
    expect(data.employees.length).toBe(0);
    expect(data.totalCount).toBe(0);
  });
});