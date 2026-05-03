"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
    >
      <div className="space-y-3">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {firstImage ? (
            <Image
              src={firstImage.url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={cn(
                "object-cover transition-transform duration-500 group-hover:scale-105",
                isOutOfStock && "opacity-40"
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">No image</span>
            </div>
          )}

          {/* Out-of-stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-4 py-1.5 text-xs font-medium uppercase tracking-wider">
                Out of stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-wide line-clamp-1">
            {product.name}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{formattedPrice}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {product.category}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
