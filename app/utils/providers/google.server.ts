import { SetCookie } from '@mjackson/headers'
import { createId as cuid } from '@paralleldrive/cuid2'
import { redirect } from 'react-router'
import { Strategy } from 'remix-auth/strategy'
import { z } from 'zod'
import { cache, cachified } from '../cache.server.ts'
import { type Timings } from '../timing.server.ts'
import { MOCK_CODE_GOOGLE_HEADER, MOCK_CODE_GOOGLE } from './constants.ts'
import { type AuthProvider } from './provider.ts'

const GoogleUserSchema = z.object({
	id: z.string(),
	email: z.string(),
	verified_email: z.boolean(),
	name: z.string().optional(),
	given_name: z.string().optional(),
	family_name: z.string().optional(),
	picture: z.string().optional(),
	locale: z.string().optional(),
})

const GoogleUserParseResult = z
	.object({
		success: z.literal(true),
		data: GoogleUserSchema,
	})
	.or(
		z.object({
			success: z.literal(false),
		}),
	)

const shouldMock =
	process.env.GOOGLE_CLIENT_ID?.startsWith('MOCK_') ||
	process.env.NODE_ENV === 'test'

// Custom Google OAuth2 Strategy
class GoogleOAuth2Strategy extends Strategy<
	{ accessToken: string },
	{
		id: string
		email: string
		name?: string
		username: string
		imageUrl?: string
	}
> {
	name = 'google'
	private clientId: string
	private clientSecret: string
	private redirectURI: string

	constructor(
		options: {
			clientId: string
			clientSecret: string
			redirectURI: string
		},
		verify: (params: { accessToken: string }) => Promise<{
			id: string
			email: string
			name?: string
			username: string
			imageUrl?: string
		}>,
	) {
		super(verify)
		this.clientId = options.clientId
		this.clientSecret = options.clientSecret
		this.redirectURI = options.redirectURI
	}

	async authenticate(request: Request) {
		const url = new URL(request.url)
		const code = url.searchParams.get('code')
		const state = url.searchParams.get('state')

		// If we have a code, exchange it for an access token
		if (code) {
			const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					code,
					client_id: this.clientId,
					client_secret: this.clientSecret,
					redirect_uri: this.redirectURI,
					grant_type: 'authorization_code',
				}),
			})

			if (!tokenResponse.ok) {
				throw new Error('Failed to exchange code for token')
			}

			const tokens = await tokenResponse.json()
			return this.verify({ accessToken: tokens.access_token })
		}

		// Otherwise, redirect to Google for authorization
		const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
		authUrl.searchParams.set('client_id', this.clientId)
		authUrl.searchParams.set('redirect_uri', this.redirectURI)
		authUrl.searchParams.set('response_type', 'code')
		authUrl.searchParams.set('scope', 'openid email profile')
		authUrl.searchParams.set('state', state || cuid())
		authUrl.searchParams.set('access_type', 'online')
		authUrl.searchParams.set('prompt', 'select_account')

		throw redirect(authUrl.toString())
	}
}

export class GoogleProvider implements AuthProvider {
	getAuthStrategy() {
		if (
			!process.env.GOOGLE_CLIENT_ID ||
			!process.env.GOOGLE_CLIENT_SECRET ||
			!process.env.GOOGLE_REDIRECT_URI
		) {
			console.log(
				'Google OAuth strategy not available because environment variables are not set',
			)
			return null
		}
		return new GoogleOAuth2Strategy(
			{
				clientId: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				redirectURI: process.env.GOOGLE_REDIRECT_URI,
			},
			async ({ accessToken }) => {
				// Fetch user info from Google
				const userResponse = await fetch(
					'https://www.googleapis.com/oauth2/v2/userinfo',
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					},
				)
				const rawUser = await userResponse.json()
				const user = GoogleUserSchema.parse(rawUser)

				if (!user.verified_email) {
					throw new Error('Email not verified')
				}

				return {
					id: user.id,
					email: user.email,
					name: user.name,
					username: user.email.split('@')[0], // Use email prefix as username
					imageUrl: user.picture,
				}
			},
		)
	}

	async resolveConnectionData(
		providerId: string,
		{ timings }: { timings?: Timings } = {},
	) {
		const result = await cachified({
			key: `connection-data:google:${providerId}`,
			cache,
			timings,
			ttl: 1000 * 60,
			swr: 1000 * 60 * 60 * 24 * 7,
			async getFreshValue(context) {
				// For Google, we'll need an access token to fetch user data
				// Since we don't store tokens, we'll return basic info
				// In a real implementation, you might want to store refresh tokens
				const mockData = {
					success: true,
					data: {
						id: providerId,
						email: `user-${providerId}@gmail.com`,
						name: 'Google User',
					},
				}
				return GoogleUserParseResult.parse(mockData)
			},
			checkValue: GoogleUserParseResult,
		})
		return {
			displayName: result.success
				? result.data.name || result.data.email
				: 'Unknown',
			link: null, // Google doesn't have public profile URLs like GitHub
		} as const
	}

	async handleMockAction(request: Request) {
		if (!shouldMock) return

		const state = cuid()
		// allows us to inject a code when running e2e tests,
		// but falls back to a pre-defined constant
		const code =
			request.headers.get(MOCK_CODE_GOOGLE_HEADER) || MOCK_CODE_GOOGLE
		const searchParams = new URLSearchParams({ code, state })
		let cookie = new SetCookie({
			name: 'google-oauth',
			value: searchParams.toString(),
			path: '/',
			sameSite: 'Lax',
			httpOnly: true,
			maxAge: 60 * 10,
			secure: process.env.NODE_ENV === 'production' || undefined,
		})
		throw redirect(`/auth/google/callback?${searchParams}`, {
			headers: {
				'Set-Cookie': cookie.toString(),
			},
		})
	}
}
