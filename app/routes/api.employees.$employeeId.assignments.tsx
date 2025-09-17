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

  return json({ assignments });
}
