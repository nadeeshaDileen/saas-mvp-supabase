"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CatalogFilters } from "@/types/store";
import type { VariantSize } from "@/types/database";

const CATEGORIES = [
  "TOPS",
  "BOTTOMS",
  "DRESSES",
  "OUTERWEAR",
  "ACCESSORIES",
  "FOOTWEAR",
  "OTHER",
] as const;

const SIZES: VariantSize[] = ["XS", "S", "M", "L", "XL", "XXL"];

interface ProductFiltersProps {
  filters: CatalogFilters;
  onChange: (filters: CatalogFilters) => void;
  className?: string;
}

export function ProductFilters({ filters, onChange, className }: ProductFiltersProps) {
  const [colorInput, setColorInput] = React.useState(
    filters.colors?.join(", ") ?? ""
  );

  // Sync color input when filters reset externally
  React.useEffect(() => {
    setColorInput(filters.colors?.join(", ") ?? "");
  }, [filters.colors]);

  function update(patch: Partial<CatalogFilters>) {
    onChange({ ...filters, ...patch, page: 1 });
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    update({ category: e.target.value || undefined });
  }

  function handleMinPrice(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value === "" ? undefined : Number(e.target.value);
    update({ minPrice: val });
  }

  function handleMaxPrice(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value === "" ? undefined : Number(e.target.value);
    update({ maxPrice: val });
  }

  function handleSizeToggle(size: VariantSize) {
    const current = filters.sizes ?? [];
    const next = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    update({ sizes: next.length ? next : undefined });
  }

  function handleColorBlur() {
    const colors = colorInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    update({ colors: colors.length ? colors : undefined });
  }

  function handleClearAll() {
    setColorInput("");
    onChange({ page: 1 });
  }

  const hasActiveFilters =
    !!filters.category ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    (filters.sizes?.length ?? 0) > 0 ||
    (filters.colors?.length ?? 0) > 0;

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="filter-category">
          Category
        </label>
        <select
          id="filter-category"
          value={filters.category ?? ""}
          onChange={handleCategoryChange}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Price range</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            min={0}
            value={filters.minPrice ?? ""}
            onChange={handleMinPrice}
            className="w-full"
            aria-label="Minimum price"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="number"
            placeholder="Max"
            min={0}
            value={filters.maxPrice ?? ""}
            onChange={handleMaxPrice}
            className="w-full"
            aria-label="Maximum price"
          />
        </div>
      </div>

      {/* Sizes */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Size</span>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => {
            const active = filters.sizes?.includes(size) ?? false;
            return (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeToggle(size)}
                className={cn(
                  "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                )}
                aria-pressed={active}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="filter-color">
          Color
        </label>
        <Input
          id="filter-color"
          type="text"
          placeholder="e.g. red, blue, black"
          value={colorInput}
          onChange={(e) => setColorInput(e.target.value)}
          onBlur={handleColorBlur}
          aria-label="Filter by color (comma-separated)"
        />
        <p className="text-muted-foreground text-xs">Comma-separated values</p>
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={handleClearAll}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}
