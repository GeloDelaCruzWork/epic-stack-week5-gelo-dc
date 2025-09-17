# Passkeys Implementation Guide for Epic Stack

## Table of Contents

1. [What Are Passkeys?](#what-are-passkeys)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [Implementation Details](#implementation-details)
5. [User Guide](#user-guide)
6. [Developer Guide](#developer-guide)
7. [Testing Passkeys](#testing-passkeys)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)

## What Are Passkeys?

Passkeys are a modern, passwordless authentication method based on the WebAuthn
standard. They provide:

- **Phishing resistance**: Cannot be used on fake websites
- **No passwords to remember**: Uses cryptographic keys instead
- **Biometric support**: Can use fingerprint, face recognition, or device PIN
- **Cross-device sync**: Some passkeys can sync across devices via password
  managers
- **Strong security**: Based on public-key cryptography

## Architecture Overview

The Epic Stack implements passkeys using:

- **@simplewebauthn/browser**: Client-side WebAuthn API wrapper
- **@simplewebauthn/server**: Server-side verification and challenge generation
- **PostgreSQL**: Stores passkey credentials via Prisma ORM
- **React Router**: Handles authentication flows and session management

### Key Components

```
app/
├── routes/
│   ├── _auth+/
│   │   ├── webauthn+/
│   │   │   ├── registration.ts    # Passkey registration endpoint
│   │   │   ├── authentication.ts  # Passkey login endpoint
│   │   │   └── utils.server.ts    # WebAuthn configuration utilities
│   │   └── login.tsx              # Login page with passkey option
│   └── settings+/
│       └── profile.passkeys.tsx   # Passkey management page
└── prisma/
    └── schema.prisma              # Passkey database model
```

## Database Schema

The `Passkey` model in Prisma stores all necessary WebAuthn credential data:

```prisma
model Passkey {
  id             String   @id                    # Credential ID (base64url encoded)
  aaguid         String                          # Authenticator AAGUID
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  publicKey      Bytes                           # Public key for verification
  user           User     @relation(...)         # Linked user
  userId         String                          # User foreign key
  webauthnUserId String                          # WebAuthn user handle
  counter        BigInt                          # Signature counter (replay protection)
  deviceType     String                          # 'singleDevice' or 'multiDevice'
  backedUp       Boolean                         # Is credential backed up?
  transports     String?                         # Transport methods (CSV)
}
```

## Implementation Details

### 1. Registration Flow

**Client-side (`profile.passkeys.tsx`):**

```typescript
// User clicks "Register new passkey"
const resp = await fetch('/webauthn/registration')
const { options } = await resp.json()

// Browser prompts user to create credential
const regResult = await startRegistration({ optionsJSON: options })

// Send credential to server for verification
const verificationResp = await fetch('/webauthn/registration', {
	method: 'POST',
	body: JSON.stringify(regResult),
})
```

**Server-side (`registration.ts`):**

```typescript
// GET: Generate registration options
const options = await generateRegistrationOptions({
  rpName: hostname,
  rpID: hostname,
  userName: user.username,
  userID: userId,
  authenticatorSelection: {
    residentKey: 'preferred',
    userVerification: 'preferred',
  },
})

// POST: Verify and store credential
const verification = await verifyRegistrationResponse({
  response: registrationData,
  expectedChallenge: challenge,
  expectedOrigin: origin,
  expectedRPID: rpID,
})

await prisma.passkey.create({ ... })
```

### 2. Authentication Flow

**Client-side (`login.tsx`):**

```typescript
// User clicks "Login with a passkey"
const resp = await fetch('/webauthn/authentication')
const { options } = await resp.json()

// Browser prompts user to authenticate
const authResponse = await startAuthentication({ optionsJSON: options })

// Send authentication response to server
const verificationResp = await fetch('/webauthn/authentication', {
	method: 'POST',
	body: JSON.stringify({ authResponse, remember, redirectTo }),
})
```

**Server-side (`authentication.ts`):**

```typescript
// GET: Generate authentication options
const options = await generateAuthenticationOptions({
  rpID: hostname,
  userVerification: 'preferred',
})

// POST: Verify authentication and create session
const verification = await verifyAuthenticationResponse({
  response: authResponse,
  expectedChallenge: challenge,
  credential: {
    id: authResponse.id,
    publicKey: passkey.publicKey,
    counter: passkey.counter,
  },
})

// Update counter and create session
await prisma.passkey.update({ counter: newCounter })
const session = await prisma.session.create({ ... })
```

## User Guide

### Setting Up a Passkey (First Time)

1. **Login** to your account using your username/password
2. Navigate to **Settings → Profile → Passkeys** (`/settings/profile/passkeys`)
3. Click **"Register new passkey"**
4. Follow your browser/device prompt:
   - **Windows Hello**: Use fingerprint, face, or PIN
   - **Touch ID/Face ID**: Use biometric on Mac/iOS
   - **Security Key**: Insert and tap your hardware key
   - **Password Manager**: Save to 1Password, Bitwarden, etc.
5. Your passkey is now registered and appears in the list

### Using a Passkey to Login

1. Go to the **Login page** (`/login`)
2. Click **"Login with a passkey"** button
3. Select your passkey from the browser prompt
4. Authenticate using your chosen method (biometric, PIN, etc.)
5. You're logged in! No password needed.

### Managing Passkeys

- **View all passkeys**: Settings → Profile → Passkeys
- **Delete a passkey**: Click "Delete" next to the passkey
- **Multiple passkeys**: Register different passkeys for different devices
- **Backup passkeys**: Some passkeys sync across devices automatically

## Developer Guide

### Adding Passkey Support to New Routes

1. **Import WebAuthn utilities:**

```typescript
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
```

2. **Check for WebAuthn support:**

```typescript
if (!navigator.credentials || !window.PublicKeyCredential) {
	// WebAuthn not supported
	return
}
```

3. **Use existing endpoints:**

- Registration: `GET/POST /webauthn/registration`
- Authentication: `GET/POST /webauthn/authentication`

### Configuration

WebAuthn configuration is handled in `utils.server.ts`:

```typescript
export function getWebAuthnConfig(request: Request) {
	const url = new URL(getDomainUrl(request))
	return {
		rpName: url.hostname, // Relying Party name
		rpID: url.hostname, // Must match origin domain
		origin: url.origin, // Full origin URL
	}
}
```

### Session Management

Passkey authentication creates standard Epic Stack sessions:

- Session cookies follow existing auth patterns
- "Remember me" option available
- Sessions expire based on `getSessionExpirationDate()`

## Testing Passkeys

### Manual Testing

1. **Browser DevTools**: Chrome/Edge have WebAuthn debugging tools
2. **Virtual Authenticator**: Create test credentials without hardware

### Automated Testing (Playwright)

The project includes E2E tests in `tests/e2e/passkey.test.ts`:

```typescript
// Setup virtual authenticator
const client = await page.context().newCDPSession(page)
await client.send('WebAuthn.enable')
await client.send('WebAuthn.addVirtualAuthenticator', {
	options: {
		protocol: 'ctap2',
		hasResidentKey: true,
		hasUserVerification: true,
		isUserVerified: true,
	},
})

// Test registration and authentication flows
```

Run passkey tests:

```bash
npm run test:e2e:run -- passkey
```

## Security Considerations

### Challenge Management

- Challenges are stored in secure HTTP-only cookies
- Challenges expire after 2 hours
- Each challenge is single-use

### Credential Verification

- Public keys stored in database for verification
- Signature counter prevents replay attacks
- User verification required for high-security operations

### Best Practices

1. **Always verify origin**: Prevents cross-origin attacks
2. **Check RP ID**: Must match your domain
3. **Update counters**: Detect cloned authenticators
4. **Secure transport**: HTTPS required in production
5. **Rate limiting**: Prevent brute force attempts

## Troubleshooting

### Common Issues

**"WebAuthn not supported"**

- Browser doesn't support WebAuthn (use modern Chrome, Edge, Safari, Firefox)
- Site not served over HTTPS (localhost is exception)

**"No available authenticator"**

- No compatible authenticator found
- Try different authenticator type (platform vs cross-platform)

**"Registration failed"**

- Credential already registered (check for duplicates)
- User cancelled the operation
- Timeout occurred (retry the operation)

**"Authentication failed"**

- Wrong passkey selected
- Authenticator not recognized
- Counter mismatch (possible cloned key)

### Debug Information

Enable debug logging:

```typescript
console.log('Registration options:', options)
console.log('Registration result:', regResult)
console.log('Verification response:', verificationResp)
```

Check database:

```bash
npx prisma studio
# Navigate to Passkey table
```

### Browser Compatibility

| Browser | Minimum Version | Notes                                  |
| ------- | --------------- | -------------------------------------- |
| Chrome  | 67+             | Full support                           |
| Edge    | 18+             | Full support                           |
| Safari  | 14+             | Platform authenticators only initially |
| Firefox | 60+             | May need to enable in settings         |

## Advanced Topics

### Conditional UI

Future enhancement: Show passkey button only if user has registered passkeys:

```typescript
const hasPasskeys = await PublicKeyCredential.isConditionalMediationAvailable()
```

### Backup Eligibility

Check if passkey can be backed up:

```typescript
if (passkey.backedUp) {
	// Passkey is synced across devices
}
```

### Transport Hints

Optimize UX by specifying transport methods:

```typescript
const transports = passkey.transports?.split(',')
// ['internal', 'hybrid', 'usb', etc.]
```

## Resources

- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [SimpleWebAuthn Documentation](https://simplewebauthn.dev/)
- [Passkeys.dev](https://passkeys.dev/)
- [MDN WebAuthn API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [FIDO Alliance](https://fidoalliance.org/)

## Summary

Passkeys in the Epic Stack provide a secure, user-friendly authentication method
that eliminates passwords while maintaining high security standards. The
implementation leverages industry-standard WebAuthn protocols and integrates
seamlessly with the existing authentication system.

Key benefits for your application:

- Enhanced security with phishing resistance
- Improved user experience with biometric authentication
- Reduced password reset requests
- Future-proof authentication strategy
- Cross-platform compatibility
