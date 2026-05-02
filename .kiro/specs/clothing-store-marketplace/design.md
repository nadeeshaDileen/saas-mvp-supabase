# Design Document: Falcky Clothing Store Marketplace

## Overview

Falcky is a single-store clothing marketplace layered on top of the existing `saas-mvp-supabase` platform. The store owner manages products, variants, inventory, and orders through a protected dashboard. Customers browse the public catalog, add items to a cart, and check out via Stripe.

Key design decisions:
- **Single-owner model**: store owner identified by `profiles.role = 'store_owner'`
- **Supabase as the single backend**: Auth, Postgres, Storage, and RLS — no separate API server
- **Stripe for payments**: Payment Intents + Stripe Elements; webhook as a Next.js Route Handler
- **Cart persistence**: DB-backed for authenticated users; `localStorage` for guests; merge-on-login
- **TanStack Query v5**: all server state via query/mutation hooks

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 15 App Router                 │
│                                                         │
│  Public Routes          Protected Routes                │
│  /                      /dashboard/...  (store owner)   │
│  /shop                  /account/...    (customer)      │
│  /shop/[slug]                                           │
│  /cart                                                  │
│  /checkout                                              │
│  /orders                                                │
└────────────┬────────────────────────┬───────────────────┘
             │                        │
             ▼                        ▼
┌────────────────────┐    ┌───────────────────────┐
│  Supabase Postgres │    │   Supabase Storage    │
│  - products        │    │   - product-images/   │
│  - variants        │    └───────────────────────┘
│  - cart_items      │
│  - orders          │    ┌───────────────────────┐
│  - order_items     │    │       Stripe          │
│  - profiles        │    │  - Payment Intents    │
└────────────────────┘    │  - Webhooks           │
                          └───────────────────────┘
```

---

## 2. Database Schema

### 2.1 Extend `profiles` table

```sql
ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'
  CHECK (role IN ('customer', 'store_owner'));
```

### 2.2 `products` table

```sql
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  base_price    NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  category      TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  images        JSONB NOT NULL DEFAULT '[]',  -- [{url, order}]
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Full-text search
ALTER TABLE products ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english', name || ' ' || description)
  ) STORED;
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
```

### 2.3 `variants` table

```sql
CREATE TABLE variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  size          TEXT NOT NULL CHECK (size IN ('XS','S','M','L','XL','XXL')),
  color         TEXT NOT NULL CHECK (char_length(color) > 0),
  price_override NUMERIC(10,2) CHECK (price_override > 0),
  stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, size, color)
);

CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_variants_stock ON variants(stock);
```

### 2.4 `cart_items` table

```sql
CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_id  UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, variant_id)
);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
```

### 2.5 `orders` table

```sql
CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id),
  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled','payment_failed')),
  total_amount          NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
  stripe_payment_intent TEXT NOT NULL UNIQUE,
  customer_email        TEXT NOT NULL,
  shipping_address      JSONB,
  status_updated_at     TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_stripe_pi ON orders(stripe_payment_intent);
```

### 2.6 `order_items` table

```sql
CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id      UUID NOT NULL REFERENCES variants(id),
  product_name    TEXT NOT NULL,
  variant_size    TEXT NOT NULL,
  variant_color   TEXT NOT NULL,
  unit_price      NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### 2.7 RLS Policies

```sql
-- products: public read for active, owner full access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active products" ON products
  FOR SELECT USING (status = 'active');
CREATE POLICY "owner full access products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'store_owner')
  );

-- variants: public read, owner full access
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read variants" ON variants FOR SELECT USING (true);
CREATE POLICY "owner full access variants" ON variants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'store_owner')
  );

-- cart_items: users own their cart
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own cart" ON cart_items
  FOR ALL USING (user_id = auth.uid());

-- orders: users see own orders, owner sees all
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own orders" ON orders
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "owner sees all orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'store_owner')
  );

-- order_items: users see own, owner sees all
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
  );
CREATE POLICY "owner sees all order items" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'store_owner')
  );
```

---

## 3. App Router Page Structure

