# Role Assignments Feature

## Overview

A drag-and-drop interface for managing user-role associations in the ARMMS T&A +
Payroll system.

## Features

- **Three-panel layout:**
  - Left panel: List of all available roles with user counts
  - Middle panel: Users assigned to the selected role
  - Right panel: Available users not assigned to the selected role

- **Drag and Drop:** Simply drag users between the "Assigned" and "Available"
  panels to manage role assignments

- **Real-time updates:** Changes are immediately persisted to the database

- **Admin-only access:** Only users with the "admin" role can access this
  feature

## How to Access

1. Log in with an admin account (e.g., username: `kody`, password:
   `kodylovesyou`)
2. Click on your user dropdown in the top-right corner
3. Select "Role Assignments" from the dropdown menu
4. Navigate to `/admin/role-assignments`

## Technical Implementation

### Database Schema

Uses the existing many-to-many relationship between `User` and `Role` models in
Prisma:

- `User` model has `roles: Role[]`
- `Role` model has `users: User[]`

### Components Used

- **@dnd-kit**: Modern drag-and-drop library for React
- **Radix UI**: Avatar, ScrollArea components
- **Custom UI Components**: Card, Badge components
- **Sonner**: Toast notifications for success/error feedback

### Routes

- `/admin/role-assignments` - Main role assignment interface

### Server Actions

- `loader`: Fetches all roles and users with their associations
- `action`: Handles assign/unassign operations

## Development Notes

### Dependencies Added

```bash
npm install @dnd-kit/sortable @dnd-kit/core @dnd-kit/utilities
npm install @radix-ui/react-avatar @radix-ui/react-scroll-area
npm install class-variance-authority
```

### Files Created/Modified

1. **New Route:** `app/routes/admin.role-assignments.tsx`
2. **UI Components:**
   - `app/components/ui/card.tsx`
   - `app/components/ui/avatar.tsx`
   - `app/components/ui/badge.tsx`
   - `app/components/ui/scroll-area.tsx`
3. **Modified:** `app/components/user-dropdown.tsx` (added admin menu items)

## Testing the Feature

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Create test users and roles (if needed):**

   ```bash
   npx prisma db seed
   ```

3. **Access the feature:**
   - Navigate to http://localhost:3000
   - Log in as admin
   - Go to Role Assignments

## Security Considerations

- Route is protected with `requireUserWithRole(request, 'admin')`
- All database operations respect the existing permission system
- No cross-tenant data leakage (ready for multi-tenancy)

## Future Enhancements

- Bulk operations (assign/unassign multiple users at once)
- Search/filter functionality for users and roles
- Role creation and permission management interface
- Audit logging for role assignment changes
- Export role assignments to CSV/Excel
