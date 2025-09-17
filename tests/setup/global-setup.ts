import { execa, execaCommand } from 'execa'
import 'dotenv/config'
import '#app/utils/env.server.ts'
import '#app/utils/cache.server.ts'

export async function setup() {
	// For PostgreSQL, we'll use a test database
	const testDatabaseUrl =
		process.env.TEST_DATABASE_URL ||
		'postgresql://epic_user:epic_pass@localhost:5433/epic_test_db'

	// Drop and recreate test database
	const pgUrl = new URL(testDatabaseUrl)
	const dbName = pgUrl.pathname.slice(1)
	// Connect to 'postgres' database to create/drop other databases
	pgUrl.pathname = '/postgres'

	// Drop existing test database if it exists
	try {
		await execa(
			'npx',
			['prisma', 'db', 'execute', '--url', pgUrl.toString(), '--stdin'],
			{
				input: `DROP DATABASE IF EXISTS ${dbName};`,
				stdio: 'pipe',
			},
		)
	} catch {
		// Ignore errors if database doesn't exist
	}

	// Create test database
	await execa(
		'npx',
		['prisma', 'db', 'execute', '--url', pgUrl.toString(), '--stdin'],
		{
			input: `CREATE DATABASE ${dbName};`,
			stdio: 'pipe',
		},
	)

	// Run migrations on test database
	await execaCommand('npx prisma migrate deploy', {
		stdio: 'inherit',
		env: {
			...process.env,
			DATABASE_URL: testDatabaseUrl,
		},
	})
}
