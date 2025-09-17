# Epic Stack Feature Implementation Homework

## For Junior Developers

This document contains three focused homework assignments for implementing
critical features in the Epic Stack application. Each developer will be assigned
one feature to research, understand, and implement.

---

## Assignment 1: Email Service Implementation (Resend Integration)

### Current Status

- **PARTIALLY WORKING**: The code structure exists but email sending fails
- **API Key**: Already configured in `.env` (registered with
  joeyhigino@gmail.com)
- **From Address**: Currently hardcoded as `joey.castillo@annexdigitalinc.com`
  in `app/utils/email.server.ts:35`

### Files to Study

1. **`app/utils/email.server.ts`** - Core email sending logic
   - Lines 24-91: Main `sendEmail` function
   - Lines 43-54: Mock fallback when API key missing
   - Lines 56-63: Resend API integration

2. **`app/routes/_auth+/verify.tsx`** - Email verification flow
   - Sends verification codes to users
   - Uses React Email templates

3. **`app/routes/settings+/profile.change-email.tsx`** - Email change
   functionality
   - Triggers email verification

### Specific Issues to Fix

#### Issue 1: Domain Verification

**Problem**: The "from" email address must be verified in Resend

```typescript
// Current hardcoded address at line 35:
const from = 'joey.castillo@annexdigitalinc.com'
```

**Tasks**:

