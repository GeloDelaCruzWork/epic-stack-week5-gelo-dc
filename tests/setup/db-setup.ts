import { afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

// Create a test Prisma client directly without the remember wrapper
const testPrisma = new PrismaClient({
	log: process.env.CI ? [] : ['query', 'info', 'warn', 'error'],
})

beforeEach(async () => {
	// Clean the database by deleting all records
	// Delete in reverse order of dependencies
	await testPrisma.clockEvent.deleteMany()
	await testPrisma.timelog.deleteMany()
	await testPrisma.dTR.deleteMany()
	await testPrisma.timesheet.deleteMany()
	await testPrisma.verification.deleteMany()
	await testPrisma.session.deleteMany()
	await testPrisma.connection.deleteMany()
	await testPrisma.passkey.deleteMany()
	await testPrisma.password.deleteMany()
	await testPrisma.project.deleteMany()
	await testPrisma.permission.deleteMany()
	await testPrisma.role.deleteMany()
	await testPrisma.noteImage.deleteMany()
	await testPrisma.note.deleteMany()
	await testPrisma.userImage.deleteMany()
	await testPrisma.user.deleteMany()
})

afterAll(async () => {
	await testPrisma.$disconnect()
})
