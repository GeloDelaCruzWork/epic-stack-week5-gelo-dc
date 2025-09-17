# Existing E2E Test Documentation

## Test Coverage Overview

This document describes all existing E2E tests in the `/tests/e2e` directory,
their purpose, and what features they validate.

## Core Test Files

### 1. `onboarding.test.ts`

**Purpose**: Tests the complete user registration and onboarding flow  
**Key Scenarios**:

- New user registration with email
- Email verification process
- Username selection
- Initial profile setup
- Validation of required fields
- Error handling for duplicate users

**Business Value**: Ensures new users can successfully create accounts and
access the application

---

### 2. `2fa.test.ts`

**Purpose**: Tests two-factor authentication implementation  
**Key Scenarios**:

- Enabling 2FA on an account
- TOTP (Time-based One-Time Password) setup
- Login with 2FA enabled
- Backup codes generation and usage
- Disabling 2FA
- Invalid OTP code handling

**Business Value**: Validates critical security features for account protection

---

### 3. `passkey.test.ts`

**Purpose**: Tests WebAuthn/Passkeys authentication  
**Key Scenarios**:

- Passkey registration flow
- Login with passkey
- Multiple passkeys management
- Fallback to password authentication
- Browser compatibility handling

**Business Value**: Modern passwordless authentication support

---

### 4. `password-security.test.ts`

**Purpose**: Tests password policies and session management  
**Key Scenarios**:

- Password strength requirements
- Password change flow
- Session invalidation after password change
- Password reset via email
- Account lockout after failed attempts
- Session timeout handling

**Business Value**: Ensures robust password security and session management

---

### 5. `notes.test.ts`

**Purpose**: Tests core CRUD operations for notes feature  
**Key Scenarios**:

- Creating new notes
- Reading/viewing notes
- Editing existing notes
- Deleting notes
- Note permissions (owner only)
- Note search functionality
- Empty state handling

**Business Value**: Core application functionality for content management

---

### 6. `note-images.test.ts`

**Purpose**: Tests image upload and management in notes  
**Key Scenarios**:

- Image upload via drag-and-drop
- Image upload via file picker
- Multiple image uploads
- Image deletion
- Image size validation
- Unsupported format handling
- Image display in notes

**Business Value**: Rich media support enhances user experience

---

### 7. `projects.test.ts`

**Purpose**: Tests project management features  
**Key Scenarios**:

- Creating new projects
- Project listing and filtering
- Project details view
- Project editing
- Project deletion
- Project collaboration features
- Project status updates

**Business Value**: Organizational features for grouping related content

---

### 8. `search.test.ts`

**Purpose**: Tests search functionality across the application  
**Key Scenarios**:

- Global search bar functionality
- Search results display
- Search filters (by type, date, etc.)
- Empty search results handling
- Search query validation
- Search history/suggestions
- Advanced search options

**Business Value**: Helps users quickly find content

---

### 9. `settings-profile.test.ts`

**Purpose**: Tests user profile and settings management  
**Key Scenarios**:

- Profile information updates
- Avatar upload and change
- Email address change
- Username change
- Account preferences
- Privacy settings
- Account deletion

**Business Value**: User self-service capabilities reduce support burden

---

### 10. `error-boundary.test.ts`

**Purpose**: Tests error handling and recovery  
**Key Scenarios**:

- 404 page handling
- 500 error recovery
- Network error handling
- Form validation errors
- Session expiration handling
- Graceful degradation
- Error reporting to user

**Business Value**: Improved user experience during failures

---

## Test Execution Matrix

| Test File                   | Average Runtime | Complexity | Dependencies           | Priority |
| --------------------------- | --------------- | ---------- | ---------------------- | -------- |
| `onboarding.test.ts`        | ~30s            | Low        | Database               | Critical |
| `search.test.ts`            | ~15s            | Low        | Database, Search Index | High     |
| `notes.test.ts`             | ~45s            | Medium     | Database, Auth         | Critical |
| `settings-profile.test.ts`  | ~25s            | Medium     | Database, Auth         | High     |
| `error-boundary.test.ts`    | ~20s            | Low        | None                   | Medium   |
| `password-security.test.ts` | ~40s            | Medium     | Database, Email        | Critical |
| `2fa.test.ts`               | ~35s            | High       | Database, Auth, TOTP   | High     |
| `note-images.test.ts`       | ~50s            | High       | Database, S3, Auth     | Medium   |
| `projects.test.ts`          | ~40s            | Medium     | Database, Auth         | Medium   |
| `passkey.test.ts`           | ~30s            | High       | Database, WebAuthn     | Low      |

## Running Specific Test Suites

### Quick Smoke Tests (< 2 min)

```bash
npx playwright test search.test.ts error-boundary.test.ts --project=chromium
```

### Critical Path Tests (~ 5 min)

```bash
npx playwright test onboarding.test.ts notes.test.ts password-security.test.ts --project=chromium
```

### Full Test Suite

```bash
npm run test:e2e:run
```

### Single Test File

```bash
npx playwright test tests/e2e/notes.test.ts --ui
```

## Test Data Management

### Default Test User

- Username: `kody`
- Password: `kodylovesyou`
- Available after running `npm run setup`

### Test Isolation

Each test creates its own test data and cleans up after completion. Tests can
run in parallel without interference.

## Common Test Patterns

### Authentication Helper

Most tests use a shared authentication helper:

```typescript
import { createUser } from '#tests/fixtures/user.ts'
```

### Page Object Model

Some tests use page objects for reusability:

```typescript
import { LoginPage } from '#tests/pages/login.page.ts'
```

### Custom Assertions

Project includes custom Playwright assertions for common checks.

## Debugging Failed Tests

1. **Run in UI Mode**: `npm run test:e2e:dev`
2. **Check Trace Files**: Located in `test-results/` after failure
3. **View HTML Report**: `npx playwright show-report`
4. **Enable Debug Mode**: `DEBUG=pw:api npx playwright test`

## Contributing New Tests

When adding new E2E tests:

1. Place in `/tests/e2e/` directory
2. Follow naming convention: `feature-name.test.ts`
3. Include test description comments
4. Clean up test data in `afterEach` hooks
5. Tag tests appropriately (@smoke, @critical, etc.)
6. Update this document with test details
