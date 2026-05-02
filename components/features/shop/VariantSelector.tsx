"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Variant } from "@/types/store";
import type { VariantSize } from "@/types/database";

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}

const SIZE_ORDER: VariantSize[] = ["XS", "S", "M", "L", "XL", "XXL"];

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) {
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;

  // Unique sizes, ordered
  const availableSizes = SIZE_ORDER.filter((size) =>
    variants.some((v) => v.size === size)
  );

  // For a given size, is there at least one in-stock variant?
  function isSizeInStock(size: VariantSize) {
    return variants.some((v) => v.size === size && v.stock > 0);
  }

  // Colors available for the selected size (or all colors if no size selected)
  const colorsForSelectedSize: string[] = React.useMemo(() => {
    const base = selectedVariant
      ? variants.filter((v) => v.size === selectedVariant.size)
      : variants;
    return [...new Set(base.map((v) => v.color))];
  }, [variants, selectedVariant]);

  function isColorInStock(color: string) {
    const size = selectedVariant?.size;
    if (size) {
      return variants.some((v) => v.size === size && v.color === color && v.stock > 0);
    }
    return variants.some((v) => v.color === color && v.stock > 0);
  }

  function handleSizeClick(size: VariantSize) {
    // If same size already selected, try to keep color; otherwise pick first in-stock
    const currentColor = selectedVariant?.color;
    const match =
      variants.find((v) => v.size === size && v.color === currentColor && v.stock > 0) ??
      variants.find((v) => v.size === size && v.stock > 0) ??
      variants.find((v) => v.size === size);
    if (match) onSelect(match.id);
  }

  function handleColorClick(color: string) {
    const size = selectedVariant?.size;
    const match = size
      ? (variants.find((v) => v.size === size && v.color === color && v.stock > 0) ??
         variants.find((v) => v.size === size && v.color === color))
      : (variants.find((v) => v.color === color && v.stock > 0) ??
         variants.find((v) => v.color === color));
    if (match) onSelect(match.id);
  }

  const effectivePrice = selectedVariant
    ? (selectedVariant.priceOverride ?? null)
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Size selector */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Size{selectedVariant ? `: ${selectedVariant.size}` : ""}
        </span>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((size) => {
            const inStock = isSizeInStock(size);
            const isSelected = selectedVariant?.size === size;
            return (
              <button
                key={size}
                type="button"
                disabled={!inStock}
                onClick={() => handleSizeClick(size)}
                className={cn(
                  "min-w-10 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : inStock
                    ? "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    : "border-input bg-muted text-muted-foreground cursor-not-allowed line-through opacity-50"
                )}
                aria-pressed={isSelected}
                aria-label={`Size ${size}${!inStock ? " (out of stock)" : ""}`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color selector */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Color{selectedVariant ? `: ${selectedVariant.color}` : ""}
        </span>
        <div className="flex flex-wrap gap-2">
          {colorsForSelectedSize.map((color) => {
            const inStock = isColorInStock(color);
            const isSelected = selectedVariant?.color === color;
            return (
              <button
                key={color}
                type="button"
                disabled={!inStock}
                onClick={() => handleColorClick(color)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors capitalize",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : inStock
                    ? "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    : "border-input bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                )}
                aria-pressed={isSelected}
                aria-label={`Color ${color}${!inStock ? " (out of stock)" : ""}`}
              >
                {color}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected variant info */}
      {selectedVariant && (
        <div className="flex items-center gap-4 text-sm">
          {effectivePrice !== null && (
            <span className="font-semibold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(effectivePrice)}
              <span className="text-muted-foreground font-normal ml-1">(variant price)</span>
            </span>
          )}
          <span className="text-muted-foreground">
            {selectedVariant.stock > 0
              ? `${selectedVariant.stock} in stock`
              : "Out of stock"}
          </span>
        </div>
      )}
    </div>
  );
}
