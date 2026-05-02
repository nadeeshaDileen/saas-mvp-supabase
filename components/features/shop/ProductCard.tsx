"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/store";

interface ProductCardProps {
  product: Product;
  isOutOfStock?: boolean;
}

export function ProductCard({ product, isOutOfStock = false }: ProductCardProps) {
  const firstImage = product.images
    .slice()
    .sort((a, b) => a.order - b.order)[0];

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.basePrice);

  const categoryLabel =
    product.category.charAt(0).toUpperCase() +
    product.category.slice(1).toLowerCase();

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm overflow-hidden transition-shadow group-hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-3/4 bg-muted overflow-hidden">
          {firstImage ? (
            <Image
              src={firstImage.url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={cn(
                "object-cover transition-transform duration-300 group-hover:scale-105",
                isOutOfStock && "opacity-60"
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}

          {/* Out-of-stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800">
                Out of stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-tight line-clamp-2 flex-1">
              {product.name}
            </p>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {categoryLabel}
            </Badge>
          </div>
          <p className="text-sm font-semibold">{formattedPrice}</p>
        </div>
      </div>
    </Link>
  );
}
