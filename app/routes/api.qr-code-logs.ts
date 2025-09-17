import { json } from '@remix-run/node'
import { prisma } from '#app/utils/db.server.ts'

export async function loader() {
	const qrCodes = await prisma.qRCode.findMany({
		orderBy: { createdAt: 'desc' },
	})
	return json({ qrCodes })
}
