# Tech Stack

## Core Framework

- **Next.js 15** with App Router, Server Components, and Server Actions
- **React 19** with modern hooks and patterns
- **TypeScript** in strict mode throughout the codebase

## Backend & Database

- **Supabase** for authentication, PostgreSQL database, and file storage
- **Supabase SSR** (`@supabase/ssr`) for server-side auth handling
- Database migrations in `supabase/migrations/` (numbered SQL files)
- Row Level Security (RLS) policies for data access control

## State Management & Data Fetching

- **TanStack Query v5** (`@tanstack/react-query`) for server state management
- Query configuration in `lib/react-query/`:
  - `staleTime: 5 min` (data stays fresh)
  - `gcTime: 10 min` (cache retention)
  - `retry: 1` (single retry on failure)
- Custom hooks pattern: `hooks/queries/` for data fetching, `hooks/mutations/` for updates
- Context API for organization/tenant state (`contexts/OrganizationContext.tsx`)

## Styling & UI

- **Tailwind CSS v4** with utility-first approach
- **shadcn/ui** components built on Radix UI primitives
- **Lucide React** for icons
- **Sonner** for toast notifications
- Utility function `cn()` for conditional class merging (clsx + tailwind-merge)

## Payments

- **Stripe** for payment processing
- Stripe webhook handling for payment events
- Payment intents API for checkout flow

## Code Quality Tools

- **ESLint** with Next.js and Prettier configs
- **Prettier** with Tailwind plugin for consistent formatting
- **TypeScript** compiler for type checking

## Common Commands

```bash
# Development
npm run dev                 # Start dev server (localhost:3000)

# Building
npm run build              # Production build
npm run start              # Start production server

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Auto-fix ESLint issues
npm run format             # Format code with Prettier
npm run format:check       # Check formatting without changes
npm run type-check         # TypeScript type checking
npm run check-all          # Run all checks (type-check + lint + format:check)

# Database
npx supabase gen types typescript --project-id <id> > types/database.ts
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_APP_URL` - Application URL for OAuth redirects
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

## Key Libraries

- `date-fns` for date formatting
- `class-variance-authority` for component variant management
- `@stripe/react-stripe-js` and `@stripe/stripe-js` for Stripe integration
