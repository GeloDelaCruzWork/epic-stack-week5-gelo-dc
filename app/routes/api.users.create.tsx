import { json } from '@remix-run/node'
import { z } from 'zod'
import argon2 from 'argon2'
import { prisma } from '#app/utils/db.server.ts'
import { Prisma } from '@prisma/client'

const UserSchema = z.object({
	username: z.string().min(3, { message: 'Username must be at least 3 characters long' }),
	name: z.string().min(1, { message: 'Name is required' }),
	email: z.string().email({ message: 'Invalid email address' }),
	password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
})

export async function action({ request }: { request: Request }) {
	const payload = await request.json()
	const result = UserSchema.safeParse(payload)

	if (!result.success) {
		return json({ errors: result.error.flatten().fieldErrors }, { status: 400 })
	}

	const { username, name, email, password } = result.data

	const hashedPassword = await argon2.hash(password)

	try {
		const user = await prisma.user.create({
			data: {
				email,
				username,
				name,
				password: {
					create: {
						hash: hashedPassword,
					},
				},
			},
		})

		return json({ user })
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2002') {
				return json(
					{
						error: `User with this ${error.meta.target.join(', ')} already exists.`,
					},
					{ status: 409 },
				)
			}
		}
		return json({ error: 'An error occurred while creating the user.' }, { status: 500 })
	}
}
