import { prisma } from '#app/utils/db.server.ts'

async function makeKodyAdmin() {
	console.log('Making kody an admin...')

	// Find or create admin role
	const adminRole = await prisma.role.upsert({
		where: { name: 'admin' },
		create: {
			name: 'admin',
			description: 'Administrator with full access',
			permissions: {
				create: [
					{ entity: 'user', action: 'create', access: 'any' },
					{ entity: 'user', action: 'read', access: 'any' },
					{ entity: 'user', action: 'update', access: 'any' },
					{ entity: 'user', action: 'delete', access: 'any' },
					{ entity: 'note', action: 'create', access: 'any' },
					{ entity: 'note', action: 'read', access: 'any' },
					{ entity: 'note', action: 'update', access: 'any' },
					{ entity: 'note', action: 'delete', access: 'any' },
				].map((permission) => ({
					...permission,
					description: `${permission.action} ${permission.access} ${permission.entity}`,
				})),
			},
		},
		update: {},
	})

	// Find kody user
	const kody = await prisma.user.findUnique({
		where: { username: 'kody' },
		include: { roles: true },
	})

	if (!kody) {
		console.error('User "kody" not found. Please run the seed script first.')
		process.exit(1)
	}

	// Check if kody already has admin role
	const hasAdminRole = kody.roles.some((role) => role.name === 'admin')

	if (!hasAdminRole) {
		// Add admin role to kody
		await prisma.user.update({
			where: { id: kody.id },
			data: {
				roles: {
					connect: { id: adminRole.id },
				},
			},
		})
		console.log('✅ Successfully added admin role to kody')
	} else {
		console.log('ℹ️ Kody already has admin role')
	}

	console.log('Done!')
}

makeKodyAdmin()
	.catch(console.error)
	.finally(() => prisma.$disconnect())
