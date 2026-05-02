"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query/query-keys";
import { ProductForm } from "@/components/features/dashboard/products/ProductForm";
import type { ProductWithVariants, Variant } from "@/types/store";
import type { ImageMeta } from "@/types/store";

function mapProduct(row: Record<string, unknown>): ProductWithVariants {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string,
    basePrice: row.base_price as number,
    category: row.category as string,
    status: row.status as ProductWithVariants["status"],
    images: (row.images as ImageMeta[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    variants: ((row.variants as Record<string, unknown>[]) ?? []).map(
      (v): Variant => ({
        id: v.id as string,
        productId: v.product_id as string,
        size: v.size as Variant["size"],
        color: v.color as string,
        priceOverride: v.price_override as number | null,
        stock: v.stock as number,
        createdAt: v.created_at as string,
        updatedAt: v.updated_at as string,
      })
    ),
  };
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: product, isLoading, error } = useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: async (): Promise<ProductWithVariants | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, variants(*)")
        .eq("id", id)
        .single();
      if (error) return null;
      return mapProduct(data as Record<string, unknown>);
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Product not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Product</h1>
        <p className="text-sm text-muted-foreground mt-1">{product.name}</p>
      </div>
      <ProductForm product={product} onSuccess={() => router.push("/dashboard/products")} />
    </div>
  );
}
