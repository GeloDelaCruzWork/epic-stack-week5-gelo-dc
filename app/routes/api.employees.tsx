import { type LoaderFunctionArgs } from 'react-router';
import { prisma } from '#app/utils/db.server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// Define a unified schema for query parameters from both UI and API
const EmployeeFilterSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).default(10),
	search: z.string().optional(),
	department: z.string().optional(),
	position: z.string().optional(),
	status: z.string().optional(),
});

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const result = EmployeeFilterSchema.safeParse(
		Object.fromEntries(url.searchParams),
	);

	if (!result.success) {
		return new Response(JSON.stringify({ error: result.error.flatten() }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const { page, pageSize, search, department, position, status } = result.data;

	const skip = (page - 1) * pageSize;
	const take = pageSize;

	const where: Prisma.EmployeeWhereInput = {};
	const andConditions: Prisma.EmployeeWhereInput[] = [];

	if (search) {
		andConditions.push({
			OR: [
				{ firstName: { contains: search, mode: 'insensitive' } },
				{ lastName: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
			],
		});
	}

	if (status && status !== 'all') {
		andConditions.push({ isActive: status === 'Active' });
	}

	if (department && department !== 'all') {
		andConditions.push({
			assignments: {
				some: { department: { name: department } },
			},
		});
	}

	if (position && position !== 'all') {
		andConditions.push({
			assignments: {
				some: { position: { title: position } },
			},
		});
	}

	if (andConditions.length > 0) {
		where.AND = andConditions;
	}

	try {
		const [employees, totalCount] = await prisma.$transaction([
			prisma.employee.findMany({
				where,
				skip,
				take,
				include: {
					assignments: {
						take: 1, // Only fetch the primary/most recent assignment for the grid view
						include: {
							position: true,
							department: true,
							office: true,
						},
						orderBy: [
							{ isPrimary: 'desc' },
							{ effectiveDate: 'desc' },
						],
					},
				},
				orderBy: {
					lastName: 'asc',
				},
			}),
			prisma.employee.count({ where }),
		]);

        // The UI component expects a slightly different shape for assignments
		const formattedEmployees = employees.map(employee => {
			return {
				...employee,
                fullName: `${employee.lastName}, ${employee.firstName}`,
                status: employee.isActive ? 'Active' : 'Inactive',
				assignments: employee.assignments.map(a => ({
					...a,
					department: a.department.name,
					position: a.position.title,
                    office: a.office?.name,
				})),
			};
		});

		const totalPages = Math.ceil(totalCount / pageSize);

		return {
			employees: formattedEmployees,
			totalCount,
            page,
            pageSize,
            // Also return the filter params so the UI can display them
            search,
            department,
            position,
            status,
            // Keep the pagination block for other potential API consumers
			pagination: {
				totalCount,
				currentPage: page,
				pageSize,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
		};
	} catch (error) {
		console.error('Failed to fetch employees:', error);
		return new Response(
			JSON.stringify({ error: 'Failed to fetch employees. Please try again later.' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } },
		);
	}
}