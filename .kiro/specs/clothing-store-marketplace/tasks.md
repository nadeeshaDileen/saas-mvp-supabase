# Implementation Plan: Falcky Clothing Store Marketplace

## Overview

Incremental implementation of the Falcky single-store clothing marketplace on top of the existing `saas-mvp-supabase` platform. Tasks are ordered so each step compiles and integrates cleanly into the previous one — database first, then types, then data hooks, then UI, then payments, then authorization hardening.

## Tasks

- [x] 0. Google OAuth setup
  - [x] 0.1 Create `/auth/callback` route handler
    - File: `app/auth/callback/route.ts`
    - Exchange OAuth `code` for a Supabase session using `supabase.auth.exchangeCodeForSession(code)`
    - Redirect to `redirectTo` param if present, otherwise `/shop`
    - _Requirements: 10.7_

  - [ ] 0.2 Add "Continue with Google" button to login and signup pages
    - Add a Google OAuth button to `components/features/auth/LoginForm.tsx` and `SignUpForm.tsx`
    - On click call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`
    - Handle and display OAuth errors gracefully
    - _Requirements: 10.1, 10.2, 10.6_

  - [ ] 0.3 Auto-create profile on first Google sign-in
    - Create a Supabase Database Function + Auth trigger (`on_auth_user_created`) that inserts a `profiles` row with `role = 'customer'`, `email`, and `full_name` from `raw_user_meta_data` when a new user is created
    - File: `supabase/migrations/000_auth_trigger.sql`
    - _Requirements: 10.3_

  - [x] 0.4 Wire post-OAuth cart merge
    - In the auth callback handler and/or the `QueryProvider`, detect a fresh login and call `useMergeGuestCart()` to merge any localStorage cart into the DB
    - _Requirements: 10.5, 3.8_

- [ ] 1. Database schema and migrations
  - [ ] 1.1 Add `role` column to `profiles` table
    - Write migration: `ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'store_owner'))`
    - Create file `supabase/migrations/001_add_profile_role.sql`
    - _Requirements: 8.1, 8.6_

  - [ ] 1.2 Create `products` table with indexes and full-text search
    - Write migration for `products` table with all columns, constraints, and `search_vector` generated column
    - Add `idx_products_status`, `idx_products_category`, `idx_products_created_at`, `idx_products_search` (GIN) indexes
    - Create file `supabase/migrations/002_create_products.sql`
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [ ] 1.3 Create `variants` table with indexes
    - Write migration for `variants` table with size CHECK, stock >= 0 constraint, and UNIQUE(product_id, size, color)
    - Add `idx_variants_product_id`, `idx_variants_stock` indexes
    - Create file `supabase/migrations/003_create_variants.sql`
    - _Requirements: 1.3, 1.10, 7.1_

  - [ ] 1.4 Create `cart_items` table with indexes
    - Write migration for `cart_items` table with UNIQUE(user_id, variant_id) and quantity > 0 constraint
    - Add `idx_cart_items_user_id` index
    - Create file `supabase/migrations/004_create_cart_items.sql`
    - _Requirements: 3.1, 3.7_

  - [ ] 1.5 Create `orders` and `order_items` tables with indexes
    - Write migration for `orders` table with status CHECK, `stripe_payment_intent` UNIQUE constraint
    - Write migration for `order_items` table with denormalized `product_name`, `variant_size`, `variant_color`, `unit_price`
    - Add all indexes from design section 2.5 and 2.6
    - Create file `supabase/migrations/005_create_orders.sql`
    - _Requirements: 4.3, 5.1, 6.1_

  - [ ] 1.6 Create `cancel_order` Supabase RPC function
    - Write migration for `cancel_order(order_id UUID)` PL/pgSQL function that atomically sets order status to `cancelled` and restores variant stock for all order items
    - Create file `supabase/migrations/006_cancel_order_rpc.sql`
    - _Requirements: 6.4, 7.5, 8.5 (P8)_

  - [ ] 1.7 Apply RLS policies for all new tables
    - Write migration enabling RLS and creating all policies from design section 2.7 for `products`, `variants`, `cart_items`, `orders`, `order_items`
    - Create file `supabase/migrations/007_rls_policies.sql`
    - _Requirements: 8.3, 8.4, 8.5_

  - [ ] 1.8 Create Supabase Storage bucket for product images
    - Write migration or SQL script to create `product-images` public bucket
    - Set bucket file size limit to 5 MB and allowed MIME types to `image/jpeg`, `image/png`, `image/webp`
    - Create file `supabase/migrations/008_storage_bucket.sql`
    - _Requirements: 1.7, 1.8, 9.2, 9.5_

- [ ] 2. TypeScript domain types
  - [ ] 2.1 Extend `Database` interface in `types/database.ts`
    - Add `Row`, `Insert`, `Update` types for `products`, `variants`, `cart_items`, `orders`, `order_items` tables
    - Add `role` field to `profiles.Row` and `profiles.Update`
    - Add enums: `ProductStatus`, `OrderStatus`, `VariantSize`
    - _Requirements: 1.1, 1.3, 4.3, 5.3_

  - [ ] 2.2 Create domain model types in `types/store.ts`
    - Define `Product`, `Variant`, `CartItem`, `Cart`, `Order`, `OrderItem` application-level types (derived from DB Row types)
    - Define `CatalogFilters`, `ProductFormValues`, `OrderStatusUpdate`, `GuestCartItem` types
    - Define `ImageMeta` type `{ url: string; order: number }`
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 3. TanStack Query keys and base hooks
  - [ ] 3.1 Extend `lib/react-query/query-keys.ts` with store query keys
    - Add `products`, `variants`, `cart`, `orders`, `inventory` key factories matching design section 5
    - _Requirements: 2.1, 3.7, 5.1, 6.1, 7.6_

  - [ ] 3.2 Create product query hooks in `lib/hooks/useProducts.ts`
    - Implement `useProducts(filters: CatalogFilters)` — paginated query with full-text search, category, price range, color, size filters applied server-side via Supabase `.textSearch()`, `.eq()`, `.gte()`, `.lte()`, `.contains()`
    - Implement `useProduct(slug: string)` — single product with variants
    - Implement `useAdminProducts()` — all products for owner dashboard (no status filter)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.10_

  - [ ] 3.3 Create cart hooks in `lib/hooks/useCart.ts`
    - Implement `useCart()` — reads from DB when authenticated, from `localStorage` (`falcky_guest_cart`) when not
    - Implement `useAddToCart()` — upsert with stock cap logic; optimistic update
    - Implement `useUpdateCartItem()` — update quantity or delete if 0; optimistic update
    - Implement `useRemoveCartItem()` — delete cart item; optimistic update
    - Implement `useMergeGuestCart()` — merge localStorage cart into DB on login (upsert with MAX qty logic), then clear localStorage and invalidate cart query
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8 (P4)_

  - [ ] 3.4 Create order hooks in `lib/hooks/useOrders.ts`
    - Implement `useMyOrders()` — paginated customer order history (20 per page)
    - Implement `useOrder(id: string)` — single order with order items
    - Implement `useAdminOrders(filters)` — paginated owner order list (50 per page) with status/date/email filters
    - Implement `useUpdateOrderStatus()` — mutation calling `cancel_order` RPC for cancellations, direct update otherwise
    - _Requirements: 5.1, 5.2, 5.5, 6.1, 6.2, 6.3, 6.4, 6.7_

  - [ ] 3.5 Create inventory hooks in `lib/hooks/useInventory.ts`
    - Implement `useInventory()` — all variants joined with product name, sortable by stock
    - Implement `useUpdateStock()` — mutation to update `variants.stock`; invalidates inventory and products query keys
    - _Requirements: 7.1, 7.2, 7.6_

- [x] 4. Store owner: product management UI
  - [ ] 4.1 Create `ImageUploader` component at `components/features/dashboard/products/ImageUploader.tsx`
    - Drag-and-drop + file-picker interface accepting JPEG, PNG, WebP up to 5 MB
    - Client-side validation of file type and size before upload; show descriptive error on rejection
    - Upload to `product-images/{productId}/{filename}` via `supabase.storage.from('product-images').upload()`
    - Display thumbnail preview for each uploaded image
    - Support reordering images (drag handles) and deletion (calls `supabase.storage.remove()`)
    - _Requirements: 1.7, 1.8, 1.9, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 4.2 Create `ProductForm` component at `components/features/dashboard/products/ProductForm.tsx`
    - Form fields: name (1–120 chars), description (1–2000 chars), base price (positive), category (select), status (draft/active/archived)
    - Variant management: add/remove variant rows with size (XS–XXL select), color (text), stock (non-negative integer), optional price override
    - Embed `ImageUploader`; wire images array into form state
    - On submit call `useCreateProduct()` or `useUpdateProduct()` mutation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 4.3 Create `ProductTable` component at `components/features/dashboard/products/ProductTable.tsx`
    - Table listing all products (name, category, status, variant count, created date)
    - Row actions: Edit (link to `/dashboard/products/[id]`), Archive/Activate toggle, Delete (with guard — show error if orders exist)
    - Low-stock and out-of-stock badges per product row
    - _Requirements: 1.5, 1.6, 7.3, 7.4_

  - [ ] 4.4 Create dashboard product pages
    - `app/dashboard/products/page.tsx` — renders `ProductTable` using `useAdminProducts()`
    - `app/dashboard/products/new/page.tsx` — renders `ProductForm` in create mode
    - `app/dashboard/products/[id]/page.tsx` — fetches product by id, renders `ProductForm` in edit mode
    - `app/dashboard/layout.tsx` — owner-only layout shell (role guard placeholder, wired in task 13)
    - _Requirements: 1.1, 1.4, 1.5, 1.6_

- [ ] 5. Public catalog: browse, search, filter, product detail
  - [ ] 5.1 Create `SearchBar` and `ProductFilters` components
    - `components/features/shop/SearchBar.tsx` — controlled input, debounced, 1–100 char validation
    - `components/features/shop/ProductFilters.tsx` — category select, price range (min/max), color multi-select, size multi-select; emits `CatalogFilters` on change
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ] 5.2 Create `ProductCard` and `ProductGrid` components
    - `components/features/shop/ProductCard.tsx` — product image (first in order), name, base price, category badge, out-of-stock overlay
    - `components/features/shop/ProductGrid.tsx` — responsive grid of `ProductCard`, pagination controls (24 per page), total count display
    - _Requirements: 2.1, 2.8, 2.10_

  - [ ] 5.3 Create catalog page at `app/shop/page.tsx`
    - Server Component shell; renders `SearchBar`, `ProductFilters`, `ProductGrid`
    - Reads filter state from URL search params; passes to `useProducts(filters)` hook
    - _Requirements: 2.1, 2.7, 2.8, 2.10_

  - [x] 5.4 Create `VariantSelector` and `ProductDetail` components
    - `components/features/shop/VariantSelector.tsx` — size buttons and color swatches; disables out-of-stock combinations; emits selected variant
    - `components/features/shop/ProductDetail.tsx` — image gallery (respects order), description, price, `VariantSelector`, Add to Cart button (calls `useAddToCart()`)
    - _Requirements: 2.9, 1.10, 3.1_

  - [x] 5.5 Create product detail page at `app/shop/[slug]/page.tsx`
    - Server Component; fetches product + variants via `useProduct(slug)` (or direct Supabase server call for SSR)
    - Renders `ProductDetail`; returns 404 if product not found or not active
    - _Requirements: 2.9, 1.2_

- [x] 6. Shopping cart
  - [x] 6.1 Create `CartItem` and `CartSummary` components
    - `components/features/cart/CartItem.tsx` — variant image, name, size, color, quantity stepper (calls `useUpdateCartItem()`), remove button, out-of-stock warning banner
    - `components/features/cart/CartSummary.tsx` — subtotal computed as Σ(effective_price × quantity), checkout CTA button
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.10_

  - [ ] 6.2 Create `CartDrawer` component at `components/features/cart/CartDrawer.tsx`
    - Slide-out drawer triggered from nav cart icon
    - Displays cart item count badge on icon (from `useCart()`)
    - Lists `CartItem` components; shows `CartSummary` at bottom
    - _Requirements: 3.9_

  - [ ] 6.3 Create cart page at `app/cart/page.tsx`
    - Full-page cart view using `CartPage` component
    - `components/features/cart/CartPage.tsx` — lists all cart items, shows `CartSummary`, handles empty state
    - _Requirements: 3.5, 3.6, 3.10_

  - [ ] 6.4 Wire guest cart merge into auth flow
    - In the post-login callback / auth state change handler, call `useMergeGuestCart()` once after successful authentication
    - Ensure merge is idempotent (upsert with MAX qty, clear localStorage after)
    - _Requirements: 3.8 (P4)_

- [ ] 7. Stripe integration — Payment Intent API route and checkout page
  - [ ] 7.1 Create `POST /api/stripe/create-payment-intent` route handler
    - File: `app/api/stripe/create-payment-intent/route.ts`
    - Authenticate user via `getSupabaseServerClient()`; return 401 if unauthenticated
    - Fetch cart items with variant stock; validate all items still in stock — return 409 with out-of-stock item list if any are unavailable
    - Calculate total server-side (effective_price × quantity for each item)
    - Create Stripe `PaymentIntent` with calculated amount and currency; return `{ clientSecret }`
    - _Requirements: 4.1, 4.6_

  - [ ] 7.2 Create `CheckoutForm` component at `components/features/checkout/CheckoutForm.tsx`
    - Calls `useCreatePaymentIntent()` on mount to get `clientSecret`
    - Renders Stripe Elements (`PaymentElement`) with the client secret
    - On submit: calls `stripe.confirmPayment()`; displays Stripe error messages on failure
    - On success: redirects to order confirmation page
    - _Requirements: 4.2, 4.4_

  - [ ] 7.3 Create `OrderSummary` component at `components/features/checkout/OrderSummary.tsx`
    - Displays itemized cart contents and total before payment submission
    - _Requirements: 4.1_

  - [ ] 7.4 Create checkout page at `app/checkout/page.tsx`
    - Renders `OrderSummary` + `CheckoutForm` side by side
    - Redirects unauthenticated users to login (wired fully in task 13)
    - _Requirements: 4.1, 4.2, 8.2_

- [ ] 8. Stripe webhook handler
  - [x] 8.1 Create `POST /api/stripe/webhook` route handler
    - File: `app/api/stripe/webhook/route.ts`
    - Verify Stripe webhook signature using `STRIPE_WEBHOOK_SECRET`; return HTTP 400 on failure
    - Handle `payment_intent.succeeded`: check for existing order by `stripe_payment_intent` (idempotency guard); if none exists, open a Supabase transaction to: create `orders` record, insert `order_items`, atomically decrement each variant's stock (`UPDATE variants SET stock = stock - $qty WHERE id = $id AND stock >= $qty`), clear `cart_items` for the user; rollback if any stock decrement returns 0 rows
    - Handle `payment_intent.payment_failed`: update order status to `payment_failed` if order exists
    - _Requirements: 4.3, 4.7, 4.8, 4.9, 4.10 (P2, P6, P7)_

  - [ ]* 8.2 Write property test for webhook idempotency (P6)
    - **Property 6: Webhook Idempotency**
    - Deliver the same `payment_intent.succeeded` payload N times; assert exactly one order exists for the payment intent ID
    - **Validates: Requirements 4.7**

  - [ ]* 8.3 Write property test for stock non-negativity (P7)
    - **Property 7: Stock Non-Negativity Invariant**
    - Generate sequences of concurrent checkout operations against a variant with bounded initial stock; assert `stock >= 0` after every operation
    - **Validates: Requirements 7.5, 4.3**

  - [ ]* 8.4 Write property test for stock decrement atomicity (P2)
    - **Property 2: Stock Decrement Atomicity Invariant**
    - Simulate concurrent checkouts for the same variant; assert `final_stock = initial_stock - total_units_sold` and `final_stock >= 0`
    - **Validates: Requirements 7.5**

- [ ] 9. Customer order history
  - [x] 9.1 Create `OrderCard` and `OrderList` components
    - `components/features/orders/OrderCard.tsx` — order ID, date, status badge, total amount, link to detail
    - `components/features/orders/OrderList.tsx` — paginated list (20 per page) using `useMyOrders()`
    - _Requirements: 5.1, 5.3, 5.5_

  - [ ] 9.2 Create `OrderDetail` component at `components/features/orders/OrderDetail.tsx`
    - Displays order ID, creation date, status, itemized order items (product name, size, color, quantity, unit price), and total
    - _Requirements: 5.2, 5.3_

  - [ ] 9.3 Create customer order pages
    - `app/orders/page.tsx` — renders `OrderList`; requires authentication (guard in task 13)
    - `app/orders/[id]/page.tsx` — fetches order via `useOrder(id)`, renders `OrderDetail`; returns 404 if order not found or not owned by current user
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ] 9.4 Create `OrderConfirmation` component at `components/features/checkout/OrderConfirmation.tsx`
    - Shown after successful checkout redirect; displays order ID and summary
    - Clears cart query cache on mount
    - _Requirements: 4.5, 4.10_

- [ ] 10. Checkpoint — core flows complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Store owner order management
  - [ ] 11.1 Create `OrderStatusSelect` component at `components/features/dashboard/orders/OrderStatusSelect.tsx`
    - Dropdown restricted to valid transitions: `confirmed`, `shipped`, `delivered`, `cancelled`
    - Calls `useUpdateOrderStatus()` on change; shows confirmation dialog before cancellation
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ] 11.2 Create `OrdersTable` component at `components/features/dashboard/orders/OrdersTable.tsx`
    - Table of all orders with columns: order ID, customer email, status, total, created date
    - Filter controls: status select, date range pickers, customer email text input
    - Pagination (50 per page) using `useAdminOrders(filters)`
    - _Requirements: 6.1, 6.2, 6.7_

  - [x] 11.3 Create `ExportButton` component at `components/features/dashboard/orders/ExportButton.tsx`
    - Button that calls `GET /api/orders/export` with current filters as query params
    - Triggers browser download of CSV file
    - _Requirements: 6.8_

  - [ ] 11.4 Create `GET /api/orders/export` route handler
    - File: `app/api/orders/export/route.ts`
    - Verify caller is `store_owner`; return 403 otherwise
    - Accept filter query params (status, date range, customer email); query `orders` table
    - Stream CSV response with columns: Order ID, Customer email, Status, Total amount, Created date
    - _Requirements: 6.8_

  - [ ] 11.5 Create owner order detail page at `app/dashboard/orders/[id]/page.tsx`
    - Fetches order + order items via `useOrder(id)`
    - Displays all order items, customer email, shipping address, payment status, Stripe Payment Intent ID
    - Embeds `OrderStatusSelect` for status updates
    - _Requirements: 6.3, 6.4, 6.6_

  - [x] 11.6 Create owner orders list page at `app/dashboard/orders/page.tsx`
    - Renders `OrdersTable` and `ExportButton`
    - _Requirements: 6.1, 6.2, 6.7, 6.8_

- [ ] 12. Inventory management
  - [x] 12.1 Create `InventoryTable` component at `components/features/dashboard/inventory/InventoryTable.tsx`
    - Table of all variants with columns: product name, size, color, stock quantity
    - Inline editable stock quantity field; calls `useUpdateStock()` on blur/enter
    - Low-stock warning (1–5 units) and out-of-stock indicator (0 units) per row
    - Sortable by stock level ascending/descending
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

  - [ ] 12.2 Create inventory page at `app/dashboard/inventory/page.tsx`
    - Renders `InventoryTable` using `useInventory()`
    - _Requirements: 7.6_

  - [ ]* 12.3 Write property test for stock non-negativity via inventory updates (P7)
    - **Property 7: Stock Non-Negativity Invariant (manual update path)**
    - Generate sequences of stock updates and purchases; assert `stock >= 0` at every step
    - **Validates: Requirements 7.1, 7.5**

- [ ] 13. Authorization guards
  - [ ] 13.1 Extend `middleware.ts` to protect dashboard routes
    - Import `updateSession` logic; add redirect to `/auth/login` for any unauthenticated request to `/dashboard/*`
    - Preserve the original URL as a `redirectTo` query param for post-login return
    - _Requirements: 8.2, 8.3_

  - [ ] 13.2 Create `requireStoreOwner` server utility in `lib/auth/requireStoreOwner.ts`
    - Accepts a Supabase server client and session; queries `profiles.role`; throws/returns 403 response if role is not `store_owner`
    - Use in all dashboard Route Handlers (`/api/orders/export`, `/api/stripe/create-payment-intent` owner checks) and dashboard Server Components
    - _Requirements: 8.3, 8.4, 8.6_

  - [ ] 13.3 Apply `requireStoreOwner` guard to all dashboard pages and API routes
    - Add server-side role check to `app/dashboard/layout.tsx` — redirect to `/` with 403 toast if not owner
    - Add guard to `app/api/orders/export/route.ts` and any other owner-only route handlers
    - _Requirements: 8.3, 8.4_

  - [ ] 13.4 Add checkout authentication redirect
    - In `app/checkout/page.tsx`, check session server-side; redirect unauthenticated users to `/auth/login?redirectTo=/checkout`
    - _Requirements: 8.2_

- [ ] 14. Property-based tests for correctness properties
  - [ ]* 14.1 Write property test for cart subtotal invariant (P1)
    - **Property 1: Cart Subtotal Invariant**
    - Generate arbitrary collections of cart items with random quantities and prices (with and without price overrides); assert computed subtotal equals Σ(effective_price × quantity)
    - **Validates: Requirements 3.6**

  - [ ]* 14.2 Write property test for order total round-trip (P3)
    - **Property 3: Order Total Round-Trip**
    - Generate arbitrary order items with random prices and quantities; assert summing order items reproduces the stored `total_amount`
    - **Validates: Requirements 4.3, 5.2**

  - [ ]* 14.3 Write property test for cart merge idempotence (P4)
    - **Property 4: Cart Merge Idempotence**
    - Apply the `mergeGuestCart` function twice with the same localStorage cart and DB cart state; assert the resulting cart is identical to a single application
    - **Validates: Requirements 3.8**

  - [ ]* 14.4 Write property test for filter conjunction invariant (P5)
    - **Property 5: Filter Conjunction Invariant**
    - Generate arbitrary filter combinations and a product dataset; assert the filtered result set equals the set of products satisfying all predicates independently
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7**

  - [ ]* 14.5 Write property test for order cancellation stock restoration (P8)
    - **Property 8: Order Cancellation Stock Restoration**
    - Create an order, record stock levels, cancel the order via `cancel_order` RPC, assert each variant's stock increased by exactly the cancelled quantity
    - **Validates: Requirements 6.4, 7.5**

- [ ] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Properties P1–P8 from the requirements document each have a dedicated optional test sub-task
- The `cancel_order` RPC (task 1.6) is the single source of truth for atomic stock restoration — both the UI mutation and property tests call it
- Stripe environment variables (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) must be set in `.env.local` before tasks 7–8 can be tested
- Install required packages before starting: `npm install stripe @stripe/stripe-js @stripe/react-stripe-js` in `saas-mvp-supabase/`
