# Requirements Document

## Introduction

Falcky is a single-store clothing marketplace built on top of the existing saas-mvp-supabase platform (Next.js 15, Supabase, TanStack Query v5, Tailwind CSS v4, shadcn/ui). The store owner manages all products directly through the existing authenticated dashboard. Customers browse, filter, and purchase clothing items with size and color variants. Payments are processed via Stripe, and both the owner and customers have order management views.

---

## Glossary

- **Store_Owner**: The authenticated user who manages the store — creates products, manages inventory, and fulfills orders.
- **Customer**: An authenticated or guest user who browses, adds items to cart, and places orders.
- **Product**: A clothing item listed in the store, identified by name, description, price, category, and images.
- **Variant**: A specific combination of size and color for a Product, each with its own stock quantity and optional price override.
- **Cart**: A session-scoped or user-scoped collection of Variant quantities selected by a Customer before checkout.
- **Cart_Item**: A single entry in the Cart representing one Variant and its selected quantity.
- **Order**: A confirmed purchase record created after successful payment, containing one or more Order_Items.
- **Order_Item**: A single line in an Order representing a purchased Variant and its quantity at the time of purchase.
- **Catalog**: The publicly visible collection of all active Products and their Variants.
- **Stripe**: The third-party payment processor used for checkout and refunds.
- **Payment_Intent**: A Stripe object representing a payment transaction in progress or completed.
- **Webhook**: An HTTP callback from Stripe that notifies the system of payment events.
- **Image_Storage**: Supabase Storage bucket used to store and serve Product images.
- **Search_Index**: The server-side full-text search capability provided by Postgres `tsvector` on product name and description.

---

## Requirements

### Requirement 1: Product Catalog Management

**User Story:** As a Store_Owner, I want to create, update, and delete clothing products with variants, so that I can manage what is available for sale in the store.

#### Acceptance Criteria

1. THE Store_Owner SHALL create a Product by providing a name (1–120 characters), description (1–2000 characters), base price (positive decimal), category, and at least one image.
2. WHEN a Product is created, THE Catalog SHALL make the Product visible to Customers only when its `status` is set to `active`.
3. THE Store_Owner SHALL add one or more Variants to a Product, each Variant specifying a size (XS, S, M, L, XL, XXL), a color (non-empty string), a stock quantity (non-negative integer), and an optional price override.
4. WHEN a Store_Owner updates a Product's name, description, price, or category, THE Catalog SHALL reflect the updated values within the same request-response cycle.
5. WHEN a Store_Owner sets a Product's `status` to `archived`, THE Catalog SHALL hide the Product from all Customer-facing views.
6. IF a Store_Owner attempts to delete a Product that has associated Orders, THEN THE System SHALL reject the deletion and return a descriptive error message.
7. THE Store_Owner SHALL upload between 1 and 8 images per Product; THE Image_Storage SHALL store each image and return a public URL.
8. IF an uploaded image exceeds 5 MB or is not of type JPEG, PNG, or WebP, THEN THE Image_Storage SHALL reject the upload and return a descriptive error.
9. THE Store_Owner SHALL reorder Product images; THE Catalog SHALL display images in the Store_Owner-defined order.
10. WHEN a Variant's stock quantity reaches 0, THE Catalog SHALL mark that Variant as `out_of_stock` and prevent Customers from adding it to a Cart.

---

### Requirement 2: Product Browsing and Discovery

**User Story:** As a Customer, I want to browse, search, and filter clothing products, so that I can find items I want to purchase.

#### Acceptance Criteria

1. THE Catalog SHALL display all Products with `status = active` to Customers, ordered by creation date descending by default.
2. WHEN a Customer submits a search query of 1–100 characters, THE Search_Index SHALL return Products whose name or description matches the query using full-text search.
3. WHEN a Customer applies a category filter, THE Catalog SHALL return only Products belonging to the selected category.
4. WHEN a Customer applies a price range filter (min and/or max), THE Catalog SHALL return only Products whose base price falls within the specified range.
5. WHEN a Customer applies a color filter, THE Catalog SHALL return only Products that have at least one Variant with the specified color.
6. WHEN a Customer applies a size filter, THE Catalog SHALL return only Products that have at least one in-stock Variant with the specified size.
7. THE Catalog SHALL support combining multiple filters simultaneously; THE System SHALL apply all active filters with AND logic.
8. THE Catalog SHALL paginate results in pages of 24 Products; WHEN a Customer requests the next page, THE Catalog SHALL return the next 24 Products matching the current filters.
9. WHEN a Customer views a Product detail page, THE Catalog SHALL display all active Variants grouped by size and color, with out-of-stock Variants visually distinguished.
10. THE Catalog SHALL display the total count of Products matching the current filters.

