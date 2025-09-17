import { faker } from '@faker-js/faker'
import { describe, expect, test, vi } from 'vitest'
import { prisma } from '#app/utils/db.server.ts'
import {
	createUserInDb as createUser,
	createPassword,
	ensureUserRole,
} from '#tests/db-utils.ts'
import { consoleError } from '#tests/setup/setup-test-env.ts'
import {
	login,
	resetUserPassword,
	signup,
	verifyUserPassword,
	getPasswordHash,
} from './auth.server.ts'
import { hashPassword, verifyPassword } from './password.server.ts'

describe('auth.server integration tests', () => {
	describe('password hashing with argon2', () => {
		test('signup creates user with argon2 hashed password', async () => {
			await ensureUserRole()
			const userData = {
				username: faker.internet.username(),
				email: faker.internet.email(),
				name: faker.person.fullName(),
				password: faker.internet.password({ length: 12 }),
			}

			const session = await signup(userData)
			expect(session).toBeTruthy()
			expect(session.id).toBeTruthy()

			// Verify the password was hashed with argon2
			const user = await prisma.user.findUnique({
				where: { username: userData.username.toLowerCase() }, // signup lowercases the username
				include: { password: true },
			})

			expect(user).toBeTruthy()
			expect(user?.password).toBeTruthy()
			expect(user?.password?.hash).toBeTruthy()
			expect(user?.password?.hash.startsWith('$argon2')).toBe(true)

			// Verify we can login with the password
			const loginSession = await login({
				username: userData.username.toLowerCase(), // login also expects lowercase
				password: userData.password,
			})
			expect(loginSession).toBeTruthy()
		})

		test('getPasswordHash uses argon2', async () => {
			const password = 'TestPassword123!'
			const hash = await getPasswordHash(password)

			expect(hash.startsWith('$argon2id$')).toBe(true)

			// Should be able to verify it
			const result = await verifyPassword(hash, password)
			expect(result.valid).toBe(true)
			expect(result.needsRehash).toBe(false)
		})
	})

	describe('session invalidation', () => {
		test('resetUserPassword invalidates all user sessions', async () => {
			// Create user with password
			const user = await createUser()
			const password = 'OldPassword123!'
			const passwordData = await createPassword(password)
			await prisma.password.upsert({
				where: { userId: user.id },
				update: passwordData,
				create: {
					userId: user.id,
					...passwordData,
				},
			})

			// Create multiple sessions for the user
			const session1 = await prisma.session.create({
				data: {
					userId: user.id,
					expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
				},
			})
			const session2 = await prisma.session.create({
				data: {
					userId: user.id,
					expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
				},
			})

			// Verify sessions exist
			const sessionsBefore = await prisma.session.findMany({
				where: { userId: user.id },
			})
			expect(sessionsBefore).toHaveLength(2)

			// Reset password
			const newPassword = 'NewPassword123!'
			await resetUserPassword({
				username: user.username,
				password: newPassword,
			})

			// Verify all sessions are deleted
			const sessionsAfter = await prisma.session.findMany({
				where: { userId: user.id },
			})
			expect(sessionsAfter).toHaveLength(0)

			// Verify new password works with argon2
			const updatedPassword = await prisma.password.findUnique({
				where: { userId: user.id },
			})
			expect(updatedPassword?.hash.startsWith('$argon2')).toBe(true)

			// Verify login works with new password
			const newSession = await login({
				username: user.username,
				password: newPassword,
			})
			expect(newSession).toBeTruthy()
		})

		test('resetUserPassword handles user with no sessions gracefully', async () => {
			// Create user with password but no sessions
			const user = await createUser()
			const password = 'OldPassword123!'
			const passwordData = await createPassword(password)
			await prisma.password.upsert({
				where: { userId: user.id },
				update: passwordData,
				create: {
					userId: user.id,
					...passwordData,
				},
			})

			// Reset password (should not throw even with no sessions)
			const newPassword = 'NewPassword123!'
			const result = await resetUserPassword({
				username: user.username,
				password: newPassword,
			})

			expect(result).toBeTruthy()
			expect(result.id).toBe(user.id)

			// Verify password was updated
			const updatedPassword = await prisma.password.findUnique({
				where: { userId: user.id },
			})
			expect(updatedPassword?.hash.startsWith('$argon2')).toBe(true)
		})
	})

	describe('error handling', () => {
		test('login returns null for non-existent user', async () => {
			const result = await login({
				username: 'nonexistent',
				password: 'password',
			})
			expect(result).toBeNull()
		})

		test('login returns null for wrong password', async () => {
			const user = await createUser()
			const passwordData = await createPassword('CorrectPassword123!')
			await prisma.password.upsert({
				where: { userId: user.id },
				update: passwordData,
				create: {
					userId: user.id,
					...passwordData,
				},
			})

			const result = await login({
				username: user.username,
				password: 'WrongPassword123!',
			})
			expect(result).toBeNull()
		})

		test('verifyUserPassword returns null for user without password', async () => {
			const user = await createUser()
			// User has no password (e.g., OAuth only)

			const result = await verifyUserPassword({ id: user.id }, 'anypassword')
			expect(result).toBeNull()
		})

		test('verifyUserPassword handles malformed hash gracefully', async () => {
			consoleError.mockImplementation(() => {})

			const user = await createUser()
			await prisma.password.upsert({
				where: { userId: user.id },
				update: { hash: 'malformed-hash' },
				create: {
					userId: user.id,
					hash: 'malformed-hash',
				},
			})

			const result = await verifyUserPassword({ id: user.id }, 'password')
			expect(result).toBeNull()

			consoleError.mockRestore()
		})
	})

	describe('session creation and expiration', () => {
		test('signup creates session with correct expiration', async () => {
			await ensureUserRole()
			const userData = {
				username: faker.internet.username(),
				email: faker.internet.email(),
				name: faker.person.fullName(),
				password: faker.internet.password({ length: 12 }),
			}

			const beforeTime = Date.now()
			const session = await signup(userData)
			const afterTime = Date.now()

			expect(session.expirationDate).toBeTruthy()

			const expirationTime = session.expirationDate.getTime()
			const thirtyDaysInMs = 1000 * 60 * 60 * 24 * 30

			// Expiration should be approximately 30 days from now
			expect(expirationTime).toBeGreaterThan(beforeTime + thirtyDaysInMs - 1000)
			expect(expirationTime).toBeLessThan(afterTime + thirtyDaysInMs + 1000)
		})

		test('login creates session with correct expiration', async () => {
			const user = await createUser()
			const password = 'TestPassword123!'
			const passwordData = await createPassword(password)
			await prisma.password.upsert({
				where: { userId: user.id },
				update: passwordData,
				create: {
					userId: user.id,
					...passwordData,
				},
			})

			const beforeTime = Date.now()
			const session = await login({
				username: user.username,
				password,
			})
			const afterTime = Date.now()

			expect(session).toBeTruthy()
			expect(session?.expirationDate).toBeTruthy()

			const expirationTime = session!.expirationDate.getTime()
			const thirtyDaysInMs = 1000 * 60 * 60 * 24 * 30

			// Expiration should be approximately 30 days from now
			expect(expirationTime).toBeGreaterThan(beforeTime + thirtyDaysInMs - 1000)
			expect(expirationTime).toBeLessThan(afterTime + thirtyDaysInMs + 1000)
		})
	})
})
