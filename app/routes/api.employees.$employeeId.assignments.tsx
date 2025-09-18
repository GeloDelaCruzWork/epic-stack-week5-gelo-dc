import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { prisma } from '#app/utils/db.server';
import { z } from 'zod';

const EmployeeIdSchema = z.object({
  employeeId: z.string().cuid(), // Assuming employeeId is a CUID
});

export async function loader({ params }: LoaderFunctionArgs) {
  const result = EmployeeIdSchema.safeParse(params);

  if (!result.success) {
    return json({ error: result.error.flatten() }, { status: 400 });
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
      return json({ message: `No assignments found for employee with ID ${employeeId}` }, { status: 404 });
    }

    const formattedAssignments = assignments.map(a => ({
        ...a,
        department: a.department.name,
        position: a.position.title,
        office: a.office?.name,
    }));

    return json({ assignments: formattedAssignments });
  } catch (error) {
    console.error(`Failed to fetch assignments for employee ${employeeId}:`, error);
    return json({ error: 'Failed to fetch assignments. Please try again later.' }, { status: 500 });
  }
}
