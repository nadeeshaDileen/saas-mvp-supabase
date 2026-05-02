import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query/query-keys";
import { longCacheOptions } from "@/lib/react-query/query-options";
import type { Variant } from "@/types/store";

export interface InventoryRow extends Variant {
  productName: string;
  productSlug: string;
}

/**
 * All variants joined with product name for inventory management
 */
export function useInventory(sortByStock: "asc" | "desc" = "asc") {
  return useQuery({
    queryKey: [...queryKeys.inventory.list, sortByStock],
    queryFn: async (): Promise<InventoryRow[]> => {
      const { data, error } = await supabase
        .from("variants")
        .select("*, product:products(name, slug)")
        .order("stock", { ascending: sortByStock === "asc" });

      if (error) throw new Error(error.message);

      return (data ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        const product = r.product as Record<string, unknown> | null;
        return {
          id: r.id as string,
          productId: r.product_id as string,
          size: r.size as Variant["size"],
          color: r.color as string,
          priceOverride: r.price_override as number | null,
          stock: r.stock as number,
          createdAt: r.created_at as string,
          updatedAt: r.updated_at as string,
          productName: (product?.name as string) ?? "",
          productSlug: (product?.slug as string) ?? "",
        };
      });
    },
    ...longCacheOptions,
  });
}

/**
 * Update a variant's stock quantity
 */
export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ variantId, stock }: { variantId: string; stock: number }) => {
      if (stock < 0) throw new Error("Stock cannot be negative");
      const { error } = await supabase
        .from("variants")
        .update({ stock, updated_at: new Date().toISOString() })
        .eq("id", variantId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
