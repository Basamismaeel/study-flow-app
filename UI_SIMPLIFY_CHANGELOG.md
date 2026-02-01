# UI simplification changelog (cleaner, less overwhelming)

If you want to revert any of these, say which page or "revert all" and we can undo.

## Login page (`src/pages/LoginPage.tsx`)
- Removed footer: "Accounts and data sync via Firebase — same login on all devices."
- Forgot password: shorter copy — "We'll email you a reset link." / "Check your email" + one line "Can't find it? Check spam."
- Removed long tip box about Firebase Console.

## Pending approval (`src/pages/PendingApprovalPage.tsx`)
- Title: "Waiting for approval" (was longer).
- Subtitle: "You'll get access once an admin approves your account."
- Email shown without "Signed in as" label.

## Blocked access (`src/pages/BlockedAccessPage.tsx`)
- Subtitle: "Please sign in again." (removed "or contact support").
- One primary "Sign in" button, one "Sign out" ghost.

## Major selection (`src/pages/MajorSelectionPage.tsx`)
- Subtitle: "Pick one to get started." (was longer).
- Removed "Dedicated dashboard" and "Custom major" labels on options.

## Dashboard (`src/pages/GenericDashboard.tsx`)
- Removed "Track your progress across courses and daily tasks" under Overview.
- Overview heading slightly smaller (text-2xl).
- Empty states: shorter copy ("Add tasks to your courses to see progress here." / "Add a course to get started.").
- "Next up": "Change course" (was "Click to change").

## Admin page (`src/pages/AdminApprovalPage.tsx`)
- One line: "Click Approve to give them dashboard access."

## Add course daily tasks dialog (`src/components/AddCourseDailyTasksDialog.tsx`)
- Subtitle: "Add tasks and check them off each day."
