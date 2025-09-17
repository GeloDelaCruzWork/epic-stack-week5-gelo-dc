import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { prisma } from '#app/utils/db.server';
import { z } from 'zod';

// Define schema for query parameters
const EmployeeFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  employeeCode: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
  civilStatus: z.enum(['Single', 'Married', 'Widowed', 'Separated']).optional(),
  isActive: z.coerce.boolean().optional(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const result = EmployeeFilterSchema.safeParse(Object.fromEntries(url.searchParams));

  if (!result.success) {
    return json({ error: result.error.flatten() }, { status: 400 });
  }

  const { page, pageSize, firstName, lastName, employeeCode, gender, civilStatus, isActive } = result.data;

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where: any = {};

  if (firstName) {
    where.firstName = { contains: firstName, mode: 'insensitive' };
  }
  if (lastName) {
    where.lastName = { contains: lastName, mode: 'insensitive' };
  }
  if (employeeCode) {
    where.employeeCode = { contains: employeeCode, mode: 'insensitive' };
  }
  if (gender) {
    where.gender = gender;
  }
  if (civilStatus) {
    where.civilStatus = civilStatus;
  }
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [employees, totalCount] = await prisma.$transaction([
    prisma.employee.findMany({
      where,
      skip,
      take,
      include: {
        assignments: {
          include: {
            position: true,
            department: true,
            office: true,
          },
          orderBy: [
            { isPrimary: 'desc' }, // Primary assignments first
            { effectiveDate: 'desc' }, // Then by latest effective date
          ],
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    }),
    prisma.employee.count({ where }),
  ]);

  const employeesWithCurrentAssignment = employees.map(employee => {
    const currentAssignment = employee.assignments.length > 0 ? employee.assignments[0] : null;
    // Remove the full assignments array from the top level to avoid redundancy and keep only the current one
    const { assignments, ...employeeWithoutAssignments } = employee;
    return {
      ...employeeWithoutAssignments,
      currentAssignment,
    };
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return json({
    employees: employeesWithCurrentAssignment,
    pagination: {
      totalCount,
      currentPage: page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
}
