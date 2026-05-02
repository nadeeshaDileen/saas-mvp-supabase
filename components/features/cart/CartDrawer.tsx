"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/hooks/useCart";

export function CartDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const effectivePrice = item.variant?.priceOverride ?? item.variant?.product?.basePrice ?? 0;
    return sum + (effectivePrice * item.quantity);
  }, 0);

  function handleCheckout() {
    setOpen(false);
    router.push('/checkout');
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <ShoppingCart className="h-5 w-5" />
        {totalQuantity > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {totalQuantity > 99 ? "99+" : totalQuantity}
          </span>
        )}
      </Button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            backgroundColor: 'rgba(0,0,0,0.4)'
          }}
          onClick={() => setOpen(false)}
        />
      )}

      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100%',
          maxWidth: '28rem',
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 6px -1px rgba(0,0,0,0.1)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms'
        }}
      >
        {/* HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e5e7eb',
          padding: '12px 16px',
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Your Cart</h2>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ITEMS AREA */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#f9fafb'
        }}>
          {items.length === 0 ? (
            <div style={{
              display: 'flex',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Your cart is empty.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item) => {
                const variant = item.variant;
                const product = variant?.product;
                const effectivePrice = variant?.priceOverride ?? product?.basePrice ?? 0;
                const lineTotal = effectivePrice * item.quantity;
                const firstImage = product?.images?.[0]?.url ?? null;

                return (
                  <div key={item.id} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      {/* IMAGE */}
                      <div style={{
                        position: 'relative',
                        width: '70px',
                        height: '70px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {firstImage ? (
                          <Image
                            src={firstImage}
                            alt={product?.name ?? "Product"}
                            fill
                            sizes="70px"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            display: 'flex',
                            height: '100%',
                            width: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            color: '#9ca3af'
                          }}>
                            No image
                          </div>
                        )}
                      </div>

                      {/* DETAILS */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product?.name ?? "Unknown product"}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                          {variant?.size} · {variant?.color}
                        </p>
                        <p style={{ fontSize: '15px', fontWeight: 700 }}>
                          ${lineTotal.toFixed(2)}
                        </p>
                      </div>

                      {/* REMOVE */}
                      <button
                        onClick={() => removeItem.mutate({ itemId: item.id, variantId: item.variantId })}
                        disabled={removeItem.isPending}
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#9ca3af',
                          cursor: removeItem.isPending ? 'not-allowed' : 'pointer',
                          opacity: removeItem.isPending ? 0.5 : 1
                        }}
                      >
                        <Trash2 style={{ width: '18px', height: '18px' }} />
                      </button>
                    </div>

                    {/* QUANTITY */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => updateItem.mutate({ 
                          itemId: item.id, 
                          variantId: item.variantId, 
                          quantity: item.quantity - 1 
                        })}
                        disabled={updateItem.isPending}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: updateItem.isPending ? 'not-allowed' : 'pointer',
                          opacity: updateItem.isPending ? 0.5 : 1
                        }}
                      >
                        <Minus style={{ width: '14px', height: '14px' }} />
                      </button>
                      <span style={{ fontSize: '14px', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItem.mutate({ 
                          itemId: item.id, 
                          variantId: item.variantId, 
                          quantity: item.quantity + 1 
                        })}
                        disabled={updateItem.isPending}
                        style={{
                          width: '32px',
                          height: '32px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: updateItem.isPending ? 'not-allowed' : 'pointer',
                          opacity: updateItem.isPending ? 0.5 : 1
                        }}
                      >
                        <Plus style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SUMMARY */}
        {items.length > 0 && (
          <div style={{
            borderTop: '1px solid #e5e7eb',
            padding: '16px',
            backgroundColor: '#ffffff'
          }}>
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px',
                fontSize: '14px'
              }}>
                <span style={{ color: '#6b7280' }}>Subtotal</span>
                <span style={{ fontWeight: 700, fontSize: '18px' }}>${subtotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