---

### Requirement 3: Shopping Cart

**User Story:** As a Customer, I want to add products to a cart and manage its contents, so that I can review my selections before purchasing.

#### Acceptance Criteria

1. WHEN a Customer adds a Variant to the Cart, THE Cart SHALL create or increment a Cart_Item for that Variant by the specified quantity (minimum 1).
2. IF a Customer attempts to add a quantity that would cause a Cart_Item's total quantity to exceed the Variant's available stock, THEN THE Cart SHALL cap the quantity at the available stock and notify the Customer.
3. WHEN a Customer updates a Cart_Item's quantity to a positive integer, THE Cart SHALL update the stored quantity.
4. WHEN a Customer updates a Cart_Item's quantity to 0, THE Cart SHALL remove the Cart_Item from the Cart.
5. WHEN a Customer removes a Cart_Item, THE Cart SHALL delete the Cart_Item and recalculate the Cart total.
6. THE Cart SHALL calculate and display the subtotal as the sum of (Variant price × quantity) for all Cart_Items, where Variant price is the price override if set, otherwise the Product base price.
7. WHILE a Customer is authenticated, THE Cart SHALL persist Cart_Items across browser sessions using the Supabase database.
8. WHERE a Customer is unauthenticated, THE Cart SHALL persist Cart_Items in browser localStorage and merge them into the database Cart upon authentication.
9. THE Cart SHALL display the total number of Cart_Items as a badge on the cart icon in the navigation.
10. WHEN a Variant becomes `out_of_stock` after being added to a Cart, THE Cart SHALL display a warning on the affected Cart_Item and prevent checkout until the item is removed or its quantity is adjusted.

---

### Requirement 4: Checkout and Payment

**User Story:** As a Customer, I want to securely check out and pay for my cart, so that I can complete a purchase.

#### Acceptance Criteria

1. WHEN a Customer initiates checkout, THE System SHALL create a Stripe Payment_Intent for the Cart's total amount in the store's configured currency.
2. THE System SHALL present the Stripe payment form (Stripe Elements) to the Customer for card entry; THE System SHALL not store raw card data.
3. WHEN a Customer submits payment and Stripe confirms the Payment_Intent as `succeeded`, THE System SHALL create an Order with status `pending` and decrement each purchased Variant's stock quantity atomically.
4. IF Stripe returns a payment failure, THEN THE System SHALL display the Stripe-provided error message to the Customer and leave the Cart unchanged.
5. WHEN an Order is created, THE System SHALL send a confirmation email to the Customer's registered email address containing the Order ID, itemized Order_Items, and total amount.
6. THE System SHALL validate that all Cart_Items are still in stock at the moment of Payment_Intent creation; IF any Variant is out of stock, THEN THE System SHALL abort checkout and notify the Customer of the specific out-of-stock items.
7. WHEN a Stripe Webhook delivers a `payment_intent.succeeded` event, THE System SHALL idempotently confirm the corresponding Order, ensuring duplicate Webhook deliveries do not create duplicate Orders.
8. WHEN a Stripe Webhook delivers a `payment_intent.payment_failed` event, THE System SHALL update the corresponding Order status to `payment_failed`.
9. THE System SHALL apply Stripe's HTTPS-based webhook signature verification to every incoming Webhook; IF signature verification fails, THEN THE System SHALL reject the request with HTTP 400.
10. WHEN checkout completes successfully, THE System SHALL clear the Customer's Cart.

---

### Requirement 5: Customer Order History

**User Story:** As a Customer, I want to view my past orders and their statuses, so that I can track my purchases.

#### Acceptance Criteria

1. WHILE a Customer is authenticated, THE System SHALL display a list of the Customer's Orders ordered by creation date descending.
2. WHEN a Customer views an Order detail page, THE System SHALL display the Order ID, creation date, status, itemized Order_Items (product name, variant size, variant color, quantity, unit price), and total amount.
3. THE System SHALL display the following Order statuses to Customers: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, `payment_failed`.
4. WHEN a Customer's Order status changes, THE System SHALL update the displayed status within the same page refresh cycle.
5. THE System SHALL paginate the Customer's Order list in pages of 20 Orders.

