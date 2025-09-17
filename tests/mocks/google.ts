import { faker } from '@faker-js/faker'
import { http } from 'msw'
import { MOCK_CODE_GOOGLE } from '#app/utils/providers/constants.ts'

const passthroughGoogle =
	!process.env.GOOGLE_CLIENT_ID?.startsWith('MOCK_') &&
	process.env.NODE_ENV !== 'test'

export const handlers = [
	http.post('https://oauth2.googleapis.com/token', async ({ request }) => {
		if (passthroughGoogle) return

		const body = await request.text().then((text) => new URLSearchParams(text))
		const code = body.get('code')
		const isCodeValid = code === MOCK_CODE_GOOGLE

		if (isCodeValid) {
			return new Response(
				JSON.stringify({
					access_token: faker.string.uuid(),
					token_type: 'Bearer',
					expires_in: 3600,
					scope: 'openid email profile',
					refresh_token: faker.string.uuid(),
				}),
				{
					headers: {
						'Content-Type': 'application/json',
					},
				},
			)
		} else {
			return new Response(
				JSON.stringify({
					error: 'invalid_grant',
					error_description: 'Invalid authorization code',
				}),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			)
		}
	}),
	http.get(
		'https://www.googleapis.com/oauth2/v2/userinfo',
		async ({ request }) => {
			if (passthroughGoogle) return

			const authHeader = request.headers.get('Authorization')
			const isAuthorized = authHeader?.startsWith('Bearer ')

			if (isAuthorized) {
				return new Response(
					JSON.stringify({
						id: faker.string.numeric(21),
						email: 'kody@epicstack.dev',
						verified_email: true,
						name: 'Kody Koala',
						given_name: 'Kody',
						family_name: 'Koala',
						picture: 'https://lh3.googleusercontent.com/a/fake-picture-url',
						locale: 'en',
					}),
					{
						headers: {
							'Content-Type': 'application/json',
						},
					},
				)
			} else {
				return new Response(
					JSON.stringify({
						error: {
							code: 401,
							message: 'Invalid Credentials',
							status: 'UNAUTHENTICATED',
						},
					}),
					{
						status: 401,
						headers: {
							'Content-Type': 'application/json',
						},
					},
				)
			}
		},
	),
]