1. Log into Resend dashboard (https://resend.com/domains)
2. Verify if the domain is verified
3. If not, either:
   - Verify the existing domain, OR
   - Change to a verified domain
4. Update the `from` address in `email.server.ts`

#### Issue 2: React Email Template Integration

**Files to check**:

- Look for email templates that should exist but might be missing
- Check if React Email components are properly imported

**Tasks**:

1. Create missing email template components if needed
2. Ensure proper React Email rendering in `renderReactEmail` function (lines
   93-99)

### Testing Instructions

1. Test email verification flow:

   ```bash
   # Start the app
   npm run dev
   # Go to signup page
   # Enter an email address
   # Check if email is received
   ```

2. Test password reset flow:

   ```bash
   # Go to /forgot-password
   # Enter email
   # Check if reset email is received
   ```

3. Test email change flow:
   ```bash
   # Login as existing user
   # Go to /settings/profile/change-email
   # Enter new email
   # Check if verification email is received
   ```

### Debug Checklist

- [ ] Check Resend API key is valid (`RESEND_API_KEY` in `.env`)
- [ ] Verify domain in Resend dashboard
- [ ] Check network requests to `https://api.resend.com/emails`
- [ ] Look for error responses in console
- [ ] Ensure email templates render correctly
- [ ] Test with different email providers (Gmail, Outlook, etc.)

### Success Criteria

- All email flows work without errors
- Emails are received within 30 seconds
- Email templates display correctly
- Error handling provides clear feedback

---

## Assignment 2: GitHub OAuth Implementation

### Current Status

- **NOT WORKING**: OAuth flow exists but not properly configured
- **Mock Mode**: Currently using mock GitHub authentication
- **Environment Variables**: Need proper GitHub OAuth app setup

### Files to Study

1. **`app/utils/providers/github.server.ts`** - GitHub OAuth strategy
   - Lines 44-100: Main authentication strategy
   - Lines 102-132: Connection data resolution
   - Lines 134-157: Mock authentication handler

2. **`app/routes/_auth+/auth.$provider.callback.ts`** - OAuth callback handler
   - Handles OAuth response
   - Creates/links user accounts
   - Manages session creation

3. **`app/routes/_auth+/auth_.$provider.ts`** - OAuth initiation
   - Starts OAuth flow
   - Redirects to GitHub

### Setup Requirements

#### Step 1: Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "Register a new application"
3. Fill in:
   ```
   Application name: Epic Stack Development
   Homepage URL: http://localhost:3000
   Authorization callback URL: http://localhost:3000/auth/github/callback
   ```
4. Save Client ID and Client Secret

#### Step 2: Configure Environment Variables

Update `.env` file:

```bash
# Replace MOCK values with real ones
GITHUB_CLIENT_ID="your_actual_client_id"
GITHUB_CLIENT_SECRET="your_actual_client_secret"
GITHUB_REDIRECT_URI="http://localhost:3000/auth/github/callback"
# Optional: For resolving user data
GITHUB_TOKEN="your_personal_access_token"
```

### Implementation Tasks

#### Task 1: Remove Mock Mode

In `github.server.ts`:

```typescript
// Line 23-25: Currently checks for MOCK_
const shouldMock =
	process.env.GITHUB_CLIENT_ID?.startsWith('MOCK_') ||
	process.env.NODE_ENV === 'test'
```

Ensure this evaluates to `false` in development.

#### Task 2: Fix Authentication Flow

1. Check if GitHubStrategy is properly initialized (lines 55-99)
2. Verify token handling in callback (lines 61-97)
3. Ensure proper error handling

#### Task 3: Connection Management

Study `auth.$provider.callback.ts`:

- Lines 73-81: Check for existing connections
- Lines 85-104: Handle already connected accounts
- Lines 106-135: Create new connections

### Testing Instructions

1. Clear all cookies and sessions
2. Go to `/login`
3. Click "Login with GitHub"
4. Should redirect to GitHub OAuth
5. Authorize the application
6. Should redirect back and complete onboarding

### Debug Checklist

- [ ] GitHub OAuth app created and configured
- [ ] Environment variables set correctly
- [ ] No MOCK\_ prefix in CLIENT_ID
- [ ] Network tab shows redirect to real GitHub
- [ ] Callback URL matches OAuth app settings
- [ ] Session created after successful auth
- [ ] User profile data retrieved correctly

### Common Issues & Solutions

1. **"Invalid client_id"**: OAuth app not configured correctly
2. **Redirect mismatch**: Callback URL doesn't match GitHub app
3. **Network error**: Check if behind proxy/firewall
4. **Session not created**: Check database connection table

### Success Criteria

- GitHub login button works
- User can authorize the app on GitHub
- Profile data (username, avatar) is retrieved
- Connection is saved in database
- User can disconnect/reconnect GitHub account

---

## Assignment 3: Passkeys/WebAuthn Implementation

### Current Status

- **PARTIALLY IMPLEMENTED**: UI exists but core WebAuthn logic incomplete
- **Database Ready**: Passkey table exists in schema
- **Routes Created**: Management UI at `/settings/profile/passkeys`

### Files to Study

1. **`app/routes/settings+/profile.passkeys.tsx`** - Passkey management UI
   - Lines 16-28: List existing passkeys
   - Lines 30-57: Delete passkey action
   - Lines 98-100+: Registration handler (incomplete)

2. **`app/routes/_auth+/webauthn+/registration.ts`** - WebAuthn registration
   endpoint
   - Generates registration options
   - Verifies registration response
   - Stores credential in database

3. **`app/routes/_auth+/webauthn+/authentication.ts`** - WebAuthn authentication
   - Generates authentication options
   - Verifies authentication response
   - Creates session

4. **`app/routes/_auth+/webauthn+/utils.server.ts`** - WebAuthn utilities
   - Shared functions for WebAuthn operations

### Implementation Requirements

#### Step 1: Install Dependencies

```bash
npm install @simplewebauthn/server @simplewebauthn/browser
```

#### Step 2: Complete Registration Flow

**In `webauthn+/registration.ts`**, implement:

```typescript
import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
} from '@simplewebauthn/server'

// Generate registration options
export async function action({ request }: Route.ActionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { passkeys: true },
	})

	const options = await generateRegistrationOptions({
		rpName: 'Epic Stack',
		rpID: 'localhost',
		userID: userId,
		userName: user.username,
		userDisplayName: user.name ?? user.username,
		// Exclude existing credentials
		excludeCredentials: user.passkeys.map((key) => ({
			id: key.credentialId,
			type: 'public-key',
		})),
	})

	// Store challenge in session
	// Return options to client
}
```

#### Step 3: Complete Authentication Flow

**In `webauthn+/authentication.ts`**, implement:

```typescript
import {
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
} from '@simplewebauthn/server'

// Generate authentication options
// Verify authentication response
// Create user session
```

#### Step 4: Update Client-Side Handler

**In `profile.passkeys.tsx`** (lines 98+):

```typescript
async function handlePasskeyRegistration() {
	try {
		// 1. Get registration options from server
		const optionsResponse = await fetch('/auth/webauthn/registration', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ intent: 'options' }),
		})
		const { options } = await optionsResponse.json()

		// 2. Create credential using browser API
		const credential = await startRegistration(options)

		// 3. Send credential to server for verification
		const verifyResponse = await fetch('/auth/webauthn/registration', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				intent: 'verify',
				credential,
			}),
		})

		// 4. Handle response
		if (verifyResponse.ok) {
			revalidator.revalidate()
		}
	} catch (error) {
		setError(error.message)
	}
}
```

### Database Schema

The passkey table already exists:

```prisma
model Passkey {
  id            String   @id @default(cuid())
  credentialId  String   @unique
  publicKey     String
  counter       BigInt
  deviceType    String
  credentialBackedUp Boolean
  transports    String[]
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId        String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Testing Instructions

#### Registration Test:

1. Login as any user
2. Go to `/settings/profile/passkeys`
3. Click "Add Passkey"
4. Follow browser prompts (fingerprint/face/PIN)
5. Verify passkey appears in list

#### Authentication Test:

1. Logout
2. Go to login page
3. Click "Sign in with Passkey"
4. Select passkey
5. Authenticate with biometric/PIN
6. Verify login successful

### Browser Compatibility

Test on:

- Chrome/Edge (full support)
- Safari (iOS/macOS)
- Firefox (limited support)

### Debug Checklist

- [ ] SimpleWebAuthn packages installed
- [ ] Registration options generated correctly
- [ ] Challenge stored in session
- [ ] Browser supports WebAuthn API
- [ ] Credential created successfully
- [ ] Public key stored in database
- [ ] Authentication challenge verified
- [ ] Session created after authentication

### Security Considerations

1. **RP ID**: Must match domain (localhost for dev)
2. **Challenge**: Must be unique per request
3. **Origin verification**: Check origin in verification
4. **Counter validation**: Prevent replay attacks

### Success Criteria

- User can register a passkey
- Passkey appears in management UI
- User can delete passkeys
- User can login with passkey
- Works on multiple browsers/devices
- Proper error messages shown

---

## General Development Tips

### Environment Setup

1. Ensure PostgreSQL is running
2. Run migrations: `npx prisma migrate dev`
3. Seed database: `npx prisma db seed`
4. Start dev server: `npm run dev`

### Debugging Tools

- Browser DevTools Network tab
- Prisma Studio: `npx prisma studio`
- Console logs in server-side code
- React DevTools for client components

### Testing Approach

1. Start with manual testing
2. Use existing test patterns in codebase
3. Write E2E tests with Playwright
4. Unit test critical functions

### Getting Help

- Check existing similar implementations in codebase
- Review Epic Stack documentation
- Look for TODO comments in code
- Test error scenarios thoroughly

### Submission Requirements

1. Feature working end-to-end
2. Error handling implemented
3. Tests written (unit and/or E2E)
4. Documentation updated
5. Code follows existing patterns

---

## Timeline

- **Day 1-2**: Study existing code and documentation
- **Day 3-4**: Implement core functionality
- **Day 5**: Testing and error handling
- **Day 6**: Documentation and cleanup
- **Day 7**: Demo and code review

Each developer should create a branch for their feature:

- `feature/email-resend-fix`
- `feature/github-oauth-implementation`
- `feature/passkeys-completion`

Good luck! Focus on understanding the existing patterns before making changes.
