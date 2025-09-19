import { type LoaderFunctionArgs } from 'react-router';
import { prisma } from '#app/utils/db.server';
import { z } from 'zod';

const EmployeeIdSchema = z.object({
  employeeId: z.string().cuid(), // Assuming employeeId is a CUID
});

export async function loader({ params }: LoaderFunctionArgs) {
  const result = EmployeeIdSchema.safeParse(params);

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { employeeId } = result.data;

  try {
    const assignments = await prisma.employeeAssignment.findMany({
      where: {
        employeeId: employeeId,
      },
      include: {
        position: true,
        department: true,
        office: true,
      },
      orderBy: {
        effectiveDate: 'desc', // Order by latest effective date
      },
    });

    if (!assignments || assignments.length === 0) {
      return new Response(JSON.stringify({ message: `No assignments found for employee with ID ${employeeId}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formattedAssignments = assignments.map(a => ({
        ...a,
        department: a.department.name,
        position: a.position.title,
        office: a.office?.name,
    }));

    return { assignments: formattedAssignments };
  } catch (error) {
    console.error(`Failed to fetch assignments for employee ${employeeId}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to fetch assignments. Please try again later.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}