```
app/
├── (public)/
│   └── page.tsx                    # Landing / hero
├── shop/
│   ├── page.tsx                    # Catalog (browse, search, filter)
│   └── [slug]/
│       └── page.tsx                # Product detail
├── cart/
│   └── page.tsx                    # Cart review
├── checkout/
│   └── page.tsx                    # Stripe Elements + order confirmation
├── orders/
│   ├── page.tsx                    # Customer order history
│   └── [id]/
│       └── page.tsx                # Customer order detail
├── dashboard/
│   ├── layout.tsx                  # Owner-only layout (role guard)
│   ├── page.tsx                    # Owner dashboard overview
│   ├── products/
│   │   ├── page.tsx                # Product list
│   │   ├── new/page.tsx            # Create product
│   │   └── [id]/
│   │       └── page.tsx            # Edit product
│   ├── orders/
│   │   ├── page.tsx                # All orders list
│   │   └── [id]/page.tsx           # Order detail + status update
│   └── inventory/
│       └── page.tsx                # Inventory summary
└── api/
    ├── stripe/
    │   ├── create-payment-intent/
    │   │   └── route.ts            # POST — create Payment Intent
    │   └── webhook/
    │       └── route.ts            # POST — Stripe webhook handler
    └── orders/
        └── export/
            └── route.ts            # GET — CSV export (owner only)
```

---

## 4. Component Architecture

```
components/
├── ui/                             # shadcn/ui primitives (existing)
├── shared/
│   ├── LoadingSpinner.tsx
│   └── ErrorMessage.tsx
└── features/
    ├── shop/
    │   ├── ProductGrid.tsx         # Grid of ProductCard
    │   ├── ProductCard.tsx         # Single product tile
    │   ├── ProductFilters.tsx      # Category, price, size, color filters
    │   ├── SearchBar.tsx
    │   ├── ProductDetail.tsx       # Full product page content
    │   └── VariantSelector.tsx     # Size + color picker
    ├── cart/
    │   ├── CartDrawer.tsx          # Slide-out cart (nav)
    │   ├── CartPage.tsx            # Full cart page
    │   ├── CartItem.tsx
    │   └── CartSummary.tsx
    ├── checkout/
    │   ├── CheckoutForm.tsx        # Stripe Elements wrapper
    │   ├── OrderSummary.tsx
    │   └── OrderConfirmation.tsx
    ├── orders/
    │   ├── OrderList.tsx
    │   ├── OrderCard.tsx
    │   └── OrderDetail.tsx
    └── dashboard/
        ├── products/
        │   ├── ProductForm.tsx     # Create/edit product form
        │   ├── ProductTable.tsx
        │   └── ImageUploader.tsx
        ├── orders/
        │   ├── OrdersTable.tsx
        │   ├── OrderStatusSelect.tsx
        │   └── ExportButton.tsx
        └── inventory/
            └── InventoryTable.tsx
```

---

## 5. TanStack Query Hooks

### Query Keys (additions to existing `query-keys.ts`)

```typescript
products: {
  all: ['products'],
  list: (filters) => ['products', 'list', filters],
  detail: (slug: string) => ['products', 'detail', slug],
  adminList: ['products', 'admin', 'list'],
},
variants: {
  byProduct: (productId: string) => ['variants', productId],
},
cart: {
  all: ['cart'],
  items: ['cart', 'items'],
},
orders: {
  all: ['orders'],
  mine: ['orders', 'mine'],
  detail: (id: string) => ['orders', id],
  adminList: (filters) => ['orders', 'admin', 'list', filters],
},
inventory: {
  all: ['inventory'],
  list: ['inventory', 'list'],
},
```

### Key Hooks

| Hook | Type | Description |
|------|------|-------------|
| `useProducts(filters)` | query | Paginated catalog with filters |
| `useProduct(slug)` | query | Single product + variants |
| `useCart()` | query | Current user's cart items |
| `useAddToCart()` | mutation | Add/increment cart item |
| `useUpdateCartItem()` | mutation | Update quantity |
| `useRemoveCartItem()` | mutation | Remove cart item |
| `useMergeGuestCart()` | mutation | Merge localStorage → DB on login |
| `useCreatePaymentIntent()` | mutation | POST /api/stripe/create-payment-intent |
| `useMyOrders()` | query | Customer order history |
| `useOrder(id)` | query | Single order detail |
| `useAdminProducts()` | query | Owner product list |
| `useCreateProduct()` | mutation | Create product + variants |
| `useUpdateProduct()` | mutation | Update product |
| `useAdminOrders(filters)` | query | Owner order list |
| `useUpdateOrderStatus()` | mutation | Update order status |
| `useInventory()` | query | All variants with stock levels |
| `useUpdateStock()` | mutation | Update variant stock |

---

## 6. Stripe Integration Flow

### Checkout Flow

