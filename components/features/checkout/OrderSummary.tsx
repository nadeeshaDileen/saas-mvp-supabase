import Image from "next/image";
import type { CartItem } from "@/types/store";

interface OrderSummaryProps {
  items: CartItem[];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents);
}

export function OrderSummary({ items }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => {
    const effectivePrice =
      item.variant?.priceOverride ?? item.variant?.product?.basePrice ?? 0;
    return sum + effectivePrice * item.quantity;
  }, 0);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Your cart is empty.</p>
      ) : (
        <ul className="divide-y">
          {items.map((item) => {
            const effectivePrice =
              item.variant?.priceOverride ?? item.variant?.product?.basePrice ?? 0;
            const lineTotal = effectivePrice * item.quantity;
            const productName = item.variant?.product?.name ?? "Product";
            const size = item.variant?.size ?? "";
            const color = item.variant?.color ?? "";
            const firstImage = item.variant?.product?.images?.[0]?.url ?? null;

            return (
              <li key={item.id} className="flex items-start gap-3 py-3">
                {/* Product Image */}
                <div style={{
                  position: 'relative',
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {firstImage ? (
                    <Image
                      src={firstImage}
                      alt={productName}
                      fill
                      sizes="60px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      height: '100%',
                      width: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: '#9ca3af'
                    }}>
                      No image
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{productName}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {size} / {color} &times; {item.quantity}
                  </p>
                  <span className="text-sm font-medium mt-1 block">{formatPrice(lineTotal)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <span className="font-semibold">Subtotal</span>
        <span className="font-semibold">{formatPrice(subtotal)}</span>
      </div>
    </div>
  );
}
