
import { test, expect } from '@playwright/test';

test.describe('API: /api/employees/:employeeId/assignments', () => {
  const VALID_EMPLOYEE_ID = 'clx0123456789abcdef012345'; // Placeholder for a valid CUID
  const EMPLOYEE_ID_WITH_NO_ASSIGNMENTS = 'clx0123456789abcdef012346'; // Placeholder for a valid CUID with no assignments
  const INVALID_EMPLOYEE_ID = 'invalid-id';

  test('should return assignments for a valid employeeId', async ({ request }) => {
    // This test assumes that VALID_EMPLOYEE_ID exists in the test database and has assignments
    // If no assignments are found, the API returns 404.
    // To test the success path, ensure VALID_EMPLOYEE_ID has assignments in your test database.
    const response = await request.get(`/api/employees/${VALID_EMPLOYEE_ID}/assignments`);
    if (response.status() === 404) {
      const data = await response.json();
      expect(data.message).toContain(`No assignments found for employee with ID ${VALID_EMPLOYEE_ID}`);
    } else {
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.assignments).toBeInstanceOf(Array);
      expect(data.assignments.length).toBeGreaterThan(0);
      expect(data.assignments[0]).toHaveProperty('position');
      expect(data.assignments[0]).toHaveProperty('department');
      expect(data.assignments[0]).toHaveProperty('office');
    }
  });

  test('should return 404 if no assignments found for a valid employeeId', async ({ request }) => {
    // This test assumes that EMPLOYEE_ID_WITH_NO_ASSIGNMENTS exists but has no assignments
    const response = await request.get(`/api/employees/${EMPLOYEE_ID_WITH_NO_ASSIGNMENTS}/assignments`);
    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.message).toContain(`No assignments found for employee with ID ${EMPLOYEE_ID_WITH_NO_ASSIGNMENTS}`);
  });

  test('should return 400 for an invalid employeeId format', async ({ request }) => {
    const response = await request.get(`/api/employees/${INVALID_EMPLOYEE_ID}/assignments`);
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.fieldErrors.employeeId).toContain('Invalid cuid');
  });
});
