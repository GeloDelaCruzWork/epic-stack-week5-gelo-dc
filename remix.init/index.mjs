import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { $ } from 'execa'
import inquirer from 'inquirer'

const escapeRegExp = (string) =>
	// $& means the whole matched string
	string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getRandomString = (length) => crypto.randomBytes(length).toString('hex')

async function getEpicStackVersion() {
	const response = await fetch(
		'https://api.github.com/repos/epicweb-dev/epic-stack/commits/main',
	)
	if (!response.ok) {
		throw new Error(
			`Failed to fetch Epic Stack version: ${response.status} ${response.statusText}`,
		)
	}
	const data = await response.json()
	return {
		head: data.sha,
		date: data.commit.author.date,
	}
}

export default async function main({ rootDirectory }) {
	const EXAMPLE_ENV_PATH = path.join(rootDirectory, '.env.example')
	const ENV_PATH = path.join(rootDirectory, '.env')
	const PKG_PATH = path.join(rootDirectory, 'package.json')

	const appNameRegex = escapeRegExp('epic-stack-template')

	const DIR_NAME = path.basename(rootDirectory)
	const SUFFIX = getRandomString(2)

	const APP_NAME = (DIR_NAME + '-' + SUFFIX)
		// get rid of anything that's not allowed in an app name
		.replace(/[^a-zA-Z0-9-_]/g, '-')
		.toLowerCase()

	const [env, packageJsonString] = await Promise.all([
		fs.readFile(EXAMPLE_ENV_PATH, 'utf-8'),
		fs.readFile(PKG_PATH, 'utf-8'),
	])

	const newEnv = env
		.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET="${getRandomString(16)}"`)
		.replace(
			/^HONEYPOT_SECRET=.*$/m,
			`HONEYPOT_SECRET="${getRandomString(16)}"`,
		)
		.replace(
			/^INTERNAL_COMMAND_TOKEN=.*$/m,
			`INTERNAL_COMMAND_TOKEN="${getRandomString(16)}"`,
		)

	const packageJson = JSON.parse(packageJsonString)

	packageJson.name = APP_NAME
	delete packageJson.author
	delete packageJson.license

	// Add Epic Stack version information
	try {
		const epicStackVersion = await getEpicStackVersion()
		packageJson['epic-stack'] = epicStackVersion
	} catch (error) {
		console.warn(
			'Failed to fetch Epic Stack version information. The package.json will not include version details.',
			error,
		)
	}

	const fileOperationPromises = [
		fs.writeFile(ENV_PATH, newEnv),
		fs.writeFile(PKG_PATH, JSON.stringify(packageJson, null, 2) + '\n'),
		fs.copyFile(
			path.join(rootDirectory, 'remix.init', 'gitignore'),
			path.join(rootDirectory, '.gitignore'),
		),
		fs.rm(path.join(rootDirectory, 'LICENSE.md')),
		fs.rm(path.join(rootDirectory, 'CONTRIBUTING.md')),
		fs.rm(path.join(rootDirectory, 'docs'), { recursive: true }),
		fs.rm(path.join(rootDirectory, 'tests/e2e/notes.test.ts')),
		fs.rm(path.join(rootDirectory, 'tests/e2e/search.test.ts')),
	]

	await Promise.all(fileOperationPromises)

	if (!process.env.SKIP_SETUP) {
		execSync('npm run setup', { cwd: rootDirectory, stdio: 'inherit' })
	}

	if (!process.env.SKIP_FORMAT) {
		execSync('npm run format -- --log-level warn', {
			cwd: rootDirectory,
			stdio: 'inherit',
		})
	}

	if (!process.env.SKIP_DEPLOYMENT) {
		await setupDeployment({ rootDirectory }).catch((error) => {
			console.error(error)

			console.error(
				`Looks like something went wrong setting up deployment. Check the deployment documentation for manual setup instructions.`,
			)
		})
	}

	console.log(
		`
Setup is complete. You're now ready to rock and roll 🐨

What's next?

- Start development with \`npm run dev\`
- Run tests with \`npm run test\` and \`npm run test:e2e\`
		`.trim(),
	)
}

async function setupDeployment({ rootDirectory }) {
	const { shouldSetupDeployment } = await inquirer.prompt([
		{
			name: 'shouldSetupDeployment',
			type: 'confirm',
			default: false,
			message: 'Would you like to set up deployment configuration?',
		},
	])

	if (!shouldSetupDeployment) {
		console.log(
			`No problem! You can set up deployment later by configuring your environment variables and Docker setup.`,
		)
		return
	}

	console.log(`
The Epic Stack is configured to use PostgreSQL and can be deployed to any platform that supports Docker containers.

Key environment variables you'll need to configure for production:
- DATABASE_URL: PostgreSQL connection string
- SESSION_SECRET: Session encryption key (already generated in .env)
- HONEYPOT_SECRET: Form protection secret (already generated in .env)
- RESEND_API_KEY: Email service API key (if using email features)

For S3-compatible object storage:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- AWS_ENDPOINT_URL_S3
- BUCKET_NAME

Check the deployment documentation in your project for detailed instructions.
	`)

	const { shouldSetupGitHub } = await inquirer.prompt([
		{
			name: 'shouldSetupGitHub',
			type: 'confirm',
			default: true,
			message: 'Would you like to initialize a git repository?',
		},
	])

	if (shouldSetupGitHub) {
		const $I = $({ stdio: 'inherit', cwd: rootDirectory })

		console.log(`⛓ Initializing git repo...`)
		// it's possible there's already a git repo initialized so we'll just ignore
		// any errors and hope things work out.
		await $I`git init`.catch(() => {})
		await $I`git add .`.catch(() => {})
		await $I`git commit -m "Initial commit from Epic Stack"`.catch(() => {})

		console.log(`
Git repository initialized! 

You can now:
1. Create a new repository on GitHub, GitLab, or your preferred git host
2. Add the remote: git remote add origin <your-repo-url>
3. Push your code: git push -u origin main
		`)
	}

	console.log('All done 🎉 Happy building!')
}
