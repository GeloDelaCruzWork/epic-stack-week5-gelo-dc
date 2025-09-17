import { faker } from '@faker-js/faker'
import * as argon2 from 'argon2'
import { UniqueEnforcer } from 'enforce-unique'
import { prisma } from '#app/utils/db.server.ts'

const uniqueUsernameEnforcer = new UniqueEnforcer()

export async function ensureUserRole() {
	return prisma.role.upsert({
		where: { name: 'user' },
		create: { name: 'user', description: 'Default user role' },
		update: {},
	})
}

export function createUser() {
	const firstName = faker.person.firstName()
	const lastName = faker.person.lastName()

	const username = uniqueUsernameEnforcer
		.enforce(() => {
			return (
				faker.string.alphanumeric({ length: 2 }) +
				'_' +
				faker.internet.username({
					firstName: firstName.toLowerCase(),
					lastName: lastName.toLowerCase(),
				})
			)
		})
		.slice(0, 20)
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, '_')
	return {
		username,
		name: `${firstName} ${lastName}`,
		email: `${username}@example.com`,
	}
}

export async function createUserInDb(
	overrides?: Partial<{ username: string; name: string; email: string }>,
) {
	const userData = createUser()
	return prisma.user.create({
		data: {
			...userData,
			...overrides,
		},
		select: {
			id: true,
			username: true,
			name: true,
			email: true,
		},
	})
}

export async function createPassword(
	password: string = faker.internet.password(),
) {
	return {
		hash: await argon2.hash(password, {
			type: argon2.argon2id,
			memoryCost: 19456, // 19 MiB
			timeCost: 2,
			parallelism: 1,
		}),
	}
}

let noteImages: Array<{ altText: string; objectKey: string }> | undefined
export async function getNoteImages() {
	if (noteImages) return noteImages

	noteImages = await Promise.all([
		{
			altText: 'a nice country house',
			objectKey: 'notes/0.png',
		},
		{
			altText: 'a city scape',
			objectKey: 'notes/1.png',
		},
		{
			altText: 'a sunrise',
			objectKey: 'notes/2.png',
		},
		{
			altText: 'a group of friends',
			objectKey: 'notes/3.png',
		},
		{
			altText: 'friends being inclusive of someone who looks lonely',
			objectKey: 'notes/4.png',
		},
		{
			altText: 'an illustration of a hot air balloon',
			objectKey: 'notes/5.png',
		},
		{
			altText:
				'an office full of laptops and other office equipment that look like it was abandoned in a rush out of the building in an emergency years ago.',
			objectKey: 'notes/6.png',
		},
		{
			altText: 'a rusty lock',
			objectKey: 'notes/7.png',
		},
		{
			altText: 'something very happy in nature',
			objectKey: 'notes/8.png',
		},
		{
			altText: `someone at the end of a cry session who's starting to feel a little better.`,
			objectKey: 'notes/9.png',
		},
	])

	return noteImages
}

let userImages: Array<{ objectKey: string }> | undefined
export async function getUserImages() {
	if (userImages) return userImages

	userImages = await Promise.all(
		Array.from({ length: 10 }, (_, index) => ({
			objectKey: `user/${index}.jpg`,
		})),
	)

	return userImages
}
