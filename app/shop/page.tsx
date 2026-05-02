"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/features/shop/SearchBar";
import { ProductFilters } from "@/components/features/shop/ProductFilters";
import { ProductGrid } from "@/components/features/shop/ProductGrid";
import { useProducts } from "@/lib/hooks/useProducts";
import type { CatalogFilters } from "@/types/store";
import type { VariantSize } from "@/types/database";

function parseFiltersFromParams(params: URLSearchParams): CatalogFilters {
  const search = params.get("search") ?? undefined;
  const category = params.get("category") ?? undefined;
  const minPrice = params.get("minPrice") ? Number(params.get("minPrice")) : undefined;
  const maxPrice = params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined;
  const sizesRaw = params.get("sizes");
  const sizes = sizesRaw
    ? (sizesRaw.split(",").filter(Boolean) as VariantSize[])
    : undefined;
  const colorsRaw = params.get("colors");
  const colors = colorsRaw ? colorsRaw.split(",").filter(Boolean) : undefined;
  const page = params.get("page") ? Number(params.get("page")) : 1;

  return { search, category, minPrice, maxPrice, sizes, colors, page };
}

function filtersToParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sizes?.length) params.set("sizes", filters.sizes.join(","));
  if (filters.colors?.length) params.set("colors", filters.colors.join(","));
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = parseFiltersFromParams(searchParams);
  const { data, isLoading } = useProducts(filters);

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const page = filters.page ?? 1;

  function handleFiltersChange(next: CatalogFilters) {
    router.push(`/shop?${filtersToParams(next).toString()}`);
  }

  function handleSearchChange(value: string) {
    handleFiltersChange({ ...filters, search: value || undefined, page: 1 });
  }

  function handlePageChange(nextPage: number) {
    handleFiltersChange({ ...filters, page: nextPage });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Shop</h1>

      {/* Search */}
      <div className="mb-6">
        <SearchBar value={filters.search ?? ""} onChange={handleSearchChange} />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar filters */}
        <aside className="w-full lg:w-56 shrink-0">
          <ProductFilters filters={filters} onChange={handleFiltersChange} />
        </aside>

        {/* Product grid */}
        <main className="flex-1 min-w-0">
          <ProductGrid
            products={products}
            total={total}
            page={page}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        </main>
      </div>
    </div>
  );
}
