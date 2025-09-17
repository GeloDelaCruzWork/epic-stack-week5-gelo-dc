import argon2 from 'argon2'

/**
 * Hash a password using argon2id algorithm
 * More secure against GPU attacks than bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
	return argon2.hash(password, {
		type: argon2.argon2id,
		memoryCost: 19456, // 19 MiB
		timeCost: 2,
		parallelism: 1,
	})
}

/**
 * Verify a password against a hash using argon2id
 */
export async function verifyPassword(
	hash: string,
	password: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
	try {
		const valid = await argon2.verify(hash, password)
		return { valid, needsRehash: false }
	} catch (error) {
		console.error('Password verification failed:', error)
		return { valid: false, needsRehash: false }
	}
}
