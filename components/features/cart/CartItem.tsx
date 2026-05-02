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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      paddingTop: '16px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e5e7eb',
      minHeight: '120px'
    }}>
      {isOutOfStock && (
        <div style={{
          borderRadius: '6px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 500,
          color: '#dc2626'
        }}>
          This item is out of stock and will be removed at checkout.
        </div>
      )}
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Product image */}
        <div style={{
          position: 'relative',
          height: '80px',
          width: '80px',
          flexShrink: 0,
          overflow: 'hidden',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#f3f4f6'
        }}>
          {firstImage ? (
            <Image 
              src={firstImage} 
              alt={product?.name ?? "Product"} 
              fill 
              sizes="80px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: '12px'
            }}>
              No image
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: '4px',
          minWidth: 0
        }}>
          <p style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {product?.name ?? "Unknown product"}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            {variant?.size} · {variant?.color}
          </p>
          <p style={{ fontSize: '14px', fontWeight: 600 }}>${lineTotal.toFixed(2)}</p>
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        alignSelf: 'flex-end'
      }}>
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
        <span style={{
          width: '24px',
          textAlign: 'center',
          fontSize: '14px',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {item.quantity}
        </span>
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
