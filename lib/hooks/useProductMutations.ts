"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query/query-keys";
import type { ProductFormValues, ProductWithVariants } from "@/types/store";

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (values: ProductFormValues): Promise<string> => {
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: values.name,
          slug: values.slug,
          description: values.description,
          base_price: values.basePrice,
          category: values.category,
          status: values.status,
          images: values.images as unknown as import("@/types/database").Json,
        })
        .select("id")
        .single();

      if (productError) throw new Error(productError.message);

      if (values.variants.length > 0) {
        const { error: variantError } = await supabase.from("variants").insert(
          values.variants.map((v) => ({
            product_id: product.id,
            size: v.size,
            color: v.color,
            stock: v.stock,
            price_override: v.priceOverride ?? null,
          }))
        );
        if (variantError) throw new Error(variantError.message);
      }

      return product.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      values,
      deletedVariantIds = [],
    }: {
      id: string;
      values: ProductFormValues;
      deletedVariantIds?: string[];
    }): Promise<void> => {
      const { error: productError } = await supabase
        .from("products")
        .update({
          name: values.name,
          slug: values.slug,
          description: values.description,
          base_price: values.basePrice,
          category: values.category,
          status: values.status,
          images: values.images as unknown as import("@/types/database").Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (productError) throw new Error(productError.message);

      // Delete removed variants
      if (deletedVariantIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("variants")
          .delete()
          .in("id", deletedVariantIds);
        if (deleteError) throw new Error(deleteError.message);
      }

      // Upsert remaining variants
      for (const v of values.variants) {
        if (v.id) {
          const { error } = await supabase
            .from("variants")
            .update({
              size: v.size,
              color: v.color,
              stock: v.stock,
              price_override: v.priceOverride ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", v.id);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await supabase.from("variants").insert({
            product_id: id,
            size: v.size,
            color: v.color,
            stock: v.stock,
            price_override: v.priceOverride ?? null,
          });
          if (error) throw new Error(error.message);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string): Promise<void> => {
      // Guard: check no orders reference variants of this product
      const { data: variants } = await supabase
        .from("variants")
        .select("id")
        .eq("product_id", productId);

      const variantIds = (variants ?? []).map((v) => v.id);

      if (variantIds.length > 0) {
        const { count } = await supabase
          .from("order_items")
          .select("id", { count: "exact", head: true })
          .in("variant_id", variantIds);

        if ((count ?? 0) > 0) {
          throw new Error("Cannot delete a product that has existing orders.");
        }
      }

      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

// ─── Toggle status ────────────────────────────────────────────────────────────

export function useToggleProductStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (product: Pick<ProductWithVariants, "id" | "status">): Promise<void> => {
      const newStatus = product.status === "active" ? "archived" : "active";
      const { error } = await supabase
        .from("products")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", product.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
