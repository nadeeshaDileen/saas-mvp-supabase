/**
 * Centralized, type-safe query keys
 * Prevents typos and makes cache invalidation predictable
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    session: ["auth", "session"] as const,
    user: ["auth", "user"] as const,
  },
  profile: {
    all: ["profile"] as const,
    current: ["profile", "current"] as const,
    byId: (id: string) => ["profile", id] as const,
  },
  organizations: {
    all: ["organizations"] as const,
    my: ["organizations", "my"] as const,
    byId: (id: string) => ["organizations", id] as const,
    members: (orgId: string) => ["organizations", orgId, "members"] as const,
  },
  subscriptions: {
    all: ["subscriptions"] as const,
    current: ["subscriptions", "current"] as const,
    plans: ["subscriptions", "plans"] as const,
  },
  billing: {
    all: ["billing"] as const,
    invoices: ["billing", "invoices"] as const,
    paymentMethods: ["billing", "payment-methods"] as const,
  },
  // ── Store ──────────────────────────────────────────────────────────────────
  products: {
    all: ["products"] as const,
    list: (filters: Record<string, unknown>) => ["products", "list", filters] as const,
    detail: (slug: string) => ["products", "detail", slug] as const,
    adminList: ["products", "admin", "list"] as const,
  },
  variants: {
    all: ["variants"] as const,
    byProduct: (productId: string) => ["variants", productId] as const,
  },
  cart: {
    all: ["cart"] as const,
    items: ["cart", "items"] as const,
  },
  orders: {
    all: ["orders"] as const,
    mine: ["orders", "mine"] as const,
    detail: (id: string) => ["orders", id] as const,
    adminList: (filters: Record<string, unknown>) =>
      ["orders", "admin", "list", filters] as const,
  },
  inventory: {
    all: ["inventory"] as const,
    list: ["inventory", "list"] as const,
  },
} as const;
