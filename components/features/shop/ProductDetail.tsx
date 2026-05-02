"use client";

import * as React from "react";
import Image from "next/image";
import { ShoppingCart, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VariantSelector } from "./VariantSelector";
import { useAddToCart } from "@/lib/hooks/useCart";
import { cn } from "@/lib/utils";
import type { ProductWithVariants, Variant } from "@/types/store";

const LOW_STOCK_THRESHOLD = 5;

interface ProductDetailProps {
  product: ProductWithVariants;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [addedFeedback, setAddedFeedback] = React.useState(false);

  const addToCart = useAddToCart();

  // Sort images by order
  const sortedImages = React.useMemo(
    () => [...product.images].sort((a, b) => a.order - b.order),
    [product.images]
  );

  const selectedVariant: Variant | null =
    product.variants.find((v) => v.id === selectedVariantId) ?? null;

  const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : false;
  const isLowStock =
    selectedVariant !== null &&
    selectedVariant.stock > 0 &&
    selectedVariant.stock <= LOW_STOCK_THRESHOLD;

  const effectivePrice = selectedVariant?.priceOverride ?? product.basePrice;

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(effectivePrice);

  const categoryLabel =
    product.category.charAt(0).toUpperCase() +
    product.category.slice(1).toLowerCase();

  async function handleAddToCart() {
    if (!selectedVariant || isOutOfStock) return;
    await addToCart.mutateAsync({
      variantId: selectedVariant.id,
      quantity: 1,
      availableStock: selectedVariant.stock,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Image gallery */}
      <div className="flex flex-col gap-3">
        {/* Main image */}
        <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-muted">
          {sortedImages[activeImageIndex] ? (
            <Image
              src={sortedImages[activeImageIndex].url}
              alt={`${product.name} — image ${activeImageIndex + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority={activeImageIndex === 0}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {sortedImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sortedImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                  idx === activeImageIndex
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground"
                )}
                aria-label={`View image ${idx + 1}`}
                aria-pressed={idx === activeImageIndex}
              >
                <Image
                  src={img.url}
                  alt={`${product.name} thumbnail ${idx + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit">
            {categoryLabel}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-2xl font-semibold">{formattedPrice}</p>
        </div>

        {product.description && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Variant selector */}
        {product.variants.length > 0 && (
          <VariantSelector
            variants={product.variants}
            selectedVariantId={selectedVariantId}
            onSelect={setSelectedVariantId}
          />
        )}

        {/* Low stock warning */}
        {isLowStock && (
          <div className="flex items-center gap-2 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Only {selectedVariant!.stock} left in stock — order soon!
          </div>
        )}

        {/* Add to cart */}
        <Button
          size="lg"
          onClick={handleAddToCart}
          disabled={
            !selectedVariantId ||
            isOutOfStock ||
            addToCart.isPending
          }
          className="w-full"
        >
          <ShoppingCart className="h-4 w-4" />
          {addedFeedback
            ? "Added!"
            : isOutOfStock
            ? "Out of stock"
            : !selectedVariantId
            ? "Select a variant"
            : addToCart.isPending
            ? "Adding…"
            : "Add to cart"}
        </Button>

        {addToCart.isError && (
          <p className="text-destructive text-sm">
            Failed to add to cart. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
