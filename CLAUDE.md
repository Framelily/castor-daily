# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Castor Daily is a Thai-language habit tracking and daily task management PWA built with Next.js 16. Users create task templates (routines) that automatically generate daily tasks based on configurable frequencies.

## Commands

```bash
pnpm dev      # Start development server
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## Architecture

### Tech Stack
- Next.js 16 with App Router and React Compiler enabled
- Supabase for auth (Google OAuth) and PostgreSQL database
- Tailwind CSS 4 with Radix UI primitives
- TypeScript with strict mode
- dayjs for date manipulation

### Route Structure
- `src/app/(auth)/` - Authentication routes (login, callback, onboarding)
- `src/app/(main)/` - Protected routes with bottom navigation (dashboard, routines, analytics, settings)

### Authentication Flow
1. Middleware (`src/middleware.ts`) handles session refresh via `updateSession()`
2. `AuthProvider` wraps the app and provides `user`, `profile`, `session` context
3. Onboarding redirect is handled client-side in AuthProvider for performance
4. Profile creation happens during onboarding completion

### Data Model
Located in `src/types/database.ts`:
- **Profile**: User settings (work hours, rest day, strict mode, timezone)
- **Category**: User-created groupings for task templates
- **TaskTemplate**: Recurring task definitions with frequency config (daily/weekly/interval/monthly)
- **Task**: Generated daily instances from templates, or ad-hoc tasks

### Server Actions Pattern
All database operations use Server Actions in `src/lib/actions/`:
- Each action creates a fresh Supabase client via `createClient()` from `src/lib/supabase/server.ts`
- Actions call `supabase.auth.getUser()` for authentication
- Use `revalidatePath()` after mutations

### Task Generation Flow
`generateDailyTasks()` in `src/lib/actions/tasks.ts`:
1. Fetches user profile and active templates
2. Checks frequency rules via `shouldGenerateTask()` (handles daily/weekly/interval/monthly)
3. Skips if tasks already exist for the date
4. Inserts new Task records

Dashboard calls this on mount before fetching tasks.

### Supabase Client Usage
- Server: `src/lib/supabase/server.ts` - async `createClient()` using `next/headers` cookies
- Client: `src/lib/supabase/client.ts` - synchronous `createClient()` using browser client
- Middleware: `src/lib/supabase/middleware.ts` - handles cookie refresh

### UI Components
- `src/components/ui/` - Radix-based primitives (Button, Card, Dialog, etc.)
- `src/components/providers/AuthProvider.tsx` - Auth context with profile fetching
- `src/components/routines/` - RoutineDialog for template CRUD, CategoryManager
- `src/components/dashboard/` - OverdueAlert component
- `src/components/analytics/` - StatsCard, Heatmap, WeeklyChart

### Time Slots
Tasks are organized by time slot: `pre_work`, `during_work`, `post_work`, `anytime`. The UI displays Thai labels.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Database Schema Note

The Supabase client is typed but uses `as any` casts due to generated types not matching runtime. The actual schema lives in Supabase dashboard.