---

### Requirement 6: Store Owner Order Management

**User Story:** As a Store_Owner, I want to view and manage all customer orders, so that I can fulfill and track them.

#### Acceptance Criteria

1. THE Store_Owner SHALL view a list of all Orders across all Customers, ordered by creation date descending.
2. THE Store_Owner SHALL filter Orders by status, date range, and Customer email.
3. WHEN a Store_Owner updates an Order's status to `confirmed`, `shipped`, or `delivered`, THE System SHALL persist the new status and record the timestamp of the change.
4. WHEN a Store_Owner updates an Order's status to `cancelled`, THE System SHALL restore the stock quantities of all Order_Items to their respective Variants atomically.
5. IF a Store_Owner attempts to set an Order's status to a value not in (`confirmed`, `shipped`, `delivered`, `cancelled`), THEN THE System SHALL reject the update and return a descriptive error.
6. THE Store_Owner SHALL view an Order detail page showing all Order_Items, Customer email, shipping address, payment status, and Stripe Payment_Intent ID.
7. THE System SHALL paginate the Store_Owner's Order list in pages of 50 Orders.
8. THE Store_Owner SHALL export the filtered Order list as a CSV file containing Order ID, Customer email, status, total amount, and creation date.

---

### Requirement 7: Inventory Management

**User Story:** As a Store_Owner, I want to manage stock levels for each product variant, so that I can prevent overselling.

#### Acceptance Criteria

1. THE Store_Owner SHALL update the stock quantity of any Variant to any non-negative integer.
2. WHEN a stock quantity update is saved, THE Catalog SHALL immediately reflect the updated availability for that Variant.
3. THE System SHALL display a low-stock warning on the Store_Owner's product management view for any Variant with a stock quantity between 1 and 5 inclusive.
4. THE System SHALL display an out-of-stock indicator for any Variant with a stock quantity of 0.
5. WHEN multiple Customers attempt to purchase the last unit of a Variant concurrently, THE System SHALL use a database-level atomic decrement to ensure the stock quantity never falls below 0.
6. THE Store_Owner SHALL view an inventory summary page listing all Variants with their current stock quantities, sortable by stock level ascending or descending.

---

### Requirement 8: Authentication and Authorization

**User Story:** As a Store_Owner or Customer, I want access to be properly controlled, so that only authorized users can perform privileged actions.

#### Acceptance Criteria

1. THE System SHALL use the existing Supabase authentication session to identify authenticated users.
2. WHEN an unauthenticated user attempts to access the checkout flow, THE System SHALL redirect the user to the login page and return the user to the checkout flow after successful authentication.
3. WHEN an unauthenticated user attempts to access any Store_Owner management route (products, orders, inventory), THE System SHALL return HTTP 403.
4. WHEN an authenticated Customer attempts to access any Store_Owner management route, THE System SHALL return HTTP 403.
5. THE System SHALL enforce Row Level Security (RLS) policies in Supabase so that Customers can only read their own Orders and Cart_Items.
6. THE System SHALL identify the Store_Owner by a designated `role = 'store_owner'` value stored in the existing `profiles` table.
7. IF an unauthenticated user accesses the Catalog or Product detail pages, THE System SHALL display the full Catalog without requiring authentication.

---

### Requirement 9: Image Management

**User Story:** As a Store_Owner, I want to upload and manage product images, so that Customers can see what they are buying.

#### Acceptance Criteria

1. THE Store_Owner SHALL upload product images via a drag-and-drop or file-picker interface.
2. WHEN an image is uploaded, THE Image_Storage SHALL store the image in a Supabase Storage bucket and return a permanent public URL.
3. THE System SHALL generate and display a thumbnail preview of each uploaded image before the Product is saved.
4. WHEN a Store_Owner deletes an image from a Product, THE Image_Storage SHALL remove the image file from the storage bucket.
5. THE System SHALL accept images in JPEG, PNG, and WebP formats with a maximum file size of 5 MB per image.

---

## Correctness Properties for Property-Based Testing

The following properties define invariants and round-trip behaviors that MUST hold across all valid inputs and are suitable for property-based testing.

### P1: Cart Subtotal Invariant