```
Customer clicks "Pay"
        │
        ▼
POST /api/stripe/create-payment-intent
  - Validate all cart items still in stock
  - Calculate total server-side
  - Create Stripe PaymentIntent
  - Return { clientSecret }
        │
        ▼
Client renders Stripe Elements with clientSecret
        │
        ▼
Customer submits card → Stripe confirms payment
        │
        ▼
Stripe sends POST /api/stripe/webhook
  - Verify signature (STRIPE_WEBHOOK_SECRET)
  - On payment_intent.succeeded:
      - Check order doesn't already exist (idempotency)
      - BEGIN TRANSACTION
        - Create order record
        - Create order_items
        - Decrement variant stock (atomic UPDATE ... WHERE stock >= quantity)
        - Clear cart_items for user
      - COMMIT
      - Send confirmation email (Supabase Edge Function or Resend)
  - On payment_intent.payment_failed:
      - Update order status to payment_failed (if order exists)
```

### Environment Variables Required

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## 7. Cart Persistence Strategy

### Authenticated Users
- Cart stored in `cart_items` table, keyed by `user_id`
- TanStack Query fetches on mount, mutations update optimistically

### Guest Users
- Cart stored in `localStorage` as `falcky_guest_cart: CartItem[]`
- `useCart()` hook reads from localStorage when unauthenticated

### Merge on Login
`useMergeGuestCart()` mutation runs once after successful authentication:

```
1. Read localStorage cart
2. For each guest cart item:
   - If variant already in DB cart → take MAX(guest_qty, db_qty)
   - If not in DB cart → INSERT
3. Clear localStorage
4. Invalidate cart query
```

Idempotent: running twice produces the same result (upsert logic).

---

## 8. Supabase Storage — Product Images

- **Bucket**: `product-images` (public)
- **Path pattern**: `products/{product_id}/{filename}`
- **Upload flow**: client uploads directly to Supabase Storage via `supabase.storage.from('product-images').upload()`
- **Size limit**: 5 MB enforced client-side before upload + Supabase bucket policy
- **Accepted types**: `image/jpeg`, `image/png`, `image/webp`
- **Public URL**: returned from `getPublicUrl()`, stored in `products.images` JSONB array
- **Delete**: on image removal, call `supabase.storage.from('product-images').remove([path])`

---

## 9. Key Data Flows

### Order Cancellation (Stock Restore)

```
Owner clicks "Cancel Order"
        │
        ▼
PATCH /dashboard/orders/[id] → useUpdateOrderStatus('cancelled')
        │
        ▼
Supabase RPC: cancel_order(order_id)
  BEGIN
    UPDATE orders SET status = 'cancelled', status_updated_at = now()
    FOR EACH order_item:
      UPDATE variants SET stock = stock + order_item.quantity
        WHERE id = order_item.variant_id
  COMMIT
        │
        ▼
Invalidate: orders, inventory query keys
```

### Atomic Stock Decrement (Prevent Overselling)

```sql
-- Called inside webhook handler transaction
UPDATE variants
SET stock = stock - $quantity
WHERE id = $variant_id
  AND stock >= $quantity
RETURNING stock;
-- If 0 rows returned → stock insufficient → rollback transaction
```

---

## 10. Authorization Guards

### Middleware (existing `middleware.ts`)
Extended to protect `/dashboard/*` routes — redirect to `/auth/login` if unauthenticated.

### Server-side Role Check
All dashboard Route Handlers and Server Components call:

```typescript
const supabase = await getSupabaseServerClient();
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', session.user.id)
  .single();

if (profile?.role !== 'store_owner') {
  return new Response('Forbidden', { status: 403 });
}
```

### RLS as Defense-in-Depth
Even if a route guard is bypassed, Supabase RLS policies ensure customers cannot read/write other users' data or owner-only tables.

---

## 11. Google OAuth Flow

### Auth Callback Route

```
app/auth/callback/route.ts   ← exchanges OAuth code for session cookie
```

```typescript
// app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') ?? '/shop';

  if (code) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
```

### Auto-create Profile Trigger

```sql
-- supabase/migrations/000_auth_trigger.sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'customer'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Supabase Dashboard Setup (manual step)
1. Dashboard → Authentication → Providers → Google → Enable
2. Paste **Google Client ID** and **Google Client Secret** from Google Cloud Console
3. Add `https://your-project.supabase.co/auth/v1/callback` as an authorized redirect URI in Google Cloud Console
4. Add `http://localhost:3000/auth/callback` to Supabase's **Redirect URLs** list

### Post-OAuth Cart Merge
After `exchangeCodeForSession` succeeds in the callback route, the client-side `QueryProvider` detects the new auth state via `supabase.auth.onAuthStateChange` and fires `useMergeGuestCart()` once to merge any localStorage guest cart into the database.
