import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useAuthSession } from "@/hooks/queries/useAuth";
import type { CartItem, GuestCartItem } from "@/types/store";

const GUEST_CART_KEY = "falcky_guest_cart";

// ─── Guest cart helpers ───────────────────────────────────────────────────────

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function setGuestCart(items: GuestCartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Current cart — DB for authenticated users, localStorage for guests
 */
export function useCart() {
  const { data: session } = useAuthSession();
  const isAuth = session?.isAuthenticated ?? false;

  return useQuery({
    queryKey: queryKeys.cart.items,
    queryFn: async (): Promise<CartItem[]> => {
      if (!isAuth) {
        // Return guest cart items (no variant details for now)
        return getGuestCart().map((g) => ({
          id: g.variantId,
          userId: "",
          variantId: g.variantId,
          quantity: g.quantity,
          createdAt: "",
          updatedAt: "",
        }));
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          *,
          variant:variants(
            *,
            product:products(id, name, slug, base_price, images)
          )
        `
        )
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);

      return (data ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        const variant = r.variant as Record<string, unknown> | null;
        const product = variant?.product as Record<string, unknown> | null;
        return {
          id: r.id as string,
          userId: r.user_id as string,
          variantId: r.variant_id as string,
          quantity: r.quantity as number,
          createdAt: r.created_at as string,
          updatedAt: r.updated_at as string,
          variant: variant
            ? {
                id: variant.id as string,
                productId: variant.product_id as string,
                size: variant.size as CartItem["variant"]["size"],
                color: variant.color as string,
                priceOverride: variant.price_override as number | null,
                stock: variant.stock as number,
                createdAt: variant.created_at as string,
                updatedAt: variant.updated_at as string,
                product: product
                  ? {
                      id: product.id as string,
                      name: product.name as string,
                      slug: product.slug as string,
                      description: "",
                      basePrice: product.base_price as number,
                      category: "",
                      status: "active" as const,
                      images: (product.images as CartItem["variant"]["product"]["images"]) ?? [],
                      createdAt: "",
                      updatedAt: "",
                    }
                  : undefined,
              }
            : undefined,
        };
      });
    },
    staleTime: 30 * 1000, // 30s — cart should be fairly fresh
  });
}

/**
 * Add or increment a cart item
 */
export function useAddToCart() {
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();

  return useMutation({
    mutationFn: async ({
      variantId,
      quantity,
      availableStock,
    }: {
      variantId: string;
      quantity: number;
      availableStock: number;
    }) => {
      if (!session?.isAuthenticated) {
        // Guest cart
        const cart = getGuestCart();
        const existing = cart.find((i) => i.variantId === variantId);
        const newQty = Math.min((existing?.quantity ?? 0) + quantity, availableStock);
        if (existing) {
          existing.quantity = newQty;
        } else {
          cart.push({ variantId, quantity: newQty });
        }
        setGuestCart(cart);
        return;
      }

      // Fetch current quantity to enforce stock cap
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("variant_id", variantId)
        .maybeSingle();

      const currentQty = (existing?.quantity as number) ?? 0;
      const newQty = Math.min(currentQty + quantity, availableStock);

      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from("cart_items").upsert(
        {
          user_id: session.user.id,
          variant_id: variantId,
          quantity: newQty,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,variant_id" }
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}

/**
 * Update cart item quantity (0 = remove)
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();

  return useMutation({
    mutationFn: async ({ itemId, variantId, quantity }: { itemId: string; variantId: string; quantity: number }) => {
      if (!session?.isAuthenticated) {
        const cart = getGuestCart();
        if (quantity <= 0) {
          setGuestCart(cart.filter((i) => i.variantId !== variantId));
        } else {
          const item = cart.find((i) => i.variantId === variantId);
          if (item) item.quantity = quantity;
          setGuestCart(cart);
        }
        return;
      }

      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity, updated_at: new Date().toISOString() })
          .eq("id", itemId);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}

/**
 * Remove a cart item
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();

  return useMutation({
    mutationFn: async ({ itemId, variantId }: { itemId: string; variantId: string }) => {
      if (!session?.isAuthenticated) {
        setGuestCart(getGuestCart().filter((i) => i.variantId !== variantId));
        return;
      }
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}

/**
 * Merge localStorage guest cart into DB on login (idempotent upsert)
 */
export function useMergeGuestCart() {
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();

  return useMutation({
    mutationFn: async () => {
      const guestItems = getGuestCart();
      if (!guestItems.length) return;

      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      for (const item of guestItems) {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("variant_id", item.variantId)
          .maybeSingle();

        const mergedQty = Math.max((existing?.quantity as number) ?? 0, item.quantity);

        await supabase.from("cart_items").upsert(
          {
            user_id: session.user.id,
            variant_id: item.variantId,
            quantity: mergedQty,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,variant_id" }
        );
      }

      clearGuestCart();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}
