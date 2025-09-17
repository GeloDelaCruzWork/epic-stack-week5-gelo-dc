import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/api.timesheets.create.ts'

export async function action({ request }: Route.ActionArgs) {
	await requireUserId(request)

	const data = await request.json()

	const timesheet = await prisma.timesheet.create({
		data: {
			employeeName: data.employeeName || '',
			payPeriod: data.payPeriod || '',
			detachment: data.detachment || '',
			shift: data.shift || '',
			regularHours: data.regularHours || 0,
			overtimeHours: data.overtimeHours || 0,
			nightDifferential: data.nightDifferential || 0,
		},
	})

	return { timesheet }
}
