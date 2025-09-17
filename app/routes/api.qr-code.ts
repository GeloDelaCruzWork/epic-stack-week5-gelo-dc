import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { prisma } from '#app/utils/db.server.ts'

export async function loader({ request }: LoaderFunctionArgs) {
    const qrCodes = await prisma.qRCode.findMany();
    return json({ qrCodes });
}

const ClockInSchema = z.object({
	qrCodeData: z.string(),
	time: z.string(),
	fullName: z.string().min(1, 'Full Name is required'),
	detachment: z.string().min(1, 'Detachment is required'),
})

export async function action({ request }: ActionFunctionArgs) {
	if (request.method !== 'POST') {
		return json({ message: 'Method not allowed' }, { status: 405 })
	}

	const submission = ClockInSchema.safeParse(await request.json())

	if (!submission.success) {
		return json({ errors: submission.error.flatten().fieldErrors }, { status: 400 })
	}

	const { qrCodeData, time, fullName, detachment } = submission.data

	const existingQrCode = await prisma.qRCode.findUnique({
		where: { data: qrCodeData },
	})

	if (existingQrCode?.isUsed) {
		return json({ errors: { qrCodeData: ['This QR code has already been used.'] } }, { status: 400 })
	}

	await prisma.qRCode.upsert({
		where: { data: qrCodeData },
		update: {
			isUsed: true,
			updatedAt: new Date(),
			time: new Date(time),
			fullName,
			detachment,
		},
		create: {
			data: qrCodeData,
			isUsed: true,
			time: new Date(time),
			fullName,
			detachment,
		},
	})

	return json({ success: true })
}