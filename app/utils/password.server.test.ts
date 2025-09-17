import { describe, expect, test, vi } from 'vitest'
import { hashPassword, verifyPassword } from './password.server.ts'

describe('password.server utilities', () => {
	describe('hashPassword', () => {
		test('should create an argon2id hash', async () => {
			const password = 'TestPassword123!'
			const hash = await hashPassword(password)

			expect(hash).toBeTruthy()
			expect(hash.startsWith('$argon2id$')).toBe(true)
		})

		test('should create different hashes for the same password', async () => {
			const password = 'SamePassword123!'
			const hash1 = await hashPassword(password)
			const hash2 = await hashPassword(password)

			expect(hash1).not.toBe(hash2)
			expect(hash1.startsWith('$argon2id$')).toBe(true)
			expect(hash2.startsWith('$argon2id$')).toBe(true)
		})

		test('should handle empty passwords', async () => {
			const hash = await hashPassword('')
			expect(hash).toBeTruthy()
			expect(hash.startsWith('$argon2id$')).toBe(true)
		})

		test('should handle very long passwords', async () => {
			const longPassword = 'a'.repeat(1000)
			const hash = await hashPassword(longPassword)
			expect(hash).toBeTruthy()
			expect(hash.startsWith('$argon2id$')).toBe(true)
		})
	})

	describe('verifyPassword', () => {
		test('should verify correct argon2 password', async () => {
			const password = 'CorrectPassword123!'
			const hash = await hashPassword(password)

			const result = await verifyPassword(hash, password)

			expect(result.valid).toBe(true)
			expect(result.needsRehash).toBe(false)
		})

		test('should reject incorrect argon2 password', async () => {
			const password = 'CorrectPassword123!'
			const hash = await hashPassword(password)

			const result = await verifyPassword(hash, 'WrongPassword!')

			expect(result.valid).toBe(false)
			expect(result.needsRehash).toBe(false)
		})

		test('should handle special characters in password', async () => {
			const password = '!@#$%^&*()_+-=[]{}|;:,.<>?'
			const hash = await hashPassword(password)

			const result = await verifyPassword(hash, password)

			expect(result.valid).toBe(true)
			expect(result.needsRehash).toBe(false)
		})

		test('should handle unicode characters in password', async () => {
			const password = '密码パスワード🔒'
			const hash = await hashPassword(password)

			const result = await verifyPassword(hash, password)

			expect(result.valid).toBe(true)
			expect(result.needsRehash).toBe(false)
		})

		test('should handle case sensitivity', async () => {
			const password = 'CaseSensitive123'
			const hash = await hashPassword(password)

			const wrongCaseResult = await verifyPassword(hash, 'casesensitive123')
			expect(wrongCaseResult.valid).toBe(false)

			const correctCaseResult = await verifyPassword(hash, password)
			expect(correctCaseResult.valid).toBe(true)
		})

		test('should reject malformed hash', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
			const result = await verifyPassword('not-a-valid-hash', 'password')

			expect(result.valid).toBe(false)
			expect(result.needsRehash).toBe(false)
			expect(consoleSpy).toHaveBeenCalled()
			consoleSpy.mockRestore()
		})

		test('should reject empty hash', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
			const result = await verifyPassword('', 'password')

			expect(result.valid).toBe(false)
			expect(result.needsRehash).toBe(false)
			expect(consoleSpy).toHaveBeenCalled()
			consoleSpy.mockRestore()
		})

		test('should handle argon2 verification errors gracefully', async () => {
			// Malformed argon2 hash
			const malformedHash = '$argon2id$corrupted'

			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
			const result = await verifyPassword(malformedHash, 'password')

			expect(result.valid).toBe(false)
			expect(result.needsRehash).toBe(false)
			expect(consoleSpy).toHaveBeenCalled()

			consoleSpy.mockRestore()
		})
	})

	describe('security properties', () => {
		test('should use proper argon2id parameters', async () => {
			const password = 'TestPassword'
			const hash = await hashPassword(password)

			// Check that the hash contains expected parameters
			// $argon2id$v=19$m=19456,t=2,p=1$...
			expect(hash).toContain('$argon2id$')
			expect(hash).toContain('m=19456') // 19 MiB memory
			expect(hash).toContain('t=2') // 2 iterations
			expect(hash).toContain('p=1') // 1 parallelism
		})

		test('should take reasonable time to hash', async () => {
			const password = 'TestPassword'
			const startTime = Date.now()

			await hashPassword(password)

			const endTime = Date.now()
			const duration = endTime - startTime

			// Should take between 10ms and 5000ms (reasonable range for argon2id)
			expect(duration).toBeGreaterThan(10)
			expect(duration).toBeLessThan(5000)
		})
	})
})
