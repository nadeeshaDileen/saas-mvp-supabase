# SaaS MVP — Next.js + Supabase

Clean, high-performance SaaS starter with proper state management and caching.

## Stack

- **Next.js 15** — App Router, Server Components, middleware
- **Supabase** — Auth, Postgres, Storage
- **TanStack Query v5** — server state, caching, background refetch
- **Tailwind CSS v4** — utility-first styling
- **shadcn/ui** — Radix-based component primitives
- **TypeScript** — strict mode throughout

## Project Structure

```
saas-mvp-supabase/
├── app/                    # Next.js App Router
│   ├── (public)/           # Landing page
│   ├── auth/               # Login / Sign up
│   └── dashboard/          # Protected pages
├── components/
│   ├── ui/                 # Base UI primitives (shadcn-style)
│   ├── features/           # Feature-scoped components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── settings/
│   ├── layouts/            # DashboardLayout, etc.
│   └── shared/             # LoadingSpinner, etc.
├── contexts/               # OrganizationContext
├── hooks/
│   ├── queries/            # useAuth, useProfile, useOrganizations
│   └── mutations/          # useAuthMutations, useUpdateProfile
├── lib/
│   ├── supabase/           # client, server, middleware helpers
│   ├── react-query/        # queryClient, queryKeys, queryOptions
│   └── utils.ts            # cn(), formatDate(), getInitials()
├── providers/              # QueryProvider
├── types/                  # database.ts, user.ts, organization.ts
└── middleware.ts           # Auth session refresh + route protection
```

## Caching Strategy

| Data | staleTime | gcTime | Notes |
|------|-----------|--------|-------|
| Auth session | 1 min | 2 min | Short for security |
| Profile / Orgs | 5 min | 10 min | Stable, background refetch |
| Static config | ∞ | 24 hr | Never re-fetched |

## Getting Started

```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

## Generate Supabase Types

```bash
npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
```
