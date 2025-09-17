# Two-Factor Authentication (2FA) Implementation Guide for Epic Stack

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Implementation Details](#implementation-details)
5. [User Guide](#user-guide)
6. [Developer Guide](#developer-guide)
7. [Security Features](#security-features)
8. [Testing 2FA](#testing-2fa)
9. [Troubleshooting](#troubleshooting)

## Overview

The Epic Stack implements Time-based One-Time Password (TOTP) two-factor
authentication using industry standards:

- **TOTP Algorithm**: RFC 6238 compliant time-based codes
- **@epic-web/totp**: Server-side TOTP generation and verification
- **QR Code Integration**: Easy setup with authenticator apps
- **Flexible Verification System**: Used for 2FA, password resets, email
  changes, and onboarding

### Benefits of 2FA

- **Enhanced Security**: Requires something you know (password) + something you
  have (authenticator)
- **Phishing Protection**: Time-based codes expire quickly (30 seconds)
- **Account Recovery Protection**: Prevents unauthorized account changes
- **Compliance**: Meets security requirements for sensitive applications

## Architecture

### Key Components

```
app/
├── routes/
│   ├── _auth+/
│   │   ├── verify.tsx              # Verification page for all code types
│   │   ├── verify.server.ts        # Code validation and verification logic
│   │   └── login.server.ts         # 2FA enforcement during login
│   └── settings+/
│       └── profile.two-factor+/
│           ├── index.tsx            # 2FA status and enable button
│           ├── verify.tsx           # QR code setup and verification
│           └── disable.tsx          # Disable 2FA (requires reverification)
├── utils/
│   └── totp.server.ts              # TOTP utilities wrapper
└── prisma/
    └── schema.prisma                # Verification table
```

## Database Schema

The `Verification` table stores both permanent 2FA secrets and temporary
verification codes:

```prisma
model Verification {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  type      String   # '2fa', '2fa-verify', 'reset-password', 'onboarding', etc.
  target    String   # Usually userId or email

  // TOTP Configuration
  secret    String   # Base32 encoded secret key
  algorithm String   # 'SHA-256' for security
  digits    Int      # 6 digits for standard TOTP
  period    Int      # 30 seconds for standard TOTP
  charSet   String   # Character set for codes

  expiresAt DateTime? # Null for permanent 2FA, set for temporary codes

  @@unique([target, type])
}
```

### Verification Types

- `'2fa'`: Permanent 2FA secret (never expires)
- `'2fa-verify'`: Temporary secret during setup
- `'reset-password'`: Password reset verification
- `'onboarding'`: Email verification during signup
- `'change-email'`: Email change verification

## Implementation Details

### 1. Enabling 2FA

**Step 1: Generate TOTP Secret** (`profile.two-factor.index.tsx`)

```typescript
// User clicks "Enable 2FA"
const { otp: _otp, ...config } = await generateTOTP()
await prisma.verification.upsert({
	where: { target_type: { target: userId, type: '2fa-verify' } },
	create: { ...config, type: '2fa-verify', target: userId },
	update: { ...config },
})
// Redirect to verification page
```

**Step 2: Display QR Code** (`profile.two-factor.verify.tsx`)

```typescript
// Generate QR code for authenticator app
const otpUri = getTOTPAuthUri({
	...verification,
	accountName: user.email,
	issuer: hostname,
})
const qrCode = await QRCode.toDataURL(otpUri)
```

**Step 3: Verify First Code**

```typescript
// User enters code from authenticator
const codeIsValid = await isCodeValid({
	code: data.code,
	type: '2fa-verify',
	target: userId,
})

// If valid, convert temporary to permanent
await prisma.verification.update({
	where: { target_type: { type: '2fa-verify', target: userId } },
	data: { type: '2fa' }, // Changes to permanent 2FA
})
```

### 2. Login with 2FA

**Normal Login Flow:**

1. User enters username/password
2. System checks if user has 2FA enabled
3. If 2FA enabled, creates unverified session
4. Redirects to verification page
5. User enters TOTP code
6. System verifies code and completes login

**Code Verification:**

```typescript
// Check if code matches current TOTP
const result = await verifyTOTP({
	otp: code,
	secret: verification.secret,
	algorithm: verification.algorithm,
	period: verification.period,
})
```

### 3. Reverification for Sensitive Actions

**Triggered for:**

- Disabling 2FA
- Changing email
- Other sensitive account changes

```typescript
export async function requireRecentVerification(request: Request) {
	const shouldReverify = await shouldRequestTwoFA(request)
	if (shouldReverify) {
		// Redirect to verification page
		throw redirectWithToast('/verify?type=2fa&target={userId}', {
			title: 'Please Reverify',
			description: 'Please reverify your account before proceeding',
		})
	}
}
```

**Reverification Rules:**

- Required if more than 2 hours since last verification
- Stored in auth session as `verifiedTimeKey`
- Automatic redirect with return URL

## User Guide

### Setting Up 2FA

1. **Navigate to 2FA Settings**
   - Login to your account
   - Go to Settings → Profile → Two-Factor (`/settings/profile/two-factor`)

2. **Enable 2FA**
   - Click "Enable 2FA" button
   - You'll be redirected to the setup page

3. **Scan QR Code**
   - Open your authenticator app:
     - Google Authenticator
     - Microsoft Authenticator
     - 1Password
     - Authy
     - Bitwarden
   - Scan the displayed QR code
   - Can't scan? Manually enter the text code shown

4. **Verify Setup**
   - Enter the 6-digit code from your authenticator
   - Click "Submit"
   - 2FA is now active!

### Using 2FA to Login

1. **Enter Credentials**
   - Username and password as normal

2. **Enter 2FA Code**
   - You'll be redirected to verification page
   - Open authenticator app
   - Enter current 6-digit code
   - Code refreshes every 30 seconds

3. **Complete Login**
   - Successfully logged in with 2FA

### Disabling 2FA

1. **Navigate to Settings**
   - Settings → Profile → Two-Factor

2. **Click "Disable 2FA"**
   - You'll need to reverify (enter current 2FA code)

3. **Confirm Disabling**
   - Click "Disable 2FA" button
   - Confirm "Are you sure?"
   - 2FA is now disabled

### Important Security Notes

- **Backup Codes**: Not currently implemented - keep authenticator app backed up
- **Lost Authenticator**: Contact admin for account recovery
- **Multiple Devices**: Add same QR code to multiple authenticator apps for
  backup
- **Time Sync**: Ensure device time is accurate (codes are time-based)

## Developer Guide

### Adding 2FA Check to Routes

```typescript
import { requireRecentVerification } from '#app/routes/_auth+/verify.server.ts'

export async function loader({ request }: Route.LoaderArgs) {
	// Requires 2FA verification within last 2 hours
	await requireRecentVerification(request)

	// Your protected logic here
}
```

### Generating Custom TOTP Codes

```typescript
import { generateTOTP, verifyTOTP } from '#app/utils/totp.server.ts'

// Generate new TOTP configuration
const { otp, secret, algorithm, digits, period } = await generateTOTP({
	algorithm: 'SHA-256',
	digits: 6,
	period: 30, // seconds
})

// Verify a code
const isValid = await verifyTOTP({
	otp: userInput,
	secret,
	algorithm,
	period,
})
```

### Custom Verification Types

```typescript
// Create custom verification type
const customVerificationType = 'custom-action'

// Store verification
await prisma.verification.create({
	data: {
		type: customVerificationType,
		target: userId,
		...totpConfig,
		expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
	},
})

// Validate code
const isValid = await isCodeValid({
	code: userCode,
	type: customVerificationType,
	target: userId,
})
```

### Session Management with 2FA

```typescript
// Check if user needs 2FA
const needs2FA = await shouldRequestTwoFA(request)

// Mark session as verified
authSession.set(verifiedTimeKey, Date.now())

// Check verification age
const verifiedTime = authSession.get(verifiedTimeKey)
const twoHoursAgo = Date.now() - 1000 * 60 * 60 * 2
const needsReverification = !verifiedTime || verifiedTime < twoHoursAgo
```

## Security Features

### TOTP Configuration

- **Algorithm**: SHA-256 (more secure than SHA-1)
- **Period**: 30 seconds (industry standard)
- **Digits**: 6 digits (balance of security and usability)
- **Character Set**: Custom alphanumeric (avoiding confusing characters)

### Protection Mechanisms

1. **Time Window Tolerance**
   - Accepts current code ±1 time period
   - Prevents issues with slight time drift

2. **Rate Limiting**
   - Honeypot protection on forms
   - Session-based verification tracking

3. **Secure Storage**
   - Secrets stored encrypted in database
   - Never exposed to client-side code

4. **Session Security**
   - Unverified sessions for 2FA flow
   - Verified time tracking for reverification
   - Secure cookie storage

### Best Practices

1. **Always Use HTTPS**: Required for secure cookie transmission
2. **Time Synchronization**: Ensure server time is accurate
3. **Backup Access**: Consider implementing backup codes
4. **User Education**: Inform users about authenticator app backups
5. **Audit Logging**: Log 2FA events for security monitoring

## Testing 2FA

### Manual Testing

1. **Setup Test Account**

   ```bash
   npm run dev
   # Create account and enable 2FA
   ```

2. **Test with Authenticator**
   - Use real authenticator app for integration testing
   - Google Authenticator for mobile testing
   - Browser extensions for desktop testing

3. **Test Scenarios**
   - Enable/disable 2FA
   - Login with 2FA
   - Reverification for sensitive actions
   - Expired codes (wait 30+ seconds)
   - Wrong codes

### Automated Testing

```typescript
// Generate test TOTP
import { generateTOTP, verifyTOTP } from '#app/utils/totp.server.ts'

test('2FA verification', async () => {
	const { otp, ...config } = await generateTOTP()

	// Immediately verify should work
	const valid = await verifyTOTP({ otp, ...config })
	expect(valid).toBe(true)

	// Wrong code should fail
	const invalid = await verifyTOTP({ otp: '000000', ...config })
	expect(invalid).toBe(false)
})
```

### Debug Logging

```typescript
// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
	console.log('TOTP Secret:', verification.secret)
	console.log('Expected OTP:', await generateTOTP({ ...verification }))
	console.log('User provided:', userCode)
}
```

## Troubleshooting

### Common Issues

**"Invalid code" error**

- Check device time synchronization
- Ensure using correct authenticator entry
- Verify QR code was scanned completely
- Try next code when current expires

**Can't scan QR code**

- Use manual entry option
- Copy the `otpauth://` URI
- Check QR code isn't cut off

**Lost access to authenticator**

- Admin intervention required
- Database: Delete verification record for user
- User can then re-enable 2FA

**2FA not working after enable**

- Clear browser cookies
- Check database for verification record
- Ensure `type` is `'2fa'` not `'2fa-verify'`

### Database Queries

```sql
-- Check if user has 2FA enabled
SELECT * FROM Verification
WHERE target = 'USER_ID' AND type = '2fa';

-- Disable 2FA for user (admin recovery)
DELETE FROM Verification
WHERE target = 'USER_ID' AND type = '2fa';

-- View all verification types for user
SELECT type, createdAt, expiresAt FROM Verification
WHERE target = 'USER_ID';
```

### Environment Variables

Ensure these are set:

```env
SESSION_SECRET=your-secret-here  # Used for cookie encryption
NODE_ENV=production              # Enables secure cookies
```

## Advanced Topics

### Backup Codes (Future Enhancement)

```typescript
// Potential implementation
const backupCodes = Array.from({ length: 10 }, () => generateRandomString(8))
// Store hashed versions in database
```

### SMS Fallback (Future Enhancement)

- Add phone number to user profile
- Send TOTP via SMS as backup
- Higher security risk, use cautiously

### Hardware Token Support

- TOTP compatible with hardware tokens
- YubiKey OATH support
- Same QR code/secret works

### Custom Time Windows

```typescript
// More lenient time window (3 periods)
const result = await verifyTOTP({
	otp: code,
	window: 3, // Accept ±3 time periods
	...config,
})
```

## Resources

- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- [@epic-web/totp Documentation](https://github.com/epicweb-dev/epic-web/tree/main/packages/totp)
- [OWASP 2FA Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
- [Google Authenticator](https://support.google.com/accounts/answer/1066447)

## Summary

The Epic Stack's 2FA implementation provides robust security through TOTP-based
authentication. The flexible Verification model supports multiple use cases
beyond just login 2FA, including password resets and email changes. The
implementation follows security best practices while maintaining good user
experience through QR codes and standard 6-digit codes compatible with all major
authenticator apps.
