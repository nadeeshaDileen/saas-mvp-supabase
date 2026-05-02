"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/types/store";

interface CartSummaryProps {
  items: CartItem[];
  onCheckout?: () => void;
}

export function CartSummary({ items, onCheckout }: CartSummaryProps) {
  const subtotal = items.reduce((sum, item) => {
    const effectivePrice = item.variant?.priceOverride ?? item.variant?.product?.basePrice ?? 0;
    return sum + effectivePrice * item.quantity;
  }, 0);

  const isEmpty = items.length === 0;
  const hasOutOfStock = items.some((item) => item.variant?.stock === 0);
  const isDisabled = isEmpty || hasOutOfStock;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-semibold">${subtotal.toFixed(2)}</span>
      </div>

      {hasOutOfStock && (
        <p className="text-xs text-destructive">
          Remove out-of-stock items before proceeding to checkout.
        </p>
      )}

      <Button asChild className="w-full" disabled={isDisabled} onClick={onCheckout}>
        <Link href="/checkout">Proceed to Checkout</Link>
      </Button>
    </div>
  );
}
