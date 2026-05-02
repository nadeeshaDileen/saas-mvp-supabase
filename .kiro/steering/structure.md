# Project Structure

## Directory Organization

```
saas-mvp-supabase/
├── app/                    # Next.js App Router (routes and pages)
├── components/             # React components
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries and configurations
├── providers/              # Top-level providers (QueryProvider)
├── supabase/               # Database migrations
├── types/                  # TypeScript type definitions
└── middleware.ts           # Next.js middleware (auth + route protection)
```

## App Router Structure (`app/`)

Routes follow Next.js 15 App Router conventions:

- **`(public)/`** - Route group for public pages (landing page)
- **`auth/`** - Authentication pages (login, signup, callback)
- **`dashboard/`** - Protected store owner dashboard
  - `products/` - Product management (list, create, edit)
  - `inventory/` - Inventory tracking
  - `orders/` - Order management and fulfillment
  - `settings/` - Store settings
- **`shop/`** - Public product catalog and product detail pages
- **`cart/`** - Shopping cart page
- **`checkout/`** - Checkout flow
- **`orders/`** - Customer order history and tracking
- **`api/`** - API routes
  - `stripe/` - Stripe payment and webhook handlers
  - `orders/export/` - Order export functionality

## Components (`components/`)

Organized by scope and reusability:

- **`ui/`** - Base UI primitives (shadcn-style components)
  - Button, Input, Label, Card, Badge, Avatar, etc.
  - Radix UI-based, styled with Tailwind
  - Reusable across the entire app
- **`features/`** - Feature-scoped components
  - `auth/` - LoginForm, SignUpForm
  - `shop/` - ProductCard, ProductGrid, ProductFilters, SearchBar
  - `cart/` - CartDrawer, CartItem, CartSummary
  - `checkout/` - Checkout flow components
  - `dashboard/` - Dashboard-specific components
    - `products/` - ProductForm, ProductTable, ImageUploader
    - `orders/` - OrdersTable, OrderStatusSelect, ExportButton
    - `inventory/` - InventoryTable
  - `orders/` - OrderCard, OrderDetail, OrderList
  - `settings/` - SettingsPage
- **`layouts/`** - Layout components (DashboardLayout, etc.)
- **`shared/`** - Shared utility components (LoadingSpinner, etc.)

## Hooks (`hooks/`)

Custom hooks organized by purpose:

- **`queries/`** - Data fetching hooks using TanStack Query
  - `useAuth.ts` - Current user session
  - `useProfile.ts` - User profile data
  - `useOrganizations.ts` - Organization/tenant data
- **`mutations/`** - Data mutation hooks
  - `useAuthMutations.ts` - Sign in, sign up, sign out
  - `useUpdateProfile.ts` - Profile updates

## Lib (`lib/`)

Utility libraries and configurations:

- **`supabase/`** - Supabase client configurations
  - `client.ts` - Browser-side client (singleton)
  - `server.ts` - Server-side client (Server Components)
  - `service.ts` - Service role client (admin operations)
  - `middleware.ts` - Middleware helper for auth
- **`react-query/`** - TanStack Query configuration
  - `query-client.ts` - Global QueryClient with defaults
  - `query-keys.ts` - Query key factories
  - `query-options.ts` - Shared query options
- **`hooks/`** - Domain-specific hooks
  - `useCart.ts` - Shopping cart operations
  - `useProducts.ts` - Product queries
  - `useProductMutations.ts` - Product mutations
  - `useOrders.ts` - Order queries
  - `useInventory.ts` - Inventory queries
- **`auth/`** - Auth utilities
  - `requireStoreOwner.ts` - Server-side auth guard
- **`utils.ts`** - General utilities
  - `cn()` - Class name merging (clsx + tailwind-merge)
  - `formatDate()` - Date formatting
  - `getInitials()` - Extract initials from name

## Types (`types/`)

TypeScript type definitions:

- `database.ts` - Auto-generated Supabase database types
- `user.ts` - User-related types
- `organization.ts` - Organization/tenant types
- Additional domain types as needed

## Database (`supabase/migrations/`)

Numbered SQL migration files executed in order:

- `000_auth_trigger.sql` - Auth trigger setup
- `001_add_profile_role.sql` - User roles
- `002_create_products.sql` - Products table
- `003_create_variants.sql` - Product variants (size, color)
- `004_create_cart_items.sql` - Shopping cart
- `005_create_orders.sql` - Orders and order items
- `006_cancel_order_rpc.sql` - Order cancellation function
- `007_rls_policies.sql` - Row Level Security policies
- `008_storage_bucket.sql` - File storage setup

## Naming Conventions

- **Files**: PascalCase for components (`LoginForm.tsx`), camelCase for utilities (`useAuth.ts`)
- **Components**: PascalCase (`ProductCard`, `DashboardLayout`)
- **Hooks**: camelCase with `use` prefix (`useProducts`, `useCart`)
- **Utilities**: camelCase (`formatDate`, `getInitials`)
- **Types**: PascalCase (`User`, `Product`, `Database`)
- **Constants**: UPPER_SNAKE_CASE for true constants

## Import Paths

Use `@/` alias for absolute imports from project root:

```typescript
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/queries/useAuth";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
```

## Component Patterns

- **Client Components**: Use `"use client"` directive at top of file
- **Server Components**: Default in App Router, no directive needed
- **Async Server Components**: Can directly fetch data, no hooks needed
- **Forms**: Controlled components with local state, mutations via TanStack Query
- **Loading States**: Use `isPending` from mutations, `isLoading` from queries
- **Error Handling**: Toast notifications via `sonner` for user feedback