FOR ALL Carts with one or more Cart_Items, THE Cart's displayed subtotal SHALL equal the sum of (effective_price(variant) × quantity) for every Cart_Item, where effective_price is the Variant's price override if non-null, otherwise the Product's base price.

*Testing approach*: Generate arbitrary collections of Cart_Items with random quantities and prices; assert the computed subtotal matches the sum formula for every generated collection.

### P2: Stock Decrement Atomicity Invariant

FOR ALL completed Orders, the sum of quantities purchased for a given Variant across all Orders with status in (`pending`, `confirmed`, `shipped`, `delivered`) SHALL never exceed the Variant's original stock quantity at the time the Variant was created or last manually updated by the Store_Owner.

*Testing approach*: Simulate concurrent checkout attempts for the same Variant; assert the final stock quantity is always ≥ 0 and equals (initial_stock − total_units_sold).

### P3: Order Total Round-Trip

FOR ALL Orders, THE Order's stored total_amount SHALL equal the Cart subtotal computed from the Order_Items at the time of Order creation, and re-computing the total from the Order_Items SHALL always reproduce the stored total_amount.

*Testing approach*: Generate arbitrary Order_Items with random prices and quantities; assert that summing Order_Items reproduces the stored total.

### P4: Cart Merge Idempotence

WHEN an unauthenticated Customer's localStorage Cart is merged into the database Cart upon authentication, performing the merge operation more than once SHALL produce the same Cart state as performing it exactly once.

*Testing approach*: Apply the merge function twice with the same localStorage Cart and database Cart; assert the resulting Cart is identical to a single merge application.

### P5: Filter Conjunction Invariant

FOR ALL combinations of active catalog filters (category, price range, color, size), every Product returned by THE Catalog SHALL satisfy ALL active filter predicates simultaneously, and no Product satisfying all predicates SHALL be absent from the result set.

*Testing approach*: Generate arbitrary filter combinations and a product dataset; assert that the filtered result set equals the set of products satisfying all predicates when evaluated independently.

### P6: Webhook Idempotency

FOR ALL `payment_intent.succeeded` Webhook events delivered with the same Payment_Intent ID, THE System SHALL produce exactly one Order regardless of how many times the Webhook is delivered.

*Testing approach*: Deliver the same Webhook payload N times (N ≥ 2); assert that exactly one Order exists for the given Payment_Intent ID after all deliveries.

### P7: Stock Non-Negativity Invariant

FOR ALL Variants, the stock quantity SHALL always be a non-negative integer; no sequence of valid Cart additions, checkouts, or cancellations SHALL cause the stock quantity to become negative.

*Testing approach*: Generate sequences of add-to-cart and checkout operations against a Variant with bounded initial stock; assert stock ≥ 0 after every operation in the sequence.

### P8: Order Cancellation Stock Restoration

FOR ALL Orders cancelled by the Store_Owner, the stock quantity of each Variant in the Order SHALL be restored such that: restored_stock = stock_before_cancellation + order_item_quantity, and the sum of all in-flight Order_Item quantities plus current stock SHALL equal the original stock at the time of last manual update.

*Testing approach*: Create an Order, record stock levels, cancel the Order, assert each Variant's stock increased by exactly the cancelled quantity.

---

### Requirement 10: Google OAuth Authentication

**User Story:** As a Customer or Store Owner, I want to sign in and sign up using my Google account, so that I can access the platform without managing a separate password.

#### Acceptance Criteria

1. THE System SHALL provide a "Continue with Google" button on both the login and signup pages.
2. WHEN a user clicks "Continue with Google", THE System SHALL initiate a Supabase OAuth flow with Google as the provider.
3. WHEN Google authentication succeeds and the user is new, THE System SHALL automatically create a `profiles` row with `role = 'customer'` and populate `email` and `full_name` from the Google account data.
4. WHEN Google authentication succeeds and the user already exists, THE System SHALL sign the user in and redirect them to their intended destination (or `/dashboard` for store owners, `/shop` for customers).
5. WHEN a guest user with items in their localStorage cart authenticates via Google, THE System SHALL trigger the cart merge flow (Requirement 3.8) immediately after authentication.
6. THE System SHALL handle OAuth errors (e.g. user cancels Google consent) gracefully and display a descriptive error message on the auth page.
7. THE auth callback route (`/auth/callback`) SHALL exchange the OAuth code for a Supabase session and set the session cookie before redirecting.
