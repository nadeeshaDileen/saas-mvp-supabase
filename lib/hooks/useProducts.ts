import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query/query-keys";
import { longCacheOptions } from "@/lib/react-query/query-options";
import type { CatalogFilters, Product, ProductWithVariants, Variant } from "@/types/store";
import type { ImageMeta } from "@/types/store";

const PAGE_SIZE = 24;

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string,
    basePrice: row.base_price as number,
    category: row.category as string,
    status: row.status as Product["status"],
    images: (row.images as ImageMeta[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapVariant(row: Record<string, unknown>): Variant {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    size: row.size as Variant["size"],
    color: row.color as string,
    priceOverride: row.price_override as number | null,
    stock: row.stock as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Paginated public catalog with filters
 */
export function useProducts(filters: CatalogFilters = {}) {
  const { search, category, minPrice, maxPrice, colors, sizes, page = 1 } = filters;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  return useQuery({
    queryKey: queryKeys.products.list(filters as Record<string, unknown>),
    queryFn: async (): Promise<{ products: Product[]; total: number }> => {
      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search) {
        query = query.textSearch("search_vector", search, { type: "websearch" });
      }
      if (category) {
        query = query.eq("category", category);
      }
      if (minPrice !== undefined) {
        query = query.gte("base_price", minPrice);
      }
      if (maxPrice !== undefined) {
        query = query.lte("base_price", maxPrice);
      }

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      let products = (data ?? []).map((r) => mapProduct(r as Record<string, unknown>));

      // Client-side color/size filter (requires variant join — done post-fetch for MVP)
      if (colors?.length || sizes?.length) {
        const productIds = products.map((p) => p.id);
        if (productIds.length > 0) {
          let variantQuery = supabase
            .from("variants")
            .select("product_id, color, size, stock")
            .in("product_id", productIds);

          const { data: variantData } = await variantQuery;
          const variants = (variantData ?? []) as Array<{
            product_id: string;
            color: string;
            size: string;
            stock: number;
          }>;

          products = products.filter((p) => {
            const pVariants = variants.filter((v) => v.product_id === p.id);
            const colorMatch = !colors?.length || pVariants.some((v) => colors.includes(v.color));
            const sizeMatch =
              !sizes?.length ||
              pVariants.some((v) => sizes.includes(v.size as Variant["size"]) && v.stock > 0);
            return colorMatch && sizeMatch;
          });
        }
      }

      return { products, total: count ?? 0 };
    },
    ...longCacheOptions,
  });
}

/**
 * Single product with all variants (public)
 */
export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: async (): Promise<ProductWithVariants | null> => {
      const { data: productData, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .single();

      if (error) return null;

      const { data: variantData } = await supabase
        .from("variants")
        .select("*")
        .eq("product_id", productData.id)
        .order("size");

      return {
        ...mapProduct(productData as Record<string, unknown>),
        variants: (variantData ?? []).map((v) => mapVariant(v as Record<string, unknown>)),
      };
    },
    enabled: !!slug,
    ...longCacheOptions,
  });
}

/**
 * All products for owner dashboard (no status filter)
 */
export function useAdminProducts() {
  return useQuery({
    queryKey: queryKeys.products.adminList,
    queryFn: async (): Promise<ProductWithVariants[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, variants(*)")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      return (data ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          ...mapProduct(r),
          variants: ((r.variants as Record<string, unknown>[]) ?? []).map(mapVariant),
        };
      });
    },
    ...longCacheOptions,
  });
}
