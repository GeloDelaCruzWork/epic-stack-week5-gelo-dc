# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Development Commands

### Setup and Installation

```bash
npm run setup  # Initial project setup, runs migrations and installs playwright
```

### Default Credentials

After seeding the database, you can log in with:

- Username: `kody`
- Password: `kodylovesyou`

### Core Development

```bash
npm run dev        # Start development server with mocks enabled
npm run dev:no-mocks  # Start development server without mocks
npm run build      # Build for production (runs build:remix and build:server)
npm start         # Start production server
```

### Testing

```bash
npm test           # Run vitest in watch mode
npm run test:e2e:dev   # Run Playwright tests with UI (interactive)
npm run test:e2e:run   # Run Playwright tests in CI mode
npm run test:e2e:install  # Install Playwright browsers
npm run coverage   # Run vitest with coverage report

# Timesheet-specific tests
npm run test:timesheets      # Run timesheet tests with UI
npm run test:timesheets:run  # Run timesheet tests headlessly
npm run test:timesheets:advanced  # Run advanced timesheet tests
npm run test:timesheets:all  # Run all timesheet tests
```

### Code Quality

```bash
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
npm run format     # Format code with Prettier
npm run validate   # Run all checks (test, lint, typecheck, e2e)
```

### Database

```bash
npx prisma migrate dev      # Create new migration
npx prisma migrate deploy   # Apply migrations in production
npx prisma studio          # Open Prisma Studio
npx prisma db seed         # Seed database
npx prisma generate        # Generate Prisma client
npx prisma migrate reset   # Reset database (WARNING: deletes all data)
```

### Route Inspection

```bash
npx react-router routes    # Display the route structure
```

### Single Test Execution

```bash
# Vitest - run specific test file
npm test -- app/utils/cache.server.test.ts

# Playwright - run specific test
npx playwright test tests/e2e/auth.test.ts
```

## High-Level Architecture

### Tech Stack

- **Framework**: React Router v7 (migrated from Remix) with file-based routing
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Email/password with 2FA support, GitHub/Google OAuth
- **Password Security**: Argon2id hashing algorithm
- **Styling**: Tailwind CSS with Radix UI components
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Caching**: In-memory LRU cache using @epic-web/cachified
- **Email**: Resend with React Email templates
- **File Storage**: S3-compatible object storage
- **Grid Component**: AG-Grid Enterprise for data tables

### Project Structure

#### Routing System

Uses `remix-flat-routes` with hybrid routing convention:

- Routes in `app/routes/` directory
- `+` folders become `.` in route paths
- `_` prefixed folders create layout routes without adding to URL
- API routes prefixed with `api.` handle data operations
- Run `npx react-router routes` to see generated route structure

#### Authentication & Security

- Session-based auth stored in cookies
- RBAC (Role-Based Access Control) with permissions system
- TOTP 2FA and WebAuthn/Passkeys support
- Honeypot and rate limiting for forms
- CSP headers configured in entry.server.tsx
- Password hashing with Argon2id (19 MiB memory, 2 iterations)
- Session invalidation on password change/reset

#### Database Architecture

- PostgreSQL as primary database
- Prisma schema at `prisma/schema.prisma`
- Test isolation using PostgreSQL schemas (each test worker gets unique schema)
- Connection pooling via Prisma
- Database URL configured via `DATABASE_URL` environment variable
- Key models: User, Note, Project, Timesheet, DTR, Timelog, ClockEvent

#### Application Features

##### Timesheet Management System

4-level hierarchical structure:

```
Timesheet (Employee Period Summary)
  └── DTR (Daily Time Records)
      └── Timelog (Time In/Out Events)
          └── ClockEvent (Actual Punch Time)
```

- Master-detail grids with AG-Grid Enterprise
- Single-expansion policy for performance
- In-place updates without page refresh
- Edit dialogs for all hierarchy levels
- API endpoints: `/api/timesheets/*`, `/api/dtrs/*`, `/api/timelogs/*`,
  `/api/clockevents/*`

##### Projects Module

- CRUD operations for project management
- Routes in `app/routes/projects+/`
- Includes edit and delete functionality

#### Testing Infrastructure

- Unit tests colocated with source files (`*.test.ts`, `*.test.tsx`)
- E2E tests in `tests/e2e/` directory
- Test database automatically created and migrated
- MSW for mocking external services
- Authenticated test fixture available in Playwright
- Test environment uses jsdom for DOM testing

#### Environment Configuration

- `.env.example` contains all required environment variables
- `app/utils/env.server.ts` validates and exposes env vars
- Different configs for development, test, and production
- Key environment variables:
  - `DATABASE_URL`: PostgreSQL connection string
  - `SESSION_SECRET`: Session encryption key
  - `HONEYPOT_SECRET`: Form protection secret
  - `RESEND_API_KEY`: Email service API key

### Key Patterns

#### Server/Client Separation

- `.server.ts` files only run on server
- `.client.ts` files only included in client bundle
- Use `useLoaderData()` for server data in components

#### Progressive Enhancement

- Forms work without JavaScript using React Router actions
- Client-side enhancements via Conform for better UX
- Optimistic UI updates where appropriate

#### Image Handling

- Images stored in S3-compatible storage
- Automatic optimization and resizing
- Image upload component with drag-and-drop

#### Error Handling

- Error boundaries at route and root levels
- Sentry integration for production monitoring
- Structured error responses with proper status codes

### Development Notes

#### Avoid useEffect

Per `.cursor/rules/avoid-use-effect.mdc`, prefer:

- Ref callbacks for DOM manipulation
- Event handlers with flushSync for state updates
- useSyncExternalStore for external state
- CSS for visual effects

#### Database Migrations

- Always test migrations on a copy of production data
- Use `npx prisma migrate dev` during development
- Use `npx prisma migrate deploy` in production

#### TypeScript

- Strict mode enabled
- Path aliases configured (`#app/*`, `#tests/*`)
- Run `npm run typecheck` before committing
- All components and utilities should be strongly typed

#### Component Patterns

- Dialog components in `app/components/*-dialog.tsx`
- UI primitives in `app/components/ui/`
- Form components use Conform for validation
- Icons managed via sprite sheet in `app/components/ui/icons/`

#### API Design

- RESTful endpoints under `/api/` prefix
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return JSON responses with consistent structure
- Handle errors with appropriate status codes

#### Recent Architecture Changes

- Migrated from Remix to React Router v7
- Migrated from SQLite to PostgreSQL
- Removed Fly.io and LiteFS dependencies
- Cache is now purely in-memory (no SQLite cache)
- Fully migrated to Argon2id password hashing
- Added session invalidation on password changes
- Implemented comprehensive timesheet management system with AG-Grid
- Theme support with ag-theme-quartz for light/dark modes
