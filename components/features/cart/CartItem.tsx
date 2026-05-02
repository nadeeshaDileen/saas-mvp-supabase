"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateCartItem, useRemoveCartItem } from "@/lib/hooks/useCart";
import type { CartItem as CartItemType } from "@/types/store";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const variant = item.variant;
  const product = variant?.product;

  const effectivePrice = variant?.priceOverride ?? product?.basePrice ?? 0;
  const lineTotal = effectivePrice * item.quantity;
  const isOutOfStock = variant?.stock === 0;

  const firstImage = product?.images?.[0]?.url ?? null;

  function handleDecrement() {
    updateItem.mutate({ itemId: item.id, variantId: item.variantId, quantity: item.quantity - 1 });
  }

  function handleIncrement() {
    updateItem.mutate({ itemId: item.id, variantId: item.variantId, quantity: item.quantity + 1 });
  }

  function handleRemove() {
    removeItem.mutate({ itemId: item.id, variantId: item.variantId });
  }

  return (
    <div className="flex flex-col gap-2 py-4 border-b last:border-b-0">
      {isOutOfStock && (
        <div className="rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
          This item is out of stock and will be removed at checkout.
        </div>
      )}
      <div className="flex gap-3">
        {/* Product image */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
          {firstImage ? (
            <Image src={firstImage} alt={product?.name ?? "Product"} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <p className="truncate text-sm font-medium">{product?.name ?? "Unknown product"}</p>
          <p className="text-xs text-muted-foreground">
            {variant?.size} · {variant?.color}
          </p>
          <p className="text-sm font-semibold">${lineTotal.toFixed(2)}</p>
        </div>

        {/* Remove */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={handleRemove}
          disabled={removeItem.isPending}
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-2 self-end">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={handleDecrement}
          disabled={updateItem.isPending}
          aria-label="Decrease quantity"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={handleIncrement}
          disabled={updateItem.isPending || isOutOfStock}
          aria-label="Increase quantity"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